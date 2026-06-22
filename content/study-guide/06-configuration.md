# 6. Configuration & Security — đồng hành với `d.configuration.md`

> **Domain CKAD:** Application Environment, Configuration and Security (**25% — nặng nhất**)
> Gồm: ConfigMap, Secret, SecurityContext, ResourceRequests/Limits, LimitRange,
> ResourceQuota, và ServiceAccount. **Đầu tư nhiều thời gian nhất cho chương này.**

---

## 6.1. ConfigMap — tách cấu hình khỏi image

Lưu cấu hình **không nhạy cảm** dạng key-value. Pod nạp vào qua **biến môi trường** hoặc
**mount thành file (volume)**.

```bash
# Tạo từ literal
k create configmap config --from-literal=foo=lala --from-literal=foo2=lolo
# Từ file (key = tên file, value = nội dung)
k create configmap config --from-file=app.properties
# Từ file .env (mỗi dòng KEY=VALUE thành 1 entry)
k create configmap config --from-env-file=config.env
# Đặt key tuỳ ý cho file
k create configmap config --from-file=special=app.properties

k get configmap config -o yaml      # xem
k describe configmap config
```

### Nạp ConfigMap vào Pod

**Một biến cụ thể → 1 env var:**
```yaml
env:
  - name: option                 # tên biến trong container
    valueFrom:
      configMapKeyRef:
        name: options
        key: var5
```

**Nạp TẤT CẢ key thành env vars:**
```yaml
envFrom:
  - configMapRef:
      name: anotherone
```

**Mount thành file (volume):**
```yaml
spec:
  containers:
    - name: nginx
      image: nginx
      volumeMounts:
        - name: cmvol
          mountPath: /etc/lala
  volumes:
    - name: cmvol
      configMap:
        name: cmvolume
```
→ Mỗi key thành 1 file trong `/etc/lala` (tên file = key, nội dung = value).

---

## 6.2. Secret — như ConfigMap nhưng cho dữ liệu nhạy cảm

Giá trị được lưu **base64** (KHÔNG phải mã hoá mạnh — chỉ encode). Dùng cho mật khẩu, token.

```bash
k create secret generic mysecret --from-literal=password=mypass
k create secret generic mysecret2 --from-file=username    # key=tên file

k get secret mysecret2 -o yaml
# Giải mã giá trị:
k get secret mysecret2 -o jsonpath='{.data.username}' | base64 -d
```

Nạp vào Pod (giống ConfigMap, đổi `configMap*` → `secret*`):
```yaml
# Env từ 1 key
env:
  - name: USERNAME
    valueFrom:
      secretKeyRef:
        name: mysecret2
        key: username
# Hoặc mount volume:
volumes:
  - name: foo
    secret:
      secretName: mysecret2
```

Loại secret khác hay gặp:
```bash
# docker-registry (để pull image private — liên quan podman)
k create secret docker-registry regcred \
  --docker-server=... --docker-username=... --docker-password=... --docker-email=...
# tls
k create secret tls mytls --cert=tls.crt --key=tls.key
```

> **ConfigMap vs Secret:** cú pháp gần như y hệt. Quy tắc: dữ liệu nhạy cảm → Secret.
> Trong YAML, `data` của Secret là base64, `stringData` cho phép ghi giá trị thô (K8s tự encode).

---

## 6.3. SecurityContext — chạy container với quyền nào

Đặt user/group, quyền, capabilities cho Pod hoặc từng container.

```yaml
spec:
  securityContext:                # cấp Pod (áp cho mọi container)
    runAsUser: 101
    runAsGroup: 3000
    fsGroup: 2000
  containers:
    - name: nginx
      image: nginx
      securityContext:            # cấp container (ghi đè cấp Pod)
        runAsUser: 101
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          add: ["NET_ADMIN", "SYS_TIME"]
          drop: ["ALL"]
```

> Nhớ: `capabilities` chỉ đặt ở **cấp container** (trong `containers[].securityContext`),
> không đặt ở cấp Pod. `runAsUser`, `fsGroup` đặt được ở cả hai cấp.

---

## 6.4. Resource requests & limits

- **requests**: lượng tài nguyên Pod **được đảm bảo**; scheduler dùng để chọn node.
- **limits**: mức **trần**; vượt CPU → bị throttle, vượt RAM → bị OOMKilled.

```yaml
resources:
  requests:
    cpu: "100m"        # 100 milicpu = 0.1 core
    memory: "256Mi"
  limits:
    cpu: "200m"
    memory: "512Mi"
```
Đơn vị: CPU `m` = milicore (`1000m` = 1 core); RAM `Mi`/`Gi` (mebi/gibi).

---

## 6.5. LimitRange & ResourceQuota (cấp namespace)

- **LimitRange**: đặt min/max/default cho **từng** Pod/Container trong namespace.
- **ResourceQuota**: giới hạn **tổng** tài nguyên của cả namespace.

```yaml
# LimitRange
apiVersion: v1
kind: LimitRange
metadata: { name: mylimit, namespace: limitrange }
spec:
  limits:
    - type: Container          # hoặc Pod
      max: { memory: 500Mi }
      min: { memory: 100Mi }
      default: { memory: 300Mi }          # limit mặc định
      defaultRequest: { memory: 200Mi }   # request mặc định
```
```bash
# ResourceQuota imperative
k create quota myrq -n one \
  --hard=requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi
k describe namespace limitrange
k describe quota -n one
```

> Khi namespace có ResourceQuota về requests/limits, **mọi Pod tạo mới BẮT BUỘC khai báo
> requests & limits**, nếu không sẽ bị từ chối. Đây là tình huống bài tập trong `d.` cố ý
> tạo (tạo pod vượt quota → bị reject).

---

## 6.6. ServiceAccount (xuất hiện trong domain Security)

Định danh để Pod gọi API server. Mỗi namespace có `default` SA.
```bash
k create serviceaccount mysa
k run nginx --image=nginx --overrides='{"spec":{"serviceAccountName":"mysa"}}'
# hoặc trong YAML: spec.serviceAccountName: mysa
```

---

## 6.7. Lỗi thường gặp
- ❌ Đặt `capabilities` ở cấp Pod → không hợp lệ. Phải ở container.
- ❌ Quên giá trị Secret trong YAML phải là **base64** (dùng `stringData` để tránh).
- ❌ Tạo Pod trong namespace có Quota mà thiếu requests/limits → Pod bị từ chối, đọc Events.
- ❌ Nhầm `configMapKeyRef` (1 key) với `configMapRef` trong `envFrom` (tất cả key).
- ❌ Mount ConfigMap/Secret nhưng quên khai báo `volumes` tương ứng.

---

## 6.8. Bài tự luyện (bấm giờ)
1. Tạo ConfigMap `appcfg` với `LOG_LEVEL=debug,MODE=prod`; nạp tất cả vào pod nginx qua `envFrom`.
2. Tạo Secret `dbcred` từ literal `password=s3cr3t`; mount vào pod tại `/etc/secret` và đọc file.
3. Tạo namespace `prod` + ResourceQuota tổng `requests.cpu=2,limits.cpu=4`; thử tạo pod thiếu
   resources → quan sát bị từ chối; rồi tạo pod hợp lệ.
4. Viết YAML pod nginx chạy `runAsUser: 1000`, thêm capability `NET_ADMIN`.

→ Tiếp: [07-observability.md](07-observability.md)
