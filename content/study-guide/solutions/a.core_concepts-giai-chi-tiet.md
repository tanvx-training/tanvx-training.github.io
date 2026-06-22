# Lời giải chi tiết — `a.core_concepts.md` (Core Concepts)

> Mỗi mục: **câu hỏi → lệnh → giải thích từng cờ → bẫy hay gặp**. File gốc có đáp án ngắn;
> đây là bản chú thích đầy đủ cho người mới. Đọc kèm [03-core-concepts.md](../03-core-concepts.md).

---

### 1. Tạo namespace `mynamespace` + pod `nginx` (image nginx) trong namespace đó
```bash
kubectl create namespace mynamespace
kubectl run nginx --image=nginx --restart=Never -n mynamespace
```
**Giải thích:**
- `create namespace` tạo "thư mục" logic để gom tài nguyên.
- `kubectl run <tên>` tạo **1 Pod**. `--image=nginx` chỉ image.
- `--restart=Never` → Pod đơn (kind `Pod`). Nếu là `Always` (mặc định cũ) sẽ là kiểu
  Deployment; bản K8s mới `run` luôn tạo Pod, nhưng **luôn ghi `--restart=Never` cho chắc**.
- `-n mynamespace` đặt Pod vào đúng namespace. **Quên `-n` = tạo nhầm vào `default`.**

---

### 2. Tạo lại pod đó bằng YAML
```bash
kubectl run nginx --image=nginx --restart=Never --dry-run=client -n mynamespace -o yaml > pod.yaml
kubectl create -f pod.yaml
# một dòng:
kubectl run nginx --image=nginx --restart=Never --dry-run=client -o yaml | kubectl create -n mynamespace -f -
```
**Giải thích:**
- `--dry-run=client` = "diễn tập", **không** gửi lên cluster, chỉ in ra.
- `-o yaml` = xuất định dạng YAML. Kết hợp 2 cờ này = **sinh khung YAML** → đây là kỹ thuật
  cốt lõi để thi nhanh (gán alias `$do`).
- `> pod.yaml` lưu ra file để sửa thêm. `kubectl create -f` áp dụng file.
- `-f -` nghĩa là đọc YAML từ **stdin** (dấu `-`), dùng khi nối pipe.

---

### 3. Pod busybox chạy lệnh `env` (bằng kubectl), xem output
```bash
kubectl run busybox --image=busybox --command --restart=Never -it --rm -- env
# hoặc không -it, rồi xem log:
kubectl run busybox --image=busybox --command --restart=Never -- env
kubectl logs busybox
```
**Giải thích:**
- `--` ngăn cách: mọi thứ sau `--` là **lệnh chạy trong container**, không phải cờ kubectl.
- `--command` báo rằng phần sau `--` là `command` (ghi đè ENTRYPOINT) chứ không phải args.
- `-it` = `-i` (giữ stdin) + `-t` (cấp pseudo-TTY) → thấy output trực tiếp trên terminal.
- `--rm` xoá Pod ngay sau khi nó kết thúc (dọn rác).
- Không có `-it` thì xem kết quả qua `kubectl logs busybox`.

---

### 4. Pod busybox chạy `env` (bằng YAML)
```bash
kubectl run busybox --image=busybox --restart=Never --dry-run=client -o yaml --command -- env > envpod.yaml
kubectl apply -f envpod.yaml
kubectl logs busybox
```
**Giải thích:** giống bài 2 nhưng có thêm `--command -- env` → trong YAML sinh ra trường
`command: [env]`. `apply` tạo từ file; vì là Pod chạy 1 lần, kết quả nằm trong `logs`.

---

### 5. Lấy YAML cho namespace `myns` mà KHÔNG tạo
```bash
kubectl create namespace myns -o yaml --dry-run=client
```
**Giải thích:** `--dry-run=client -o yaml` = chỉ in YAML, không tạo. Pattern này áp dụng cho
mọi loại object.

---

### 6. Tạo YAML cho ResourceQuota `myrq` (1 CPU, 1G mem, 2 pods) — không tạo
```bash
kubectl create quota myrq --hard=cpu=1,memory=1G,pods=2 --dry-run=client -o yaml
```
**Giải thích:** `--hard=` liệt kê các giới hạn cứng, ngăn cách bằng dấu phẩy. `cpu`, `memory`,
`pods` là các "resource name" mà quota đếm.

---

### 7. Lấy pod trên tất cả namespace
```bash
kubectl get po --all-namespaces      # hoặc:
kubectl get po -A
```
**Giải thích:** `po` là alias của `pods`. `-A`/`--all-namespaces` xem mọi namespace — rất hay
dùng để debug "pod của tôi đâu rồi?".

---

### 8. Tạo pod nginx và expose port 80
```bash
kubectl run nginx --image=nginx --restart=Never --port=80
```
**Giải thích:** `--port=80` chỉ **khai báo** `containerPort: 80` trong spec (tài liệu hoá cổng
app lắng nghe). Nó **KHÔNG** tạo Service. Muốn tạo Service phải thêm `--expose` (xem file f).

---

### 9. Đổi image pod sang `nginx:1.24.0`, quan sát restart
```bash
kubectl set image pod/nginx nginx=nginx:1.24.0
kubectl describe po nginx        # thấy event "Container will be killed and recreated"
kubectl get po nginx -w          # -w = watch, theo dõi cột RESTARTS tăng
kubectl get po nginx -o jsonpath='{.spec.containers[].image}{"\n"}'   # kiểm tra image
```
**Giải thích:** cú pháp `set image <type>/<name> <container>=<image>:<tag>`. Tên container ở
đây là `nginx` (trùng tên Pod do `run` đặt). Đổi image → kubelet kill & tạo lại container nên
`RESTARTS` +1.

---

### 10. Lấy IP pod nginx, dùng busybox tạm wget `/`
```bash
kubectl get po -o wide                      # cột IP
kubectl run busybox --image=busybox --rm -it --restart=Never -- wget -O- <IP>:80
# tự động lấy IP:
kubectl run busybox --image=busybox --rm -it --restart=Never -- \
  wget -O- $(kubectl get pod nginx -o jsonpath='{.status.podIP}'):80
```
**Giải thích:**
- `-o wide` thêm cột IP & NODE.
- `wget -O-` ghi nội dung tải về ra **stdout** (`-O-`) thay vì lưu file → thấy ngay HTML.
- Pod gọi Pod qua **IP nội bộ cluster**. Đây minh hoạ vì sao cần Service: IP pod hay đổi.

---

### 11. Lấy YAML của pod
```bash
kubectl get po nginx -o yaml
```
**Giải thích:** các biến thể `-oyaml`, `--output yaml`, `--output=yaml` đều tương đương.

---

### 12. Xem thông tin pod kể cả lỗi (pod chưa start)
```bash
kubectl describe po nginx
```
**Giải thích:** `describe` in chi tiết + mục **Events** ở cuối — nơi báo lý do Pending,
ImagePullBackOff, v.v. **Luôn đọc Events khi debug.**

---

### 13. Lấy log pod
```bash
kubectl logs nginx
```

### 14. Pod đã crash & restart → lấy log instance trước
```bash
kubectl logs nginx -p          # -p = --previous
kubectl logs nginx --previous
```
**Giải thích:** `--previous` lấy log của container **lần chạy trước** (đã chết). Cực kỳ quan
trọng khi debug `CrashLoopBackOff` — log hiện tại có thể rỗng.

---

### 15. Mở shell trong pod nginx
```bash
kubectl exec -it nginx -- /bin/sh
```
**Giải thích:** `exec -it ... -- <lệnh>`. `/bin/sh` luôn có; `/bin/bash` chỉ có ở một số image.

---

### 16. Pod busybox echo 'hello world' rồi thoát
```bash
kubectl run busybox --image=busybox -it --restart=Never -- echo 'hello world'
kubectl run busybox --image=busybox -it --restart=Never -- /bin/sh -c 'echo hello world'
```
**Giải thích:** dạng `-- /bin/sh -c '...'` cho phép chạy chuỗi lệnh phức tạp (pipe, biến…).

### 17. Như trên nhưng tự xoá khi xong
```bash
kubectl run busybox --image=busybox -it --rm --restart=Never -- /bin/sh -c 'echo hello world'
```
**Giải thích:** thêm `--rm` → Pod biến mất sau khi chạy xong.

---

### 18. Pod nginx với env `var1=val1`, kiểm tra biến trong pod
```bash
kubectl run nginx --image=nginx --restart=Never --env=var1=val1
kubectl exec -it nginx -- env                  # liệt kê mọi biến
kubectl exec -it nginx -- sh -c 'echo $var1'   # in giá trị 1 biến
```
**Giải thích:** `--env=key=val` đặt biến môi trường lúc tạo Pod (lặp lại cờ cho nhiều biến).

---

## 🎯 Tổng kết kỹ năng của chương a
- Thuộc nằm lòng `$do` (`--dry-run=client -o yaml`) để sinh YAML.
- `run`/`create` + `-n`, `--restart=Never`, `--port`, `--env`, `--rm`, `-it`, `--`.
- Quy trình debug: `get` → `describe` (Events) → `logs [--previous]` → `exec`.
- Phân biệt `--port` (chỉ khai báo) vs `--expose` (tạo Service).
