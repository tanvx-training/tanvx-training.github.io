# 0. Tổng quan kỳ thi CKAD & Kế hoạch học tập

## 0.1. CKAD là gì?

**CKAD (Certified Kubernetes Application Developer)** là chứng chỉ do **CNCF** (Cloud
Native Computing Foundation) cấp, dành cho người **xây dựng, cấu hình và triển khai ứng
dụng** trên Kubernetes (khác với CKA dành cho người *vận hành* cluster).

| Thuộc tính | Chi tiết |
|------------|----------|
| Hình thức | **Thực hành 100%** trên cluster thật qua trình duyệt (không trắc nghiệm) |
| Thời lượng | **2 giờ** |
| Số câu | ~15–20 bài, mỗi bài có trọng số % |
| Điểm đậu | **66%** |
| Hiệu lực | **2 năm** |
| Số lần thi lại | 1 lần retake miễn phí (kèm theo gói thi) |
| Công cụ | Terminal trong trình duyệt + **1 tab** tài liệu kubernetes.io được phép mở |
| Phiên bản K8s | Thường là bản mới nhất gần thời điểm thi (kiểm tra trên trang đăng ký) |

### Được phép mở tài liệu nào trong lúc thi?
- https://kubernetes.io/docs/ (và subdomain `/blog`)
- https://helm.sh/docs/
- Không được dùng Google, ChatGPT, ghi chú cá nhân, v.v.

→ **Hệ quả quan trọng:** Bạn KHÔNG cần học thuộc cú pháp YAML dài dòng. Bạn cần biết
**tra nhanh** và **tạo YAML bằng `kubectl ... --dry-run=client -o yaml`**.

---

## 0.2. Các domain (lĩnh vực) và tỷ trọng

> ⚠️ **Lưu ý:** Repo này đặt tên file theo tỷ trọng CŨ (Core Concepts 13%, …). Tỷ trọng
> **CHÍNH THỨC hiện hành** (vẫn áp dụng đến 2026) như bảng dưới. Nội dung kiến thức về
> cơ bản giống nhau, chỉ là cách nhóm/đặt tên khác. Bạn cứ luyện theo file repo, nhưng
> hiểu rõ ánh xạ sau:

| Domain chính thức | Tỷ trọng | File repo tương ứng |
|-------------------|:---:|---------------------|
| **Application Design and Build** | **20%** | `a.core_concepts`, `b.multi_container_pods`, `c.pod_design` (Job/CronJob), `g.state` (volumes), `j.podman` |
| **Application Deployment** | **20%** | `c.pod_design` (Deployment, rolling update, rollback), `h.helm` |
| **Application Environment, Configuration and Security** | **25%** | `d.configuration` (ConfigMap, Secret, SecurityContext, ServiceAccount, Quota), `i.crd` |
| **Services and Networking** | **20%** | `f.services` |
| **Application Observability and Maintenance** | **15%** | `e.observability` (probes, logs, debug, deprecation) |

**Domain nặng điểm nhất là Configuration & Security (25%)** và 3 domain còn lại đều 20%
→ phân bổ thời gian học tương ứng, đừng sa đà quá nhiều vào Helm/CRD (chỉ chiếm phần nhỏ).

---

## 0.3. Yêu cầu kiến thức nền trước khi bắt đầu

Bạn KHÔNG cần là chuyên gia, nhưng nên có:
- [ ] Biết dùng terminal Linux cơ bản (`cd`, `ls`, `cat`, `grep`, pipe `|`, `>` redirect).
- [ ] Hiểu container/Docker là gì (image, container, port). Nếu chưa, đọc nhanh phần đầu
      file `02-kien-thuc-nen-tang-k8s.md`.
- [ ] Biết một trình soạn thảo terminal: **`vim`** (khuyến nghị — phải biết tối thiểu) hoặc `nano`.

> Nếu bạn chưa biết vim: học 10 lệnh tối thiểu trong file `01-thiet-lap-moi-truong.md`.
> Trong phòng thi không có VS Code — bạn sửa YAML bằng vim/nano qua terminal.

---

## 0.4. Lộ trình 6 tuần (cho người đi làm, ~1–1.5h/ngày)

> Có thể nén còn 3–4 tuần nếu bạn học toàn thời gian. Nguyên tắc: **80% thời gian là gõ
> tay trên cluster**, 20% đọc lý thuyết.

### Tuần 1 — Nền tảng & Core Concepts
- Đọc `02-kien-thuc-nen-tang-k8s.md` (kiến trúc, Pod, YAML, namespace).
- Thiết lập môi trường theo `01-thiet-lap-moi-truong.md` (cluster + alias + vim).
- Làm `a.core_concepts.md` cùng `03-core-concepts.md`. Mục tiêu: tạo/xem/xoá Pod, đọc log,
  exec, dùng `--dry-run` thành thạo.

### Tuần 2 — Multi-container & Pod Design (phần 1)
- `b.multi_container_pods.md` + `04-multi-container-pods.md`: sidecar, init container, emptyDir.
- `c.pod_design.md` (phần Labels/Annotations + Pod placement) + `05-pod-design.md`.

### Tuần 3 — Pod Design (phần 2) & Configuration
- `c.pod_design.md` (Deployment, rolling update, rollback, Job, CronJob).
- `d.configuration.md` + `06-configuration.md`: ConfigMap, Secret, SecurityContext,
  ResourceQuota/LimitRange, ServiceAccount. **Đây là domain nặng nhất — học kỹ.**

### Tuần 4 — Observability & Services/Networking
- `e.observability.md` + `07-observability.md`: liveness/readiness/startup probe, logs, debug.
- `f.services.md` + `08-services-networking.md`: Service (ClusterIP/NodePort), Endpoints,
  NetworkPolicy, Ingress (đọc thêm).

### Tuần 5 — State, Helm, CRD, Podman + ôn tập
- `g.state.md` + `09-state-persistence.md`: Volume, PV, PVC.
- `h.helm`, `i.crd`, `j.podman` + `10-helm-crd-podman.md` (học vừa đủ, đừng quá sâu).
- Bắt đầu làm lại toàn bộ bài tập **không nhìn đáp án**, bấm giờ.

### Tuần 6 — Luyện đề & tốc độ
- Làm đề thi thử trong `11-mock-exam-va-checklist.md`, bấm giờ nghiêm túc.
- Mua/làm thử **killer.sh** (đi kèm voucher thi — xem mục 0.6). Làm 2 lần.
- Rà soát checklist ngày thi. Tối ưu alias, luyện vim, luyện tra cứu nhanh.

---

## 0.5. Cách làm mỗi bài tập (rất quan trọng)

```
Lần 1: Đọc câu hỏi → thử tự nghĩ → xem đáp án → gõ theo → hiểu vì sao.
Lần 2 (hôm sau): Làm lại, chỉ liếc gợi ý khi bí.
Lần 3 (vài ngày sau): Làm "mù" hoàn toàn, bấm giờ.
```

Quy tắc vàng khi gặp bài mới:
1. Đọc kỹ **namespace** yêu cầu (rất hay bị mất điểm vì tạo nhầm namespace).
2. Ưu tiên **lệnh imperative** để tạo nhanh; chỉ viết YAML khi bắt buộc.
3. Cần YAML phức tạp → `kubectl create ... --dry-run=client -o yaml > file.yaml` rồi sửa.
4. **Luôn verify** sau khi tạo: `kubectl get`, `kubectl describe`.

---

## 0.6. Tài nguyên chính thức & nên dùng

| Tài nguyên | Mục đích |
|------------|----------|
| https://kubernetes.io/docs | Tài liệu chính thức — được mở khi thi, phải quen đường đi |
| https://kubernetes.io/docs/reference/kubectl/cheatsheet/ | Cheatsheet kubectl — học thuộc các pattern hay dùng |
| **killer.sh** (CKAD Simulator) | Trình mô phỏng đề thi, **đi kèm 2 session miễn phí** khi mua voucher. Khó hơn đề thật → làm được là yên tâm |
| Repo này (`a`→`j`) | Bài tập theo domain |
| https://training.linuxfoundation.org/.../ckad | Trang đăng ký thi chính thức, đọc kỹ "Important Instructions: CKAD" |

> **Mẹo đăng ký:** Để ý các đợt giảm giá (Black Friday, CyberMonday) thường giảm 30–50%
> cho bundle "Course + Exam". Voucher thi đi kèm **killer.sh** rất giá trị.

---

## ✅ Việc cần làm ngay bây giờ
1. Sang file [01-thiet-lap-moi-truong.md](01-thiet-lap-moi-truong.md) để dựng cluster luyện tập.
2. Sau đó đọc [02-kien-thuc-nen-tang-k8s.md](02-kien-thuc-nen-tang-k8s.md).
