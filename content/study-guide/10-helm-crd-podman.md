# 10. Helm, CRD & Podman — đồng hành với `h.helm.md`, `i.crd.md`, `j.podman.md`

> Ba chủ đề "phụ trợ" nhưng vẫn nằm rải trong curriculum:
> - **Helm** → Application Deployment (20%)
> - **CRD** → Application Environment, Configuration and Security (25%)
> - **Podman/Docker (build image)** → Application Design and Build (20%)
>
> Học **vừa đủ** — đừng sa đà. Mức độ thi thường là cơ bản.

---

## 10.1. Helm — trình quản lý "package" cho K8s

Helm đóng gói nhiều manifest thành **chart**, cài đặt thành **release**, hỗ trợ tham số hoá
qua `values.yaml`, nâng/hạ cấp, rollback.

| Khái niệm | Nghĩa |
|-----------|-------|
| **Chart** | Gói template manifest (thư mục có `Chart.yaml`, `values.yaml`, `templates/`) |
| **Release** | Một lần cài chart vào cluster (có tên) |
| **Repository** | Kho chứa chart (vd Bitnami) |
| **values.yaml** | Giá trị cấu hình mặc định, ghi đè bằng `--set` hoặc `-f` |

```bash
helm create mychart                 # tạo chart mẫu
helm install myrel ./mychart        # cài chart local thành release 'myrel'
helm list -A                        # liệt kê release mọi namespace
helm list -A --pending              # release đang pending
helm uninstall myrel                # gỡ release
helm upgrade myrel ./mychart        # nâng cấp
helm rollback myrel 1               # quay về revision 1

# Repo
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo bitnami/node
helm pull bitnami/node              # tải chart về
helm show values bitnami/node       # in values.yaml ra stdout
helm install web bitnami/node --set replicaCount=5    # ghi đè tham số
```

> CKAD chủ yếu hỏi: cài/gỡ/nâng cấp release, thêm repo, xem/ghi đè values, tìm release
> pending. Không cần viết template Helm phức tạp.

---

## 10.2. CRD — mở rộng API Kubernetes

**CustomResourceDefinition (CRD)** cho phép định nghĩa loại object mới (vd `Operator`,
`Database`) ngoài các kind có sẵn. Operator dùng CRD để quản app phức tạp.

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: operators.stable.example.com      # phải là <plural>.<group>
spec:
  group: stable.example.com
  scope: Namespaced                        # hoặc Cluster
  names:
    plural: operators
    singular: operator
    kind: Operator
    shortNames: ["op"]
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                replicas: { type: integer }
```
```bash
k apply -f crd.yaml
k get crd
# Sau khi có CRD, tạo custom object như mọi resource khác:
k apply -f myoperator.yaml
k get operators            # dùng plural đã định nghĩa
```

> CKAD chỉ yêu cầu mức **đọc/tạo CRD và custom object cơ bản**, biết cấu trúc `group/names/
> versions`. Không cần viết Operator/controller.

---

## 10.3. Podman / Docker — build & quản lý image

Podman là CLI tương thích Docker (lệnh gần như giống `docker`). Domain "Application Design
and Build" có phần đóng gói app thành image.

### Dockerfile cơ bản (Apache phục vụ trang tuỳ chỉnh)
```dockerfile
FROM docker.io/httpd:2.4
RUN echo "Hello CKAD" > /usr/local/apache2/htdocs/index.html
```

### Lệnh hay dùng
```bash
podman build -t myapp:1.0 .            # build image từ Dockerfile
podman images                          # liệt kê image
podman history myapp:1.0               # xem số layer
podman run -d --name web -p 8080:80 myapp:1.0
podman ps / podman logs web / podman inspect web
podman exec web cat /usr/local/apache2/htdocs/index.html

# Tag & push lên registry private
podman tag myapp:1.0 localhost:5000/myapp:1.0
podman push localhost:5000/myapp:1.0

# Lưu/export
podman create --name c1 myapp:1.0      # tạo container chưa chạy
podman export c1 -o output.tar         # export filesystem container
podman save myapp:1.0 -o image.tar     # save image (kèm layer/metadata)

# Đăng nhập registry & tạo secret để K8s pull image private
podman login myregistry.example.com
k create secret docker-registry regcred \
  --docker-server=myregistry.example.com \
  --docker-username=user --docker-password=pass
```

> Phân biệt: `export` (filesystem 1 container, mất layer) vs `save` (image đầy đủ kèm layer).
> `history` để đếm số layer. Với CKAD biết build, run, tag/push, và tạo `docker-registry`
> secret để Pod pull image private là đủ.

Pod dùng image private:
```yaml
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: app
      image: myregistry.example.com/myapp:1.0
```

---

## 10.4. Lỗi thường gặp
- ❌ Tên CRD `metadata.name` không theo dạng `<plural>.<group>`.
- ❌ Quên `served: true`/`storage: true` ở version CRD.
- ❌ Nhầm `podman export` với `save`.
- ❌ Pod pull image private mà thiếu `imagePullSecrets`.

---

## 10.5. Bài tự luyện
1. Thêm repo bitnami, in `values.yaml` của một chart, cài release với `--set` ghi đè 1 tham số,
   rồi `helm list` và `helm uninstall`.
2. Tạo CRD `databases.stable.example.com` (kind `Database`), apply, tạo 1 custom object và
   `kubectl get databases`.
3. Viết Dockerfile nginx phục vụ trang tuỳ chỉnh, build bằng podman, chạy thử, đếm số layer.

→ Tiếp: [11-mock-exam-va-checklist.md](11-mock-exam-va-checklist.md)
