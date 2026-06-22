# Lời giải chi tiết — `j.podman.md` (Build & modify container images)

> Đọc kèm [10-helm-crd-podman.md](../10-helm-crd-podman.md). `podman` cú pháp ~ `docker`.

---

### 1. Dockerfile chạy Apache với trang chủ tuỳ chỉnh
```dockerfile
FROM docker.io/httpd:2.4
RUN echo "Hello, World!" > /usr/local/apache2/htdocs/index.html
```
**Giải thích:** `FROM` chọn image nền; `RUN` thực thi lệnh lúc **build** (ghi trang chủ vào web
root của httpd). Mỗi chỉ thị tạo một **layer**.

### 2. Build & đếm số layer
```bash
podman build -t simpleapp .
podman images
podman image tree localhost/simpleapp:latest    # xem cây layer
```
**Giải thích:** `-t` đặt tag (tên image); `.` = build context (thư mục chứa Dockerfile). `image
tree` (hoặc `podman history`) liệt kê các layer — image kế thừa layer của base + layer mới từ RUN.

### 3. Chạy local, xem status/logs, test phản hồi
```bash
podman run -d --name test -p 8080:80 localhost/simpleapp
podman ps
podman logs test
curl 0.0.0.0:8080        # Hello, World!
```
**Giải thích:** `-d` chạy nền (detached); `--name` đặt tên container; `-p 8080:80` ánh xạ cổng
host 8080 → cổng container 80.

### 4. Chạy lệnh trong container in `index.html`
```bash
podman exec -it test cat /usr/local/apache2/htdocs/index.html
```

### 5. Tag với IP:port registry private rồi push
```bash
podman tag localhost/simpleapp $registry_ip:5000/simpleapp
podman push $registry_ip:5000/simpleapp
curl http://$registry_ip:5000/v2/_catalog     # xác nhận image có trên registry
```
**Giải thích:** image phải được **tag với địa chỉ registry** thì `push` mới biết đẩy đi đâu.

### 6. Tạo container mà KHÔNG chạy
```bash
podman create busybox
podman container ls -a       # thấy STATUS = Created
```
**Giải thích:** `create` chuẩn bị container nhưng không start (khác `run`).

### 7. Export container ra `output.tar`
```bash
podman export <container_id> --output=output.tar
```
**Giải thích — phân biệt:** `export` xuất **filesystem của một container** (phẳng, mất lịch sử
layer). Còn `save` xuất **image** (kèm metadata & layer). Đề dễ hỏi sự khác biệt này.

### 8. Chạy Pod K8s với image đã push
```bash
kubectl run simpleapp --image=$registry_ip:5000/simpleapp --port=80
```

### 9. Đăng nhập registry, đọc credentials
```bash
podman login --username $USER --password $PWD docker.io
cat ${XDG_RUNTIME_DIR}/containers/auth.json     # file lưu thông tin đăng nhập (base64)
```

### 10. Tạo secret từ credentials & từ CLI
```bash
# từ file auth.json đã có:
kubectl create secret generic mysecret \
  --from-file=.dockerconfigjson=${XDG_RUNTIME_DIR}/containers/auth.json \
  --type=kubernetes.io/dockerconfigjson
# từ CLI trực tiếp:
kubectl create secret docker-registry mysecret2 \
  --docker-server=https://index.docker.io/v1/ --docker-username=$USR --docker-password=$PWD
```
**Giải thích:** secret loại `docker-registry`/`dockerconfigjson` chứa thông tin đăng nhập để
K8s **pull image private**.

### 11. Pod dùng secret để pull image private
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-reg
spec:
  containers:
  - name: private-reg-container
    image: $YOUR_PRIVATE_IMAGE
  imagePullSecrets:
  - name: mysecret
```
**Giải thích:** `imagePullSecrets` trỏ tới secret registry → kubelet dùng nó để xác thực khi
kéo image.

### 12. Dọn dẹp image & container
```bash
podman rm --all --force
podman rmi --all
kubectl delete pod simpleapp
```

---

## 🎯 Tổng kết chương j
- Dockerfile: `FROM` + `RUN` (mỗi chỉ thị = 1 layer).
- `build -t`, `run -d -p`, `ps`, `logs`, `exec`, `tag`, `push`.
- `export` (filesystem 1 container) vs `save` (image kèm layer); `history`/`image tree` đếm layer.
- Pull image private: secret `docker-registry` + `imagePullSecrets` trong Pod.
