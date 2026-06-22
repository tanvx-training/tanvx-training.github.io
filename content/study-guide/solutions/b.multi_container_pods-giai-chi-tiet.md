# Lời giải chi tiết — `b.multi_container_pods.md` (Multi-container Pods)

> Đọc kèm [04-multi-container-pods.md](../04-multi-container-pods.md).

---

### 1. Pod 2 container (đều busybox, lệnh `echo hello; sleep 3600`). Vào container thứ 2 chạy `ls`

**Cách làm:** sinh khung 1 container rồi copy thành 2 (đổi tên container thứ 2).
```bash
kubectl run busybox --image=busybox --restart=Never -o yaml --dry-run=client \
  -- /bin/sh -c 'echo hello;sleep 3600' > pod.yaml
vi pod.yaml
```
YAML cuối cùng (2 container, **tên phải khác nhau**):
```yaml
spec:
  containers:
  - args: ['/bin/sh', '-c', 'echo hello;sleep 3600']
    image: busybox
    name: busybox
  - args: ['/bin/sh', '-c', 'echo hello;sleep 3600']
    image: busybox
    name: busybox2          # ⚠️ tên khác container 1
```
```bash
kubectl create -f pod.yaml
kubectl exec -it busybox -c busybox2 -- /bin/sh    # vào container 2
# hoặc một dòng:
kubectl exec -it busybox -c busybox2 -- ls
kubectl delete po busybox
```
**Giải thích:**
- Nhiều container = thêm phần tử vào list `spec.containers`. **Mỗi container phải có `name`
  duy nhất** trong Pod.
- `sleep 3600` giữ container sống (busybox không có process nền nên sẽ thoát ngay nếu không).
- `kubectl exec -c <tên>` **bắt buộc** khi Pod có nhiều container — nếu thiếu, kubectl không
  biết chọn container nào.

**Bẫy:** quên đổi tên container 2 → lỗi "duplicate container name". Quên `-c` → lỗi
"a container name must be specified".

---

### 2. Pod nginx (port 80) + init container busybox ghi `index.html` qua emptyDir; rồi wget IP

```bash
kubectl run box --image=nginx --restart=Never --port=80 --dry-run=client -o yaml > pod-init.yaml
vi pod-init.yaml
```
YAML đầy đủ:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: box
spec:
  initContainers:                       # chạy TRƯỚC, tuần tự, phải xong mới tới container chính
  - name: box
    image: busybox
    args: ['/bin/sh', '-c', 'echo "Test" > /work-dir/index.html']
    volumeMounts:
    - name: vol
      mountPath: /work-dir              # init ghi file vào đây
  containers:
  - name: nginx
    image: nginx
    ports:
    - containerPort: 80
    volumeMounts:
    - name: vol
      mountPath: /usr/share/nginx/html  # nginx đọc web root từ đây
  volumes:
  - name: vol
    emptyDir: {}                        # volume chung, cùng tên 'vol' ở cả 2 nơi
```
```bash
kubectl apply -f pod-init.yaml
kubectl get po -o wide                  # lấy IP
kubectl run box-test --image=busybox --restart=Never -it --rm -- \
  /bin/sh -c "wget -O- $(kubectl get pod box -o jsonpath='{.status.podIP}')"
kubectl delete po box
```
**Giải thích từng phần:**
- **`initContainers`**: nằm ngang hàng `containers` trong `spec`. Chạy tới khi **kết thúc
  thành công** rồi container chính mới start. Dùng để chuẩn bị dữ liệu (ở đây: ghi trang chủ).
- **`emptyDir: {}`**: volume tạm sống theo Pod, để init và nginx **chia sẻ file**. Mấu chốt:
  cả hai mount **cùng `name: vol`** (chỉ khác `mountPath`).
- Init ghi `Test` vào `/work-dir/index.html`; nginx phục vụ file đó tại web root → wget thấy
  chữ "Test".
- `jsonpath='{.status.podIP}'` lấy IP pod để wget.

**Bẫy:** hai container mount **khác volume** → nginx không thấy file init ghi. Đặt `initContainers`
sai cấp (phải trong `spec`, ngang `containers`).

---

## 🎯 Tổng kết chương b
- Thêm container = thêm phần tử list `containers`, mỗi cái `name` riêng.
- `exec -c` để chọn container trong Pod nhiều container.
- `initContainers` chạy trước, tuần tự; dùng chuẩn bị điều kiện.
- `emptyDir` + cùng `name` volume = cách chia sẻ file giữa container trong cùng Pod.
