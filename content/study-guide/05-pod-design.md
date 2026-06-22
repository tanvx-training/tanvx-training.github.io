# 5. Pod Design — đồng hành với `c.pod_design.md`

> **Domain CKAD:** Application Design and Build (20%) + Application Deployment (20%)
> Đây là file **dài và quan trọng nhất** của repo, gồm: Labels/Annotations, Pod placement,
> **Deployments (rolling update, rollback)**, **Jobs & CronJobs**. Phần Deployment rất hay
> ra thi — luyện kỹ.

---

## 5.1. Labels & Annotations & Selectors

- **Label**: cặp key=value gắn vào object để **nhóm và chọn lọc** (vd `app=web`,
  `tier=frontend`). Service/Deployment/NetworkPolicy đều dùng label selector để biết "quản
  những Pod nào".
- **Annotation**: cũng key=value nhưng để **ghi chú metadata** (không dùng để chọn lọc),
  vd `owner=marketing`, mô tả, thông tin build.

```bash
# Tạo nhiều pod cùng label
for i in 1 2 3; do k run nginx$i --image=nginx --labels=app=v1; done

k get pods --show-labels                 # xem mọi label
k get pods -L app                         # hiện cột giá trị label 'app'
k get pods -l app=v2                      # lọc theo label
k get pods -l 'app=v2,tier!=frontend'     # nhiều điều kiện
k get pods -l 'app in (v1,v2)'            # tập hợp

k label pod nginx2 app=v2 --overwrite     # đổi label (cần --overwrite)
k label pods -l app=v2 tier=web           # gắn label cho nhóm
k label pod nginx1 app-                   # xoá label 'app' (hậu tố '-')

k annotate pod nginx1 owner=marketing
k annotate pod nginx1 owner-              # xoá annotation
```

> **Selector** là sợi dây liên kết: Deployment dùng `spec.selector.matchLabels` để nhận Pod;
> Service dùng `spec.selector` để định tuyến. **Label trên Pod phải khớp selector** nếu không
> sẽ "không thấy" nhau.

---

## 5.2. Pod placement — đẩy Pod lên node nhất định

| Cách | Khi dùng |
|------|----------|
| `nodeName` | Ép Pod chạy đúng 1 node (bỏ qua scheduler) |
| `nodeSelector` | Chạy trên node có label nhất định (vd `accelerator=nvidia-tesla-p100`) |
| `affinity` / `taints+tolerations` | Nâng cao (ít gặp ở CKAD, biết khái niệm) |

```yaml
spec:
  nodeName: node01           # cách 1: ép node cụ thể
  nodeSelector:              # cách 2: theo label node
    accelerator: nvidia-tesla-p100
```

---

## 5.3. Deployment ⭐ (trọng tâm)

Deployment quản lý ReplicaSet → quản Pod, cho phép **scale, rolling update, rollback**.

```bash
# Tạo
k create deployment web --image=nginx --replicas=3
k create deployment web --image=nginx --replicas=3 $do > web.yaml   # sinh YAML

# Scale
k scale deployment web --replicas=5

# Cập nhật image (rolling update)
k set image deployment/web nginx=nginx:1.26
# hoặc:  k edit deployment web   (sửa rồi lưu)

# Theo dõi & lịch sử rollout
k rollout status deployment web
k rollout history deployment web
k rollout history deployment web --revision=2

# Rollback
k rollout undo deployment web                    # về bản trước
k rollout undo deployment web --to-revision=1    # về bản cụ thể

# Tạm dừng / tiếp tục rollout (gom nhiều thay đổi)
k rollout pause deployment web
k rollout resume deployment web
```

> **Rolling update**: K8s thay Pod cũ bằng mới **từ từ**, đảm bảo luôn có Pod phục vụ
> (không downtime). Tham số `strategy.rollingUpdate.maxSurge`/`maxUnavailable` điều khiển
> tốc độ. **Mẹo ghi lý do thay đổi**: thêm annotation `kubernetes.io/change-cause` (qua
> `kubectl annotate` hoặc cờ `--record` ở bản cũ) để `rollout history` hiển thị nguyên nhân.

---

## 5.4. Job & CronJob

- **Job**: chạy Pod tới khi **hoàn thành** (vd xử lý batch). Có `completions` (số lần cần
  chạy thành công) và `parallelism` (chạy song song mấy Pod).
- **CronJob**: tạo Job theo **lịch cron**.

```bash
# Job
k create job myjob --image=busybox -- /bin/sh -c "echo hello; sleep 5"
k create job myjob --image=busybox $do -- echo hello > job.yaml

# CronJob (lịch cron: phút giờ ngày tháng thứ)
k create cronjob mycron --image=busybox --schedule="*/1 * * * *" -- date
```

Trường hay chỉnh trong Job YAML:
```yaml
spec:
  completions: 5            # cần 5 lần hoàn thành
  parallelism: 2            # chạy 2 Pod song song
  backoffLimit: 4           # số lần retry trước khi coi là Failed
  activeDeadlineSeconds: 30 # giết Job nếu quá 30s
  template:
    spec:
      restartPolicy: Never  # hoặc OnFailure (BẮT BUỘC với Job, không được Always)
```
CronJob bổ sung:
```yaml
spec:
  schedule: "*/1 * * * *"
  jobTemplate: { ... }
  startingDeadlineSeconds: 10
  concurrencyPolicy: Forbid   # Allow | Forbid | Replace
```

---

## 5.5. Ánh xạ các nhóm bài trong `c.pod_design.md`

| Nhóm | Kỹ năng |
|------|---------|
| Labels & Annotations | tạo nhiều pod cùng label, lọc bằng selector, thêm/xoá label & annotation |
| Pod Placement | `nodeSelector`, `nodeName` |
| Deployments | tạo, scale, set image, rolling update, history, undo/rollback, pause/resume |
| Jobs | completions, parallelism, backoffLimit, restartPolicy |
| CronJobs | schedule, concurrencyPolicy, startingDeadlineSeconds |

---

## 5.6. Lỗi thường gặp
- ❌ `k label` đổi label đã tồn tại mà quên `--overwrite`.
- ❌ Job/CronJob để `restartPolicy: Always` → không hợp lệ (chỉ `Never`/`OnFailure`).
- ❌ Nhầm `kubectl set image deployment/web web=...` — tên container phải đúng (mặc định
  trùng tên deployment, kiểm tra bằng `k get deploy web -o yaml`).
- ❌ Rollback nhưng không kiểm tra `rollout status` → tưởng xong mà chưa.
- ❌ Cron schedule sai thứ tự field (phút giờ ngày-tháng tháng thứ).

---

## 5.7. Bài tự luyện (bấm giờ)
1. Tạo deployment `api` 4 replica image `nginx:1.25`. Scale lên 6. Update image `1.26`,
   xem `rollout status`, rồi rollback về `1.25`.
2. Gắn label `tier=frontend` cho mọi pod `app=v1`, lọc ra pod `app=v1` mà không `tier=backend`.
3. Tạo CronJob chạy mỗi phút in `date`, xác nhận có Job được sinh ra.

→ Tiếp: [06-configuration.md](06-configuration.md)
