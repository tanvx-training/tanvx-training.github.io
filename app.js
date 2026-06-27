document.addEventListener('DOMContentLoaded', () => {
    const sidebarNav = document.getElementById('sidebar-nav');
    const markdownBody = document.getElementById('markdown-body');
    const loading = document.getElementById('loading');
    const breadcrumbs = document.getElementById('breadcrumbs');
    const themeToggle = document.getElementById('theme-toggle');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const searchInput = document.getElementById('search-input');
    const examTimerBtn = document.getElementById('exam-timer');
    const timerDisplay = document.getElementById('timer-display');
    
    // 100-Day Plan elements
    const btnStartPlan = document.getElementById('btn-start-plan');
    const planProgressContainer = document.getElementById('plan-progress-container');
    const planProgressBar = document.getElementById('plan-progress-bar');
    const planInfo = document.getElementById('plan-info');
    const btnOpen100Days = document.getElementById('btn-open-100-days');
    const planViewArea = document.getElementById('plan-view-area');
    const contentArea = document.getElementById('content-area');
    const planGrid = document.getElementById('plan-grid');

    let siteData = [];
    let planData = [];
    let completedFiles = JSON.parse(localStorage.getItem('ckadCompleted') || '[]');
    let completedDays = JSON.parse(localStorage.getItem('ckadCompletedDays') || '[]');
    let currentPath = '';

    // Initialize Marked
    marked.setOptions({
        gfm: true,
        breaks: true
    });

    // --- Theme Logic ---
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
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

    // --- Mobile Sidebar Logic ---
    mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // --- Search Logic ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.nav-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(term)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });

    // --- Exam Timer Logic ---
    let timerInterval = null;
    let timeRemaining = 120 * 60; // 120 minutes
    
    const updateTimerDisplay = () => {
        const m = Math.floor(timeRemaining / 60);
        const s = timeRemaining % 60;
        timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (timeRemaining < 15 * 60) {
            examTimerBtn.classList.add('critical');
        } else {
            examTimerBtn.classList.remove('critical');
        }
    };

    examTimerBtn.addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            timeRemaining = 120 * 60;
            updateTimerDisplay();
            timerDisplay.textContent = "120:00 (Reset)";
            setTimeout(updateTimerDisplay, 2000);
        } else {
            timeRemaining = 120 * 60;
            updateTimerDisplay();
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateTimerDisplay();
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    alert("Time's up! Mock Exam finished.");
                }
            }, 1000);
        }
    });

    // --- 100-Day Study Plan Logic ---
    const updateStudyPlanWidget = () => {
        const startDate = localStorage.getItem('studyPlanStart');
        if (startDate) {
            btnStartPlan.style.display = 'none';
            planProgressContainer.style.display = 'block';
            
            const start = new Date(parseInt(startDate));
            const now = new Date();
            const diffTime = Math.abs(now - start);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const currentDay = Math.min(diffDays, 100);
            
            const percent = completedDays.length; // Max 100 days
            planProgressBar.style.width = `${percent}%`;
            planInfo.innerHTML = `Day <strong>${currentDay}</strong>/100 &bull; Progress: <strong>${percent}%</strong>`;
        }
    };

    btnStartPlan.addEventListener('click', () => {
        localStorage.setItem('studyPlanStart', Date.now().toString());
        updateStudyPlanWidget();
    });

    btnOpen100Days.addEventListener('click', () => {
        showPlanView();
    });

    const showPlanView = () => {
        contentArea.style.display = 'none';
        planViewArea.style.display = 'block';
        breadcrumbs.innerHTML = `<span class="breadcrumb-item">100-Day Plan</span>`;
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
        renderPlanGrid();
    };

    // Render the 100 days grid
    const renderPlanGrid = () => {
        planGrid.innerHTML = '';
        
        // Helper to format path to a friendly name if needed
        const getFileName = (path) => {
            const parts = path.split('/');
            let name = parts[parts.length - 1];
            name = name.replace('.md', '').replace(/^[\d\w]+[-_.]/, '').replace(/[-_]/g, ' ');
            return name.charAt(0).toUpperCase() + name.slice(1);
        };

        planData.forEach(dayInfo => {
            const isCompleted = completedDays.includes(dayInfo.day);
            const card = document.createElement('div');
            card.className = `day-card ${isCompleted ? 'completed' : ''}`;
            
            let html = `
                <div class="day-header">
                    <div>
                        <span class="day-number">Ngày ${dayInfo.day}</span>
                        <h3 class="day-title">${dayInfo.title}</h3>
                    </div>
                    <div class="day-checkbox ${isCompleted ? 'checked' : ''}" data-day="${dayInfo.day}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
                <div class="day-body">
            `;

            if (dayInfo.knowledge && dayInfo.knowledge.length > 0) {
                html += `<div class="day-section-title">📖 Kiến Thức</div><ul class="day-link-list">`;
                dayInfo.knowledge.forEach(path => {
                    html += `<li><a href="#${path}" class="day-link" data-path="${path}">📄 ${getFileName(path)}</a></li>`;
                });
                html += `</ul>`;
            }

            if (dayInfo.exercises && dayInfo.exercises.length > 0) {
                html += `<div class="day-section-title">💻 Thực Hành</div><ul class="day-link-list">`;
                dayInfo.exercises.forEach(path => {
                    html += `<li><a href="#${path}" class="day-link" data-path="${path}">📝 ${getFileName(path)}</a></li>`;
                });
                html += `</ul>`;
            }

            if (dayInfo.notes) {
                html += `<div class="day-notes">${dayInfo.notes}</div>`;
            }

            html += `</div>`;
            card.innerHTML = html;

            // Add events
            const checkbox = card.querySelector('.day-checkbox');
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                const day = parseInt(checkbox.dataset.day);
                if (completedDays.includes(day)) {
                    completedDays = completedDays.filter(d => d !== day);
                    checkbox.classList.remove('checked');
                    card.classList.remove('completed');
                } else {
                    completedDays.push(day);
                    checkbox.classList.add('checked');
                    card.classList.add('completed');
                }
                localStorage.setItem('ckadCompletedDays', JSON.stringify(completedDays));
                updateStudyPlanWidget();
            });

            // Handle link clicks to open the specific markdown
            card.querySelectorAll('.day-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    // It's a standard anchor link that changes hash, but we also want to toggle view
                    planViewArea.style.display = 'none';
                    contentArea.style.display = 'block';
                });
            });

            planGrid.appendChild(card);
        });
    };

    // --- Data Rendering ---
    const loadData = async () => {
        try {
            // Load both data files
            const [respData, respPlan] = await Promise.all([
                fetch('data.json'),
                fetch('100-days.json')
            ]);
            
            if (!respData.ok) throw new Error('Cannot load data.json');
            if (!respPlan.ok) throw new Error('Cannot load 100-days.json');

            siteData = await respData.json();
            planData = await respPlan.json();

            renderSidebar(siteData);
            updateStudyPlanWidget();
            handleRouting();
        } catch (error) {
            console.error('Error loading data:', error);
            markdownBody.innerHTML = `<div class="error"><h2>Error</h2><p>Could not load navigation data.</p></div>`;
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
                if (completedFiles.includes(file.path)) navItem.classList.add('completed');
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

    // --- Content Loading & Enhancements ---
    const enhanceMarkdown = () => {
        document.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
        
        document.querySelectorAll('pre').forEach(pre => {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
            btn.addEventListener('click', () => {
                const code = pre.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    btn.classList.add('copied');
                    btn.innerHTML = `✅ Copied`;
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
                    }, 2000);
                });
            });
            pre.appendChild(btn);
        });

        if (currentPath && currentPath !== 'CKAD-Study-Guide.md') {
            const section = document.createElement('div');
            section.className = 'completion-section';
            const isCompleted = completedFiles.includes(currentPath);
            
            const btn = document.createElement('button');
            btn.className = `btn-complete ${isCompleted ? 'completed' : ''}`;
            btn.innerHTML = isCompleted ? '✅ Đã hoàn thành' : 'Đánh dấu đã học';
            
            btn.addEventListener('click', () => {
                if (completedFiles.includes(currentPath)) {
                    completedFiles = completedFiles.filter(p => p !== currentPath);
                    btn.classList.remove('completed');
                    btn.innerHTML = 'Đánh dấu đã học';
                } else {
                    completedFiles.push(currentPath);
                    btn.classList.add('completed');
                    btn.innerHTML = '✅ Đã hoàn thành';
                }
                localStorage.setItem('ckadCompleted', JSON.stringify(completedFiles));
                
                const navItem = document.querySelector(`.nav-item[data-path="${currentPath}"]`);
                if (navItem) {
                    if (completedFiles.includes(currentPath)) navItem.classList.add('completed');
                    else navItem.classList.remove('completed');
                }
            });
            
            section.appendChild(btn);
            markdownBody.appendChild(section);
        }
    };

    const loadContent = async (path, name, category) => {
        currentPath = path;
        
        // Ensure standard view is shown
        planViewArea.style.display = 'none';
        contentArea.style.display = 'block';
        
        markdownBody.style.display = 'none';
        loading.style.display = 'block';
        breadcrumbs.innerHTML = `<span class="breadcrumb-item">${category}</span> / <span class="breadcrumb-item active">${name}</span>`;

        try {
            const response = await fetch(`content/${path}`);
            if (!response.ok) throw new Error('File not found');
            const mdText = await response.text();
            
            markdownBody.innerHTML = marked.parse(mdText);
            enhanceMarkdown();
            
            setTimeout(() => {
                loading.style.display = 'none';
                markdownBody.style.display = 'block';
                markdownBody.style.animation = 'none';
                markdownBody.offsetHeight; 
                markdownBody.style.animation = 'fadeIn 0.4s ease-out';
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            }, 100);
        } catch (error) {
            console.error(error);
            loading.style.display = 'none';
            markdownBody.style.display = 'block';
            markdownBody.innerHTML = `<h2>Error 404</h2><p>Content not found.</p>`;
        }
    };

    const handleRouting = () => {
        const hash = window.location.hash;
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        if (!hash || hash === '#') {
            loadContent('CKAD-Study-Guide.md', 'Trang chủ', 'Welcome');
            return;
        }

        const path = hash.substring(1);
        
        // Special case: if routing to 100 days explicitly
        if (path === 'plan-100-days') {
            showPlanView();
            return;
        }

        const targetNav = document.querySelector(`.nav-item[data-path="${path}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
            targetNav.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            loadContent(targetNav.dataset.path, targetNav.dataset.name, targetNav.dataset.category);
        } else {
            loadContent(path, 'Unknown', 'Unknown');
        }
    };

    window.addEventListener('hashchange', handleRouting);

    // Bootstrap
    initTheme();
    loadData();
});
