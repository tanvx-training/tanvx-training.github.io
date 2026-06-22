# 📘 Lộ trình & Tài liệu luyện thi CKAD (cho người mới bắt đầu)

Bộ tài liệu này được biên soạn để đi **kèm** với các file bài tập gốc trong repo
(`a.core_concepts.md` … `j.podman.md`). Các file gốc chỉ có **câu hỏi + lệnh giải**,
giả định bạn đã biết kiến thức nền. Bộ `study-guide/` này bổ sung phần **giải thích
khái niệm, lý do, mẹo thi và lộ trình** để một người mới hoàn toàn có thể đi từ con số 0
đến đậu kỳ thi CKAD.

> **CKAD = Certified Kubernetes Application Developer.** Đây là kỳ thi **thực hành 100%**
> (hands-on) trên cluster thật, **không có câu hỏi trắc nghiệm**. Bạn ngồi trước terminal
> và giải khoảng 15–20 bài trong **2 giờ**. Vì vậy: *gõ lệnh nhanh và chính xác* quan
> trọng hơn *học thuộc lý thuyết*.

---

## 🗂️ Thứ tự đọc tài liệu

| # | File | Nội dung | Khi nào đọc |
|---|------|----------|-------------|
| 0 | [00-tong-quan-ky-thi-va-ke-hoach.md](00-tong-quan-ky-thi-va-ke-hoach.md) | Kỳ thi CKAD là gì, domain & tỷ trọng, lộ trình 6 tuần | Đầu tiên |
| 1 | [01-thiet-lap-moi-truong.md](01-thiet-lap-moi-truong.md) | Cài cluster luyện tập + tăng tốc `kubectl` (alias, vim) | Trước khi làm bài tập |
| 2 | [02-kien-thuc-nen-tang-k8s.md](02-kien-thuc-nen-tang-k8s.md) | Kiến trúc K8s, Pod/Deployment/Service, YAML, namespace | Tuần 1 |
| 3 | [03-core-concepts.md](03-core-concepts.md) | Đi kèm `a.core_concepts.md` | Tuần 1–2 |
| 4 | [04-multi-container-pods.md](04-multi-container-pods.md) | Đi kèm `b.multi_container_pods.md` | Tuần 2 |
| 5 | [05-pod-design.md](05-pod-design.md) | Đi kèm `c.pod_design.md` (labels, Deployment, Job, CronJob) | Tuần 2–3 |
| 6 | [06-configuration.md](06-configuration.md) | Đi kèm `d.configuration.md` (ConfigMap, Secret, SecurityContext, Quota) | Tuần 3 |
| 7 | [07-observability.md](07-observability.md) | Đi kèm `e.observability.md` (probes, logging, debug) | Tuần 3–4 |
| 8 | [08-services-networking.md](08-services-networking.md) | Đi kèm `f.services.md` (Service, NetworkPolicy, Ingress) | Tuần 4 |
| 9 | [09-state-persistence.md](09-state-persistence.md) | Đi kèm `g.state.md` (Volume, PV, PVC) | Tuần 4–5 |
| 10 | [10-helm-crd-podman.md](10-helm-crd-podman.md) | Đi kèm `h.helm.md`, `i.crd.md`, `j.podman.md` | Tuần 5 |
| 11 | [11-mock-exam-va-checklist.md](11-mock-exam-va-checklist.md) | Đề thi thử 1 (cơ bản), checklist ngày thi, mẹo quản lý thời gian | Tuần 5–6 |
| 12 | [12-de-thi-thu-2-trung-cap.md](12-de-thi-thu-2-trung-cap.md) | Đề thi thử 2 — 16 câu, mức trung cấp, bấm giờ 90' | Tuần 6 |
| 13 | [13-de-thi-thu-3-nang-cao.md](13-de-thi-thu-3-nang-cao.md) | Đề thi thử 3 — 15 câu, mức nâng cao (kiểu killer.sh) | Tuần 6 |
| 📑 | [solutions/](solutions/README.md) | **Lời giải chi tiết có chú thích cho cả 10 file bài tập gốc (a→j)** | Khi luyện từng domain |

---

## 🎯 Triết lý luyện tập

1. **Đọc lý thuyết → xem tài liệu chính thức → làm bài tập → tự làm lại không nhìn đáp án.**
2. **Mỗi bài tập làm 3 lần:** lần 1 nhìn đáp án, lần 2 nhìn gợi ý, lần 3 làm mù.
3. **Bấm giờ.** Mỗi bài trong đề thật chỉ có ~6–7 phút. Tập tốc độ từ sớm.
4. **Dùng `kubectl` imperative + `--dry-run` để tạo YAML**, đừng gõ YAML từ đầu.
5. **Luôn thành thạo tra cứu** trên https://kubernetes.io/docs — trong phòng thi bạn
   được mở **một** tab tài liệu chính thức.

> 💡 **Lời giải chi tiết:** Thư mục [`solutions/`](solutions/README.md) giải từng câu của cả
> 10 file bài tập gốc (a→j), kèm chú thích từng cờ/trường và bẫy hay gặp. Tự làm trước rồi mới
> mở đối chiếu.

> Mẹo: Nếu bạn muốn giao tiếp ngắn gọn với tôi trong lúc luyện tập, gõ `/caveman`.
> Bắt đầu ngay với file [00](00-tong-quan-ky-thi-va-ke-hoach.md). Chúc bạn thi tốt! 🚀
