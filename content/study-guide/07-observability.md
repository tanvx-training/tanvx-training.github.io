# 7. Observability & Maintenance — đồng hành với `e.observability.md`

> **Domain CKAD:** Application Observability and Maintenance (15%)
> Gồm: **probes (liveness/readiness/startup)**, logging, debugging, và `kubectl top`.
> Probes ra thi rất thường xuyên.

---

## 7.1. Probes — K8s kiểm tra "sức khoẻ" container

| Probe | Câu hỏi nó trả lời | Khi thất bại |
|-------|--------------------|--------------|
| **livenessProbe** | "Container còn sống không?" | K8s **restart** container |
| **readinessProbe** | "Container sẵn sàng nhận traffic chưa?" | Pod bị **gỡ khỏi Service** (không restart) |
| **startupProbe** | "App khởi động xong chưa?" | Hoãn liveness/readiness cho app khởi động chậm |

Ba kiểu kiểm tra (probe handler):
- `exec`: chạy lệnh, thành công nếu exit code 0.
- `httpGet`: gọi HTTP, thành công nếu mã 2xx/3xx.
- `tcpSocket`: mở được cổng TCP là thành công.

```yaml
containers:
  - name: nginx
    image: nginx
    ports:
      - containerPort: 80
    livenessProbe:
      exec:
        command: ["ls"]
      initialDelaySeconds: 5     # chờ 5s rồi mới bắt đầu kiểm tra
      periodSeconds: 5           # mỗi 5s kiểm 1 lần
    readinessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
```

Các tham số thời gian cần nhớ:
| Field | Ý nghĩa |
|-------|---------|
| `initialDelaySeconds` | chờ bao lâu sau khi container start mới probe |
| `periodSeconds` | chu kỳ giữa các lần probe |
| `timeoutSeconds` | timeout mỗi lần probe |
| `failureThreshold` | số lần fail liên tiếp mới coi là thất bại |
| `successThreshold` | số lần pass liên tiếp mới coi là OK |

> **Phân biệt rõ:** liveness fail → *restart*; readiness fail → *ngừng nhận traffic* nhưng
> container vẫn chạy. App khởi động chậm → dùng startupProbe để liveness không giết oan.

---

## 7.2. Logging

```bash
k logs <pod>                    # log container (1 container)
k logs <pod> -c <container>     # chọn container
k logs <pod> -f                 # theo dõi realtime (follow)
k logs <pod> --previous         # log của instance đã chết (debug CrashLoop)
k logs -l app=web --prefix      # log mọi pod theo label, kèm tên pod
k logs <pod> --since=1h --tail=50
```

---

## 7.3. Debugging — quy trình chuẩn

```bash
k get pods                      # xem trạng thái (Pending? CrashLoop? ImagePull?)
k describe pod <pod>            # đọc mục EVENTS ở cuối — nguyên nhân thường ở đây
k logs <pod> [--previous]       # lý do app chết
k exec -it <pod> -- sh          # vào trong xem xét
k get events --sort-by=.metadata.creationTimestamp   # sự kiện toàn cluster
```

Xoá nhanh khi debug:
```bash
k delete pod <pod> --force --grace-period=0      # = $now
```

> Mẹo debug nâng cao (K8s mới): `kubectl debug` tạo ephemeral container để gắn vào Pod đang
> chạy mà không cần sửa Pod — biết khái niệm là đủ cho CKAD.

---

## 7.4. Bài "lọc pod có liveness probe FAIL" (trong `e.`)

Bài yêu cầu liệt kê `<namespace>/<pod>` của pod có liveness probe thất bại trên nhiều
namespace. Cách tiếp cận: tìm trong **events** các bản ghi `Unhealthy ... Liveness probe failed`,
hoặc kiểm tra pod restart nhiều + describe. Đây là bài luyện kỹ năng dùng `kubectl get ... -A`,
`jsonpath`/`grep`. Tham khảo lời giải gốc trong `e.observability.md`.

---

## 7.5. `kubectl top` — tài nguyên thực tế (cần metrics-server)

```bash
k top nodes
k top pods
k top pods -A --sort-by=memory
```

---

## 7.6. Lỗi thường gặp
- ❌ Nhầm vai trò liveness vs readiness.
- ❌ `httpGet` probe nhưng quên khai báo `containerPort`/`port` đúng.
- ❌ Quên `--previous` khi pod đã restart → không thấy lỗi gốc.
- ❌ `kubectl top` báo lỗi vì chưa cài metrics-server (xem chương 1).

---

## 7.7. Bài tự luyện
1. Tạo pod nginx có readinessProbe httpGet `/` port 80, liveness exec `ls`, cả hai delay 5s,
   chu kỳ 10s. Kiểm tra qua `describe`.
2. Tạo pod busybox chạy `notexist` → quan sát CrashLoop, dùng `logs --previous` + `describe`
   tìm nguyên nhân, rồi xoá nhanh.

→ Tiếp: [08-services-networking.md](08-services-networking.md)
