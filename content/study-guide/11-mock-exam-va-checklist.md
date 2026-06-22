# 11. Đề thi thử, Cheat Sheet & Checklist ngày thi

Chương cuối: luyện tốc độ, tổng hợp lệnh, và chuẩn bị tâm thế/phòng máy cho ngày thi.

---

## 11.1. Đề thi thử (bấm giờ — mục tiêu hoàn thành < 60 phút)

Làm trong namespace sạch, **bấm giờ nghiêm túc**, không nhìn study-guide (chỉ được mở
kubernetes.io như khi thi). Đáp án để tự đối chiếu ở cuối.

> Tổng 10 câu, mô phỏng độ phủ domain. Đề thật ~15–20 câu/2h.

1. **(Core)** Tạo namespace `ecom`. Trong đó tạo pod `cache` image `redis:7`, port 6379.
2. **(Pod design)** Tạo deployment `store` image `nginx:1.25`, 3 replica, label `app=store`.
   Update image lên `nginx:1.26`, xem rollout, rồi rollback.
3. **(Config)** Tạo ConfigMap `store-cfg` với `MODE=prod,LOG=info`. Nạp toàn bộ vào deployment
   `store` qua `envFrom`.
4. **(Security)** Tạo Secret `store-sec` với `API_KEY=abc123`. Mount vào pod `cache` tại
   `/etc/secret`.
5. **(Config)** Thêm requests `cpu=100m,memory=128Mi` và limits `cpu=250m,memory=256Mi` cho
   container trong deployment `store`.
6. **(Observability)** Thêm readinessProbe httpGet `/` port 80 và livenessProbe exec `ls`
   (delay 5s, period 10s) cho deployment `store`.
7. **(Services)** Expose deployment `store` bằng ClusterIP service `store-svc` port 80. Từ pod
   busybox tạm, wget vào `store-svc`.
8. **(Networking)** Tạo NetworkPolicy chỉ cho pod label `role=client` truy cập pod `app=store`
   trên port 80.
9. **(State)** Tạo PVC `data-pvc` 1Gi RWO storageClass `standard`. Gắn vào pod `cache` tại
   `/data`.
10. **(Multi-container)** Tạo pod `logger` gồm container chính nginx + sidecar busybox chạy
    `sleep 3600`, cùng mount emptyDir tại `/var/log/shared`.

<details>
<summary><b>👉 Bấm để xem đáp án (sau khi đã tự làm)</b></summary>

```bash
# 1
k create ns ecom
k run cache --image=redis:7 --port=6379 -n ecom

# 2
k create deploy store --image=nginx:1.25 --replicas=3
k label deploy store app=store --overwrite
k set image deploy/store nginx=nginx:1.26
k rollout status deploy store
k rollout undo deploy store

# 3
k create cm store-cfg --from-literal=MODE=prod --from-literal=LOG=info
# k edit deploy store  → thêm vào containers[].envFrom:
#   envFrom:
#     - configMapRef: { name: store-cfg }

# 4
k create secret generic store-sec --from-literal=API_KEY=abc123 -n ecom
# edit pod cache (hoặc tạo lại) → volumes + volumeMounts:
#   volumes: [{name: sec, secret: {secretName: store-sec}}]
#   volumeMounts: [{name: sec, mountPath: /etc/secret}]

# 5  (k edit deploy store → resources)
#   resources:
#     requests: {cpu: 100m, memory: 128Mi}
#     limits:   {cpu: 250m, memory: 256Mi}

# 6  (k edit deploy store → probes như chương 7)

# 7
k expose deploy store --name=store-svc --port=80
k run tmp --image=busybox --restart=Never --rm -it -- wget -O- --timeout=2 store-svc:80

# 8  (NetworkPolicy ingress, podSelector app=store, from podSelector role=client, port 80)

# 9
# PVC YAML 1Gi RWO storageClassName standard; gắn vào pod cache qua persistentVolumeClaim

# 10  (pod 2 container + emptyDir như chương 4)
```
</details>

---

## 11.2. Cheat Sheet lệnh "sống còn"

```bash
# Alias đầu giờ thi
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"

# Tạo nhanh
k run NAME --image=IMG --port=80                 # pod
k run NAME --image=IMG --restart=Never -- CMD    # pod chạy lệnh
k create deploy NAME --image=IMG --replicas=N
k create cm NAME --from-literal=k=v
k create secret generic NAME --from-literal=k=v
k create job NAME --image=IMG -- CMD
k create cronjob NAME --image=IMG --schedule="*/1 * * * *" -- CMD
k expose deploy NAME --port=80 --target-port=8080 --name=SVC

# Sinh YAML rồi sửa
k run NAME --image=IMG $do > p.yaml
k create deploy NAME --image=IMG $do > d.yaml

# Sửa nhanh resource đang chạy
k edit deploy NAME
k set image deploy/NAME container=IMG:TAG
k scale deploy NAME --replicas=N
k label/annotate ...

# Rollout
k rollout status|history|undo deploy NAME

# Debug
k get pod -A -o wide
k describe pod NAME          # đọc Events
k logs NAME [-c C] [--previous] [-f]
k exec -it NAME -- sh
k get events --sort-by=.metadata.creationTimestamp

# Tra cứu cấu trúc
k explain pod.spec.containers
k api-resources              # tên & apiVersion mọi loại
```

### jsonpath hay dùng
```bash
k get pods -o jsonpath='{.items[*].metadata.name}'
k get secret S -o jsonpath='{.data.password}' | base64 -d
k get pods --sort-by=.metadata.creationTimestamp
```

---

## 11.3. Mẹo quản lý thời gian trong phòng thi

1. **Câu nào có % cao + dễ → làm trước.** Mỗi câu hiển thị trọng số.
2. **Đặt context namespace ngay** khi câu yêu cầu namespace cụ thể:
   `k config set-context --current --namespace=NS` (hoặc nhớ `-n`).
3. **Bí quá thì bỏ qua, flag lại** — đừng để 1 câu ngốn 20 phút.
4. **Imperative trước, YAML sau.** Chỉ mở vim khi bắt buộc.
5. **Luôn verify nhanh**: `k get` / `k describe` sau mỗi câu.
6. **Copy ví dụ từ kubernetes.io** rồi sửa, nhanh hơn gõ tay (NetworkPolicy, probes, PV...).
7. Mỗi câu có thể chạy trên **cluster/context khác nhau** — đọc kỹ dòng `kubectl config
   use-context ...` đầu đề và chạy nó!

---

## 11.4. Checklist trước ngày thi

**Kỹ năng (phải làm được không cần nghĩ):**
- [ ] Sinh YAML bằng `$do`, sửa trong vim không lỗi thụt lề.
- [ ] Tạo & expose deployment, rolling update + rollback.
- [ ] ConfigMap/Secret: tạo, nạp env (`envFrom`/`*KeyRef`), mount volume.
- [ ] SecurityContext, requests/limits, ResourceQuota.
- [ ] 3 loại probe và phân biệt vai trò.
- [ ] Service ClusterIP/NodePort + debug Endpoints rỗng.
- [ ] NetworkPolicy ingress cơ bản.
- [ ] PV/PVC bind và gắn vào Pod.
- [ ] Job/CronJob, multi-container + emptyDir, init container.
- [ ] Debug: get → describe → logs → exec.

**Hậu cần (theo yêu cầu của Linux Foundation):**
- [ ] Đọc kỹ "Important Instructions: CKAD" trên trang đăng ký.
- [ ] CMTND/Passport còn hạn, tên trùng khớp đăng ký.
- [ ] Trình duyệt Chrome + cài extension PSI/giám thị theo hướng dẫn.
- [ ] Webcam, mic hoạt động; mạng ổn định; bàn sạch, phòng không người khác.
- [ ] Đăng nhập sớm 15–30 phút để check-in.
- [ ] Đã làm killer.sh ít nhất 1 lần (được 2 session free kèm voucher).

---

## 11.5. Sau khi đậu
- Chứng chỉ có hiệu lực **2 năm**. Lưu badge Credly.
- Cân nhắc học tiếp **CKA** (vận hành cluster) hoặc **CKS** (bảo mật, yêu cầu có CKA trước).

🎉 Chúc bạn thi đậu CKAD! Quay lại [README](README.md) để xem lại lộ trình.
