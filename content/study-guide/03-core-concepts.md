# 3. Core Concepts — đồng hành với `a.core_concepts.md`

> **Domain CKAD:** Application Design and Build (20%)
> **Mục tiêu:** tạo/quản lý Pod thành thạo, dùng imperative + `--dry-run`, đọc log, exec,
> làm việc với namespace & ResourceQuota cơ bản. Đây là nền của mọi bài khác — luyện đến khi
> các thao tác thành phản xạ.

---

## 3.1. Khái niệm cần nắm trước khi làm

### Pod
Đơn vị nhỏ nhất K8s chạy. Thường 1 container/Pod. Pod là **ephemeral** — chết là mất, được
thay bằng Pod mới (IP mới). Vì vậy thực tế ta dùng Deployment để quản Pod, nhưng CKAD vẫn
yêu cầu tạo Pod trực tiếp rất nhiều để luyện.

### Namespace
Phân vùng logic tài nguyên trong cluster. `default` là namespace mặc định. Quota, một số
chính sách áp theo namespace.

### ResourceQuota
Giới hạn tổng tài nguyên (CPU/RAM/số pod...) mà 1 namespace được dùng.

---

## 3.2. Bộ lệnh "xương sống" phải thuộc lòng

```bash
# Tạo Pod nhanh
k run nginx --image=nginx
k run nginx --image=nginx --port=80           # khai báo containerPort 80
k run busybox --image=busybox --restart=Never -- /bin/sh -c "env"   # chạy lệnh rồi thoát

# Tạo Pod chạy lệnh tạm rồi tự xoá (rất hay dùng để test mạng)
k run tmp --image=busybox --restart=Never --rm -it -- sh

# Sinh YAML (KHÔNG tạo) — kỹ thuật cốt lõi
k run nginx --image=nginx $do > pod.yaml

# Xem
k get pods                       # ds pod namespace hiện tại
k get pods -A                    # mọi namespace
k get pods -o wide               # thêm IP, node
k get pod nginx -o yaml          # YAML đầy đủ của pod đang chạy

# Debug
k describe pod nginx             # chi tiết + Events
k logs nginx                     # log
k logs nginx --previous          # log instance chết trước đó
k exec -it nginx -- sh           # vào shell

# Sửa & xoá
k set image pod/nginx nginx=nginx:1.24.0    # đổi image (container tên 'nginx')
k delete pod nginx
k delete pod nginx $now          # xoá tức thì (--force --grace-period=0)
```

### Namespace & Quota
```bash
k create namespace mynamespace
k run nginx --image=nginx -n mynamespace

# Sinh YAML namespace mà không tạo:
k create namespace myns $do

# ResourceQuota
k create quota myrq --hard=cpu=1,memory=1G,pods=2 $do
```

---

## 3.3. Giải thích các bài tập trong `a.core_concepts.md`

| Bài | Điểm cần hiểu |
|-----|----------------|
| Tạo namespace + pod | Nhớ `-n` hoặc tạo trong YAML; tách 2 bước create namespace, run pod |
| Tạo pod bằng YAML | `--dry-run=client -o yaml` rồi `kubectl apply -f` |
| busybox chạy `env` | `--restart=Never` để pod là Pod thường (không phải Deployment); `--` ngăn cách lệnh; xem kết quả qua `logs` |
| YAML của namespace không tạo | `$do` (= `--dry-run=client -o yaml`) — không apply |
| ResourceQuota `myrq` | `kubectl create quota` với `--hard=` |
| Pod expose port 80 | `--port=80` chỉ khai báo containerPort, KHÔNG tạo Service |
| Đổi image, quan sát restart | `kubectl set image`; container restart khi image mới được pull |
| wget IP của nginx từ busybox tạm | Pod gọi Pod qua IP nội bộ; dùng pod busybox `--rm` để test |
| Lấy YAML/describe/logs/exec | Quy trình get → describe → logs → exec |
| busybox echo 'hello world' rồi thoát | `--restart=Never -- /bin/sh -c "echo hello world"` |

> **`--restart=Never` vs mặc định:** `kubectl run` mặc định tạo Pod đơn. `--restart=Never`
> = Pod chạy 1 lần (không tự restart). `--restart=OnFailure` thường dùng cho dạng Job. Nhớ:
> với CKAD, `kubectl run` luôn tạo **Pod** (các bản K8s mới đã bỏ tự tạo Deployment).

---

## 3.4. Lỗi thường gặp của người mới
- ❌ Quên `-n <namespace>` → tạo nhầm vào `default`, mất điểm dù YAML đúng.
- ❌ Gõ YAML từ đầu rồi sai thụt lề → dùng `$do` để sinh khung.
- ❌ Dùng `kubectl logs` khi pod đã restart mà không thêm `--previous` → không thấy lỗi gốc.
- ❌ Quên `--` trước lệnh trong `kubectl run` → kubectl hiểu nhầm là cờ.
- ❌ Pod busybox tắt ngay: busybox không có process giữ sống → thêm lệnh `sleep 3600` hoặc
  dùng `--rm -it` để tương tác.

---

## 3.5. Bài tự luyện tốc độ (bấm giờ — mục tiêu < 6 phút tổng)
1. Tạo namespace `dev`, chạy pod `web` image `nginx:1.25` port 80 trong đó.
2. Sinh (không tạo) YAML cho pod `redis` image `redis` → lưu `redis.yaml`, rồi apply.
3. Đổi image pod `web` sang `nginx:1.26`, xác nhận đã đổi bằng `describe`.
4. Lấy IP của `web`, từ 1 pod busybox tạm `wget -O-` vào IP đó.
5. Xoá tất cả pod trong `dev` bằng lệnh nhanh.

→ Tiếp: [04-multi-container-pods.md](04-multi-container-pods.md)
