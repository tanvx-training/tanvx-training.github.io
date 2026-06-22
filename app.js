document.addEventListener('DOMContentLoaded', () => {
    const sidebarNav = document.getElementById('sidebar-nav');
    const markdownBody = document.getElementById('markdown-body');
    const loading = document.getElementById('loading');
    const breadcrumbs = document.getElementById('breadcrumbs');
    const themeToggle = document.getElementById('theme-toggle');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    const heroWelcomeHTML = markdownBody.innerHTML;
    let siteData = [];

    // Initialize Marked
    marked.setOptions({
        gfm: true,
        breaks: true
    });

    // Theme Toggle Logic
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    };

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Mobile Sidebar Toggle
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Fetch and render data
    const loadData = async () => {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Cannot load data.json');
            siteData = await response.json();
            renderSidebar(siteData);
            handleRouting();
        } catch (error) {
            console.error('Error loading data:', error);
            markdownBody.innerHTML = `<div class="error">
                <h2>Error</h2>
                <p>Could not load the navigation data. Please make sure you are running via a local server (e.g. npx serve).</p>
            </div>`;
        }
    };

    const renderSidebar = (data) => {
        sidebarNav.innerHTML = '';
        data.forEach(category => {
            const catDiv = document.createElement('div');
            catDiv.className = 'nav-category';
            
            const catTitle = document.createElement('div');
            catTitle.className = 'nav-category-title';
            catTitle.textContent = category.category;
            catDiv.appendChild(catTitle);

            category.files.forEach(file => {
                const navItem = document.createElement('a');
                navItem.className = 'nav-item';
                navItem.textContent = file.name;
                navItem.href = `#${file.path}`;
                navItem.dataset.path = file.path;
                navItem.dataset.name = file.name;
                navItem.dataset.category = category.category;
                catDiv.appendChild(navItem);
            });

            sidebarNav.appendChild(catDiv);
        });
    };

    const loadContent = async (path, name, category) => {
        markdownBody.style.display = 'none';
        loading.style.display = 'block';

        // Update Breadcrumbs
        breadcrumbs.innerHTML = `<span class="breadcrumb-item">${category}</span> / <span class="breadcrumb-item active">${name}</span>`;

        try {
            const response = await fetch(`content/${path}`);
            if (!response.ok) throw new Error('File not found');
            const mdText = await response.text();
            
            // Fix absolute paths inside markdown if they point to local files/images
            // For now, assume it's standard markdown
            
            markdownBody.innerHTML = marked.parse(mdText);
            
            // Apply syntax highlighting
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // Small delay to allow CSS animations
            setTimeout(() => {
                loading.style.display = 'none';
                markdownBody.style.display = 'block';
                // Trigger reflow for animation
                markdownBody.style.animation = 'none';
                markdownBody.offsetHeight; 
                markdownBody.style.animation = 'fadeIn 0.4s ease-out';
                
                // On mobile, close sidebar after clicking
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            }, 150);

        } catch (error) {
            console.error(error);
            loading.style.display = 'none';
            markdownBody.style.display = 'block';
            markdownBody.innerHTML = `<h2>Error 404</h2><p>Content not found.</p>`;
        }
    };

    const handleRouting = () => {
        const hash = window.location.hash;
        
        // Remove active class from all
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        if (!hash || hash === '#') {
            markdownBody.innerHTML = heroWelcomeHTML;
            breadcrumbs.innerHTML = `<span class="breadcrumb-item active">Welcome</span>`;
            return;
        }

        const path = hash.substring(1);
        const targetNav = document.querySelector(`.nav-item[data-path="${path}"]`);
        
        if (targetNav) {
            targetNav.classList.add('active');
            targetNav.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            loadContent(targetNav.dataset.path, targetNav.dataset.name, targetNav.dataset.category);
        } else {
            // Path not found in sidebar
            loadContent(path, 'Unknown', 'Unknown');
        }
    };

    window.addEventListener('hashchange', handleRouting);

    initTheme();
    loadData();
});
