# Lời giải chi tiết — `e.observability.md` (Observability)

> Đọc kèm [07-observability.md](../07-observability.md). Gồm: Probes · Logging · Debugging · top.

---

## A. Probes

### 1. Pod nginx với livenessProbe chạy lệnh `ls`
```yaml
    livenessProbe:
      exec:
        command:
        - ls
```
```bash
kubectl create -f pod.yaml
kubectl describe pod nginx | grep -i liveness   # xem cấu hình probe
kubectl delete -f pod.yaml
```
**Giải thích:** `livenessProbe` = "container còn sống không?". Kiểu `exec` chạy lệnh; exit code
0 = OK. `ls` luôn trả 0 nên probe luôn pass (chỉ để minh hoạ). Liveness fail → **restart** container.

### 2. Liveness bắt đầu sau 5s, chu kỳ 5s
```yaml
    livenessProbe:
      initialDelaySeconds: 5
      periodSeconds: 5
      exec:
        command: [ls]
```
**Giải thích:** `initialDelaySeconds` = chờ bao lâu sau khi container start mới probe lần đầu;
`periodSeconds` = khoảng giữa các lần probe. Tra tên field chính xác bằng
`kubectl explain pod.spec.containers.livenessProbe`.

### 3. Pod nginx (port 80) với readinessProbe httpGet `/` port 80
```yaml
    ports:
    - containerPort: 80
    readinessProbe:
      httpGet:
        path: /
        port: 80
```
```bash
kubectl describe pod nginx | grep -i readiness
```
**Giải thích:** `readinessProbe` = "sẵn sàng nhận traffic chưa?". Fail → Pod **bị gỡ khỏi
Service** (không restart). Kiểu `httpGet` thành công nếu HTTP trả 2xx/3xx.

> **Phân biệt cốt lõi:** liveness fail → restart; readiness fail → ngừng nhận traffic nhưng vẫn chạy.

### 4. Liệt kê pod có liveness probe FAIL (nhiều namespace) dạng `ns/pod`
```bash
kubectl get events -A -o json | jq -r \
  '.items[] | select(.message | contains("Liveness probe failed")).involvedObject | .namespace + "/" + .name'
```
**Giải thích:** liveness fail sinh event `Unhealthy ... Liveness probe failed`. Lệnh lấy events
JSON, lọc theo message, ghép `namespace/name`. Đây là bài luyện `jq`/jsonpath + đọc events.

---

## B. Logging

### 5. Pod busybox in số đếm theo giây, xem log
```bash
kubectl run busybox --image=busybox --restart=Never -- \
  /bin/sh -c 'i=0; while true; do echo "$i: $(date)"; i=$((i+1)); sleep 1; done'
kubectl logs busybox -f
```
**Giải thích:** `-f` (follow) theo dõi log realtime như `tail -f`. Ctrl+C để thoát.

---

## C. Debugging

### 6. Pod busybox chạy `ls /notexist` → thấy lỗi
```bash
kubectl run busybox --restart=Never --image=busybox -- /bin/sh -c 'ls /notexist'
kubectl logs busybox            # "ls: /notexist: No such file or directory"
kubectl describe po busybox
kubectl delete po busybox
```
**Giải thích:** container **chạy được** nhưng lệnh báo lỗi ra stderr → thấy trong `logs`.

### 7. Pod busybox chạy `notexist` (binary không tồn tại) → xoá nhanh
```bash
kubectl run busybox --restart=Never --image=busybox -- notexist
kubectl logs busybox            # RỖNG — container chưa từng start
kubectl describe po busybox     # mục Events có lỗi "executable file not found"
kubectl get events | grep -i error
kubectl delete po busybox --force --grace-period=0
```
**Giải thích — bài học quan trọng:** khi container **không start được**, `logs` rỗng → phải
dùng `describe`/`events`. `--force --grace-period=0` xoá tức thì (= alias `$now`).

---

## D. Metrics

### 8. CPU/RAM của node (cần metrics-server)
```bash
kubectl top nodes
kubectl top pods
```
**Giải thích:** `top` cần metrics-server cài sẵn (xem study-guide chương 1). Không có → báo lỗi
"Metrics API not available".

---

## 🎯 Tổng kết chương e
- 3 probe: liveness (restart), readiness (gỡ traffic), startup (cho app khởi động chậm).
- Field thời gian: initialDelaySeconds, periodSeconds, timeoutSeconds, failureThreshold.
- `logs -f` follow, `logs --previous` cho container đã restart.
- Container chạy-nhưng-lỗi → xem `logs`; container không-start → xem `describe`/`events`.
- `kubectl explain` để tra tên field nhanh.
