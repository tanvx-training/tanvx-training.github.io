const fs = require('fs');
const path = require('path');

const days = [];
let currentDay = 1;

// Helper to add a day
const addDay = (title, knowledge = [], exercises = [], notes = "") => {
  days.push({
    day: currentDay++,
    title,
    knowledge,
    exercises,
    notes
  });
};

// CKAD Curriculum Mapping (approximate)
const topics = [
  { title: "Core Concepts - Cluster Architecture", k: ["study-guide/00-tong-quan-ky-thi-va-ke-hoach.md", "study-guide/01-thiet-lap-moi-truong.md"], e: [], n: "Hiểu kiến trúc K8s, cách setup cụm lab." },
  { title: "Core Concepts - Basic APIs", k: ["study-guide/02-kien-thuc-nen-tang-k8s.md", "study-guide/03-core-concepts.md"], e: ["exercises/a.core_concepts.md"], n: "Làm quen với kubectl, namespaces, pods cơ bản." },
  { title: "Multi-Container Pods", k: ["study-guide/04-multi-container-pods.md"], e: ["exercises/b.multi_container_pods.md"], n: "Sidecar, Ambassador, Adapter patterns." },
  { title: "Pod Design - Labels & Selectors", k: ["study-guide/05-pod-design.md"], e: ["exercises/c.pod_design.md"], n: "Cách K8s dùng label để nhóm resources." },
  { title: "Pod Design - Deployments", k: ["study-guide/05-pod-design.md"], e: ["exercises/c.pod_design.md"], n: "Rollout, Rollback, Scaling." },
  { title: "Pod Design - Jobs & CronJobs", k: ["study-guide/05-pod-design.md"], e: ["exercises/c.pod_design.md"], n: "Chạy task 1 lần hoặc định kỳ." },
  { title: "Configuration - ConfigMaps & Secrets", k: ["study-guide/06-configuration.md"], e: ["exercises/d.configuration.md"], n: "Tách cấu hình ra khỏi code." },
  { title: "Configuration - SecurityContext & ServiceAccounts", k: ["study-guide/06-configuration.md"], e: ["exercises/d.configuration.md"], n: "Quản lý quyền và bảo mật cho Pod." },
  { title: "Configuration - Resource Quotas", k: ["study-guide/06-configuration.md"], e: ["exercises/d.configuration.md"], n: "Giới hạn tài nguyên CPU/Memory." },
  { title: "Observability - Liveness & Readiness", k: ["study-guide/07-observability.md"], e: ["exercises/e.observability.md"], n: "Cấu hình Health checks." },
  { title: "Observability - Logging & Debugging", k: ["study-guide/07-observability.md"], e: ["exercises/e.observability.md"], n: "Dùng kubectl logs và describe để fix lỗi." },
  { title: "Services & Networking", k: ["study-guide/08-services-networking.md"], e: ["exercises/f.services.md"], n: "ClusterIP, NodePort, LoadBalancer." },
  { title: "Network Policies", k: ["study-guide/08-services-networking.md"], e: ["exercises/f.services.md"], n: "Kiểm soát traffic giữa các Pods." },
  { title: "State Persistence - Volumes", k: ["study-guide/09-state-persistence.md"], e: ["exercises/g.state.md"], n: "EmptyDir, HostPath." },
  { title: "State Persistence - PV & PVC", k: ["study-guide/09-state-persistence.md"], e: ["exercises/g.state.md"], n: "Storage bền vững cho DB." },
  { title: "Helm Package Manager", k: ["study-guide/10-helm-crd-podman.md"], e: ["exercises/h.helm.md"], n: "Cách install, upgrade release." },
  { title: "CRDs (Custom Resource Definitions)", k: ["study-guide/10-helm-crd-podman.md"], e: ["exercises/i.crd.md"], n: "Mở rộng API của K8s." },
  { title: "Podman basics", k: ["study-guide/10-helm-crd-podman.md"], e: ["exercises/j.podman.md"], n: "Build và run container bằng Podman thay vì Docker." }
];

// Phase 1: Intensive Learning (Day 1 - 40)
// We will spread out the topics. Each topic gets roughly 2 days (1 for reading, 1 for exercises)
topics.forEach(t => {
  addDay(`${t.title} (Lý Thuyết)`, t.k, [], t.n);
  addDay(`${t.title} (Thực Hành)`, [], t.e, "Thực hành kỹ các bài tập liên quan. Gõ lệnh càng nhiều càng tốt.");
});

// Now we have 36 days filled.
// Phase 2: Deep Dive & Review (Day 37 - 70)
// Reviewing sections again but with focus on speed
while (currentDay <= 70) {
    const randomTopicIndex = (currentDay - 37) % topics.length;
    const t = topics[randomTopicIndex];
    addDay(
        `Ôn Tập: ${t.title}`, 
        t.k, 
        t.e, 
        "Ôn tập lại chủ đề này. Mục tiêu: Hoàn thành bài tập mà không cần nhìn Docs quá nhiều."
    );
}

// Phase 3: Mock Exams (Day 71 - 100)
// Interleaving Mock Exams and Rest/Review days
while (currentDay <= 100) {
    if (currentDay % 5 === 0) {
        addDay("Nghỉ Ngơi / Tự Đánh Giá", [], [], "Dành ngày hôm nay để review lại những điểm yếu. Không học kiến thức mới.");
    } else if (currentDay % 3 === 0) {
        addDay(
            "Mock Exam - Đề Thi Thử", 
            ["study-guide/11-mock-exam-va-checklist.md", "study-guide/12-de-thi-thu-2-trung-cap.md", "study-guide/13-de-thi-thu-3-nang-cao.md"], 
            [], 
            "Bật đồng hồ đếm ngược 2 tiếng. Cố gắng làm đạt > 66%."
        );
    } else {
        addDay("Luyện Tập Tổng Hợp", [], ["exercises/c.pod_design.md", "exercises/d.configuration.md"], "Giải lại các bài tập khó (Pod Design, Configuration) bằng imperative commands.");
    }
}

// Write to JSON
const outputFile = path.join(__dirname, '100-days.json');
fs.writeFileSync(outputFile, JSON.stringify(days, null, 2));
console.log(`Successfully generated 100-days.json with ${days.length} days.`);
