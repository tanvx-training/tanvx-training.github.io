# Lời giải chi tiết — `i.crd.md` (Custom Resource Definitions)

> Đọc kèm [10-helm-crd-podman.md](../10-helm-crd-podman.md). Mức cơ bản: tạo CRD + custom object.

---

### 1. Manifest CRD cho `Operator`
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: operators.stable.example.com      # PHẢI dạng <plural>.<group>
spec:
  group: stable.example.com
  versions:
    - name: v1
      served: true                         # phiên bản này được API phục vụ
      storage: true                        # đúng MỘT version là storage version
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                email: { type: string }
                name:  { type: string }
                age:   { type: integer }
  scope: Namespaced                         # hoặc Cluster
  names:
    plural: operators
    singular: operator
    kind: Operator                          # CamelCase, dùng trong manifest object
    shortNames: [op]
```
**Giải thích từng phần:**
- `metadata.name` **bắt buộc** = `<plural>.<group>` (ở đây `operators` + `stable.example.com`).
- `group` + `versions[].name` tạo nên `apiVersion` của object sau này: `stable.example.com/v1`.
- `served: true` = API server phục vụ version này; `storage: true` = version dùng để lưu (chỉ
  một version được phép).
- `schema.openAPIV3Schema` định nghĩa cấu trúc & kiểu dữ liệu (validation).
- `scope: Namespaced` = object thuộc namespace (vs `Cluster` = toàn cluster).
- `names` khai báo các tên: plural (dùng `kubectl get`), singular, kind, shortNames.

### 2. Tạo CRD trong cluster
```bash
kubectl apply -f operator-crd.yml
kubectl get crd
```

### 3. Tạo custom object từ CRD
```yaml
apiVersion: stable.example.com/v1          # = group/version
kind: Operator                              # = names.kind
metadata:
  name: operator-sample
spec:
  email: operator-sample@stable.example.com
  name: "operator sample"
  age: 30
```
```bash
kubectl apply -f operator.yml
```
**Giải thích:** sau khi có CRD, object tuỳ chỉnh dùng `apiVersion = group/version` và `kind` đã
định nghĩa. Các field trong `spec` phải hợp schema (vd `age` là integer).

### 4. Liệt kê object
```bash
kubectl get operators     # plural
kubectl get operator      # singular
kubectl get op            # shortName
```
**Giải thích:** cả 3 dạng tên đều dùng được nhờ khai báo trong `names`.

---

## 🎯 Tổng kết chương i
- CRD = thêm "kind" mới vào API. `metadata.name` = `<plural>.<group>`.
- `served`/`storage`, `scope`, `names`, `schema.openAPIV3Schema` là các phần bắt buộc nắm.
- Object dùng `apiVersion: <group>/<version>` + `kind` đã định nghĩa.
- `kubectl get <plural|singular|shortName>` đều hoạt động.
