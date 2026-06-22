# Lời giải chi tiết — `d.configuration.md` (Configuration & Security)

> Domain nặng nhất (25%). Đọc kèm [06-configuration.md](../06-configuration.md).
> Gồm: ConfigMaps · SecurityContext · Requests/Limits · LimitRange · ResourceQuota · Secrets · ServiceAccounts.

---

## A. ConfigMaps

### 1. ConfigMap `config` với `foo=lala,foo2=lolo`
```bash
kubectl create configmap config --from-literal=foo=lala --from-literal=foo2=lolo
```
**Giải thích:** `--from-literal=key=val` lặp lại cho từng cặp. `configmap` có alias `cm`.

### 2. Hiện giá trị
```bash
kubectl get cm config -o yaml
kubectl describe cm config
```

### 3. ConfigMap từ file
```bash
echo -e "foo3=lili\nfoo4=lele" > config.txt
kubectl create cm configmap2 --from-file=config.txt
```
**Giải thích:** `--from-file=<file>` → tạo 1 entry với **key = tên file**, **value = toàn bộ
nội dung file** (cả 2 dòng nằm chung 1 value).

### 4. ConfigMap từ file `.env`
```bash
echo -e "var1=val1\n# comment\n\nvar2=val2" > config.env
kubectl create cm configmap3 --from-env-file=config.env
```
**Giải thích:** `--from-env-file` parse **từng dòng `KEY=VALUE` thành entry riêng** (bỏ qua
dòng trống/comment). Khác hẳn `--from-file`.

### 5. ConfigMap từ file, đặt key tuỳ ý `special`
```bash
kubectl create cm configmap4 --from-file=special=config4.txt
```
**Giải thích:** `--from-file=<key>=<file>` ép key thành `special` thay vì tên file.

### 6. ConfigMap `options` (var5=val5) → nạp `var5` vào env `option` của pod nginx
```yaml
spec:
  containers:
  - image: nginx
    name: nginx
    env:
    - name: option              # tên biến trong container
      valueFrom:
        configMapKeyRef:
          name: options         # tên ConfigMap
          key: var5             # key trong ConfigMap
```
```bash
kubectl exec -it nginx -- env | grep option   # option=val5
```
**Giải thích:** `configMapKeyRef` nạp **một** key thành **một** biến (có thể đổi tên biến).

### 7. ConfigMap `anotherone` (var6,var7) → nạp TẤT CẢ làm env
```yaml
    envFrom:                    # khác 'env' ở bài 6
    - configMapRef:             # khác 'configMapKeyRef'
        name: anotherone
```
**Giải thích — điểm cốt lõi:** `envFrom + configMapRef` nạp **toàn bộ** key thành biến (giữ
nguyên tên key làm tên biến). So sánh:
| Mục đích | Cú pháp |
|----------|---------|
| 1 key → 1 biến (đổi tên được) | `env[].valueFrom.configMapKeyRef` |
| tất cả key → biến | `envFrom[].configMapRef` |

### 8. ConfigMap `cmvolume` (var8,var9) → mount volume tại `/etc/lala`
```yaml
spec:
  volumes:
  - name: myvolume
    configMap:
      name: cmvolume
  containers:
  - image: nginx
    name: nginx
    volumeMounts:
    - name: myvolume
      mountPath: /etc/lala
```
```bash
kubectl exec -it nginx -- ls /etc/lala     # var8 var9 (mỗi key = 1 file)
```
**Giải thích:** mount ConfigMap thành volume → **mỗi key thành 1 file** (tên file = key, nội
dung = value). Khác với nạp env (key thành biến).

---

## B. SecurityContext

### 9. Pod nginx chạy với userID 101 (chỉ YAML)
```yaml
spec:
  securityContext:        # cấp Pod
    runAsUser: 101
  containers:
  - image: nginx
    name: nginx
```
**Giải thích:** `securityContext` cấp Pod áp cho mọi container. `runAsUser` đặt UID tiến trình.

### 10. Pod nginx thêm capabilities `NET_ADMIN`, `SYS_TIME`
```yaml
  containers:
  - image: nginx
    name: nginx
    securityContext:        # ⚠️ cấp CONTAINER
      capabilities:
        add: ["NET_ADMIN", "SYS_TIME"]
```
**Giải thích — bẫy kinh điển:** `capabilities` chỉ đặt ở **container.securityContext**, KHÔNG
đặt ở Pod. Còn `runAsUser`/`fsGroup` thì đặt được ở cả hai cấp.

---

## C. Resource requests & limits

### 11. Pod nginx requests cpu=100m,mem=256Mi; limits cpu=200m,mem=512Mi
```yaml
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "200m"
```
**Giải thích:** `requests` = đảm bảo (scheduler dùng để xếp node); `limits` = trần (vượt RAM →
OOMKilled, vượt CPU → throttle). `100m` = 0.1 core; `Mi` = mebibyte.

---

## D. LimitRange (cấp namespace)

### 12. Namespace `limitrange` + LimitRange giới hạn pod memory max 500Mi, min 100Mi
```bash
kubectl create ns limitrange
```
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: ns-memory-limit
  namespace: limitrange
spec:
  limits:
  - type: Pod
    max: { memory: "500Mi" }
    min: { memory: "100Mi" }
```
**Giải thích:** LimitRange áp min/max (và default) cho **mỗi** Pod/Container tạo trong namespace.

### 13. Describe namespace limitrange
```bash
kubectl describe limitrange ns-memory-limit -n limitrange
```

### 14. Pod nginx request 250Mi trong namespace limitrange
```yaml
    resources:
      requests: { memory: "250Mi" }
      limits:   { memory: "500Mi" }   # phải khai báo và <= max của LimitRange
```
**Giải thích:** vì có LimitRange, Pod phải nằm trong khoảng [100Mi, 500Mi]; limit không vượt max.

---

## E. ResourceQuota (cấp namespace)

### 15. ResourceQuota ở ns `one`: requests cpu=1/mem=1Gi, limits cpu=2/mem=2Gi
```bash
kubectl create ns one
kubectl create quota my-rq --namespace=one \
  --hard=requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi
```
**Giải thích:** Quota giới hạn **tổng** tài nguyên của cả namespace (khác LimitRange giới hạn
từng pod).

### 16. Thử tạo pod vượt quota (requests cpu=2/mem=3Gi, limits cpu=3/mem=4Gi) → bị từ chối
```yaml
    resources:
      requests: { memory: "3Gi", cpu: "2" }
      limits:   { memory: "4Gi", cpu: "3" }
```
Kết quả: `Error from server (Forbidden): ... exceeded quota: my-rq ...`
**Giải thích:** vượt tổng quota → API server từ chối ngay. Đọc thông báo để biết phần nào vượt.

### 17. Tạo pod hợp lệ (requests cpu=0.5/mem=1Gi, limits cpu=1/mem=2Gi)
```yaml
    resources:
      requests: { memory: "1Gi", cpu: "0.5" }
      limits:   { memory: "2Gi", cpu: "1" }
```
```bash
kubectl get resourcequota -n one    # xem mức đã dùng / tổng
```
**Giải thích quan trọng:** khi namespace có Quota về requests/limits, **mọi Pod BẮT BUỘC khai
báo requests & limits**, nếu thiếu cũng bị từ chối.

---

## F. Secrets

### 18. Secret `mysecret` với `password=mypass`
```bash
kubectl create secret generic mysecret --from-literal=password=mypass
```
**Giải thích:** `generic` = secret thường (Opaque). Giá trị lưu **base64** (chỉ encode, không
mã hoá mạnh).

### 19. Secret `mysecret2` lấy key/value từ file
```bash
echo -n admin > username
kubectl create secret generic mysecret2 --from-file=username
```
**Giải thích:** `echo -n` không thêm newline (tránh giá trị dư `\n`). Key = tên file `username`.

### 20. Lấy giá trị mysecret2 (giải mã)
```bash
kubectl get secret mysecret2 -o jsonpath='{.data.username}' | base64 -d   # macOS: base64 -D
```
**Giải thích:** `.data.username` là base64; `base64 -d` giải mã ra `admin`.

### 21. Mount mysecret2 thành volume tại `/etc/foo`
```yaml
spec:
  volumes:
  - name: foo
    secret:
      secretName: mysecret2
  containers:
  - image: nginx
    name: nginx
    volumeMounts:
    - name: foo
      mountPath: /etc/foo
```
```bash
kubectl exec -it nginx -- cat /etc/foo/username   # admin
```
**Giải thích:** giống mount ConfigMap, đổi `configMap` → `secret`/`secretName`. Mỗi key thành
1 file.

### 22. Nạp biến `username` từ secret thành env `USERNAME`
```yaml
    env:
    - name: USERNAME
      valueFrom:
        secretKeyRef:
          name: mysecret2
          key: username
```
**Giải thích:** `secretKeyRef` (tương đương `configMapKeyRef` nhưng cho Secret).

### 23. Secret `ext-service-secret` trong ns `secret-ops` (literal API_KEY=...)
```bash
export ns="-n secret-ops"; export do="--dry-run=client -oyaml"
kubectl create secret generic ext-service-secret --from-literal=API_KEY=LmLHbYhsgWZwNifiqaRorH8T $ns $do > sc.yaml
kubectl apply -f sc.yaml
```

### 24. Pod `consumer` nạp secret làm env, in env
```yaml
    env:
    - name: API_KEY
      valueFrom:
        secretKeyRef:
          name: ext-service-secret
          key: API_KEY
```

### 25. Secret type `kubernetes.io/ssh-auth` với key `ssh-privatekey`
```bash
kubectl create secret generic my-secret -n secret-ops \
  --type="kubernetes.io/ssh-auth" --from-file=ssh-privatekey=id_rsa --dry-run=client -oyaml > sc.yaml
kubectl apply -f sc.yaml
```
**Giải thích:** `--type` đặt loại secret chuyên dụng (ssh-auth yêu cầu đúng key `ssh-privatekey`).

### 26. Pod `consumer` mount secret thành volume read-only tại `/var/app`
```yaml
  containers:
  - image: nginx
    name: consumer
    volumeMounts:
    - name: foo
      mountPath: "/var/app"
      readOnly: true
  volumes:
  - name: foo
    secret:
      secretName: my-secret
      optional: true
```
**Giải thích:** `readOnly: true` không cho ghi; `optional: true` cho phép Pod start dù secret
chưa tồn tại.

---

## G. ServiceAccounts

### 27. Xem mọi SA mọi namespace
```bash
kubectl get sa -A
```
**Giải thích:** ServiceAccount = danh tính để Pod gọi API server. Mỗi namespace có `default`.

### 28. Tạo SA `myuser`
```bash
kubectl create sa myuser
```

### 29. Pod nginx dùng SA `myuser`
```yaml
spec:
  serviceAccountName: myuser
  containers:
  - image: nginx
    name: nginx
```
```bash
kubectl get pod nginx -o jsonpath='{.spec.serviceAccountName}'   # myuser
```

### 30. Sinh API token cho SA myuser
```bash
kubectl create token myuser
```
**Giải thích:** K8s 1.24+ token được cấp động (không còn tự tạo secret token vĩnh viễn).

---

## 🎯 Tổng kết chương d (quan trọng nhất!)
- ConfigMap/Secret tạo: `--from-literal` / `--from-file` / `--from-env-file`.
- Nạp vào Pod: 1 key→1 biến (`*KeyRef`), tất cả→biến (`envFrom`+`*Ref`), hoặc mount volume.
- Secret = ConfigMap + base64 + type; `base64 -d` để đọc.
- SecurityContext: `runAsUser` (Pod/container), `capabilities` (chỉ container).
- requests/limits (pod) vs LimitRange (mỗi pod/ns) vs ResourceQuota (tổng ns).
- Quota bật → pod phải có requests & limits.
