# Lời giải chi tiết — `h.helm.md` (Helm)

> Đọc kèm [10-helm-crd-podman.md](../10-helm-crd-podman.md). Học vừa đủ; Helm là phần nhỏ.

---

### 1. Tạo chart cơ bản
```bash
helm create chart-test
```
**Giải thích:** sinh khung chart mẫu (thư mục có `Chart.yaml`, `values.yaml`, `templates/`).

### 2. Cài (install) chart
```bash
helm install -f myvalues.yaml myredis ./redis
```
**Giải thích:** `install <release> <chart>` cài chart `./redis` thành **release** tên `myredis`.
`-f myvalues.yaml` cung cấp file giá trị ghi đè `values.yaml` mặc định.

### 3. Tìm release đang pending trên mọi namespace
```bash
helm list --pending -A
```
**Giải thích:** `helm list` liệt kê release; `--pending` lọc release đang treo; `-A` mọi namespace.

### 4. Gỡ release
```bash
helm uninstall -n <namespace> <release_name>
```

### 5. Nâng cấp chart
```bash
helm upgrade -f myvalues.yaml -f override.yaml redis ./redis
```
**Giải thích:** `upgrade <release> <chart>` cập nhật release. Nhiều `-f` xếp chồng: file sau ghi
đè file trước.

### 6. Quản lý repo
```bash
helm repo add <NAME> <URL>
helm repo list
helm repo update
helm repo remove <NAME>
```

### 7. Tải chart về (không cài)
```bash
helm pull <repo/chart>
helm pull --untar <repo/chart>     # giải nén luôn
```

### 8. Thêm repo Bitnami
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```

### 9. In values.yaml của `bitnami/node`
```bash
helm show values bitnami/node
```
**Giải thích:** `show values` in toàn bộ giá trị mặc định của chart — để biết tham số nào có thể
ghi đè.

### 10. Cài `bitnami/node` với 5 replica
```bash
helm show values bitnami/node | grep -i replica   # tìm tên tham số → replicaCount
helm install mynode bitnami/node --set replicaCount=5
```
**Giải thích:** `--set key=value` ghi đè nhanh 1 tham số ngay khi cài (thay vì sửa file). Bước
`grep` quan trọng: phải biết **đúng tên** tham số (`replicaCount`) trong values.yaml.

---

## 🎯 Tổng kết chương h
- Chu trình: `repo add` → `repo update` → `show values` → `install --set/-f` → `upgrade` → `uninstall`.
- `list --pending -A`, `pull [--untar]`.
- Ghi đè giá trị: `--set` (nhanh) hoặc `-f file` (nhiều giá trị); `-f` sau đè `-f` trước.
