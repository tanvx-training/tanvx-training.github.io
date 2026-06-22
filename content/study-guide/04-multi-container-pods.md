# 4. Multi-container Pods — đồng hành với `b.multi_container_pods.md`

> **Domain CKAD:** Application Design and Build (20%)
> **Mục tiêu:** hiểu khi nào nhét nhiều container vào 1 Pod, init container, và chia sẻ
> dữ liệu giữa các container qua `emptyDir`.

---

## 4.1. Khi nào dùng nhiều container trong 1 Pod?

Mặc định: **1 container/Pod**. Chỉ gộp khi các container **gắn bó chặt** và cần chia sẻ
mạng (cùng `localhost`) hoặc volume. Các pattern kinh điển:

| Pattern | Ý tưởng | Ví dụ |
|---------|---------|-------|
| **Sidecar** | Container phụ hỗ trợ container chính | Thu thập log, đẩy metric, sync file |
| **Ambassador** | Proxy cho kết nối ra ngoài | Proxy tới DB/cache |
| **Adapter** | Chuẩn hoá output của container chính | Định dạng lại log/metric |
| **Init container** | Chạy XONG trước khi container chính khởi động | Tải file, chờ dịch vụ sẵn sàng, migrate DB |

> Các container trong cùng Pod **chia sẻ network namespace** (gọi nhau qua `localhost`) và
> có thể **chia sẻ volume**. Nhưng filesystem thì riêng — muốn chia sẻ file phải mount cùng
> 1 volume.

### Init container — đặc điểm
- Khai báo trong `spec.initContainers` (ngang hàng `spec.containers`).
- Chạy **tuần tự**, mỗi cái phải **kết thúc thành công** mới tới cái sau, rồi mới tới
  container chính.
- Dùng để chuẩn bị điều kiện (vd ghi sẵn file `index.html` cho nginx đọc).

### emptyDir
Volume **tạm**, tạo khi Pod sinh ra, **mất khi Pod bị xoá**. Dùng để các container trong
cùng Pod trao đổi dữ liệu.

---

## 4.2. Lệnh & khung YAML

```bash
# Sinh khung 1 container rồi sửa thêm container thứ 2 / init container
k run mc --image=busybox $do --command -- /bin/sh -c "echo hello; sleep 3600" > mc.yaml
```

YAML multi-container + init + emptyDir (mẫu của bài 2 trong `b.`):
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: box
spec:
  initContainers:                 # chạy trước, ghi file vào volume chung
    - name: init
      image: busybox
      command: ['sh', '-c', 'echo "Test" > /work-dir/index.html']
      volumeMounts:
        - name: vol
          mountPath: /work-dir
  containers:
    - name: nginx
      image: nginx
      ports:
        - containerPort: 80
      volumeMounts:
        - name: vol
          mountPath: /usr/share/nginx/html
  volumes:
    - name: vol
      emptyDir: {}
```

Kết nối vào 1 container cụ thể trong Pod nhiều container:
```bash
k exec -it box -c nginx -- sh        # -c chọn container theo tên
k logs box -c nginx                  # log của container cụ thể
```

---

## 4.3. Giải thích bài tập trong `b.multi_container_pods.md`

| Bài | Điểm cần hiểu |
|-----|----------------|
| Pod 2 container busybox, vào container 2 chạy `ls` | Dùng `-c <tên>` để chọn container; mỗi container cần lệnh giữ sống (`sleep 3600`) |
| nginx + init busybox ghi `index.html` qua emptyDir | Init chạy trước ghi file vào volume chung; nginx mount cùng volume ở thư mục web; sau đó `wget` IP để thấy nội dung "Test" |

---

## 4.4. Lỗi thường gặp
- ❌ Đặt `initContainers` sai cấp (phải ngang `containers`, trong `spec`).
- ❌ Hai container mount **khác volume** nên không thấy file của nhau → phải cùng `name` volume.
- ❌ Quên container giữ sống → Pod `Completed`/`CrashLoop`. Thêm `sleep 3600`.
- ❌ Quên `-c` khi exec/logs Pod nhiều container → kubectl báo phải chọn container.

---

## 4.5. Bài tự luyện
1. Tạo Pod 2 container (busybox + busybox), cả hai mount emptyDir `/data`. Container A ghi
   file `/data/a.txt`, container B đọc được nó.
2. Tạo Pod nginx có init container chờ 5s rồi ghi trang chủ tuỳ chỉnh, kiểm tra bằng wget.

→ Tiếp: [05-pod-design.md](05-pod-design.md)
