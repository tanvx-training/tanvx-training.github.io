# 12. Đề thi thử 2 — Mức TRUNG CẤP (bấm giờ 90 phút)

> 16 câu phủ đủ 5 domain, độ khó tương đương đề thật. **Bấm giờ 90 phút**, chỉ mở
> kubernetes.io. Tự làm hết rồi mới xem đáp án ở cuối. Mỗi câu ghi trọng số tham khảo.
>
> Chuẩn bị: `alias k=kubectl`, `export do="--dry-run=client -o yaml"`, `export now="--force --grace-period=0"`.

---

## Đề bài

**Q1 (Core, 4%).** Tạo namespace `team-a`. Trong đó tạo pod `web` image `nginx:1.25`, gắn label
`app=web,env=dev`, khai báo containerPort 80.

**Q2 (Core, 4%).** Sinh (không tạo) YAML cho pod `tools` image `busybox` chạy `sleep 3600`, lưu
`tools.yaml`, sau đó tạo pod từ file trong namespace `team-a`.

**Q3 (Pod design, 6%).** Trong `team-a`, tạo deployment `api` image `nginx:1.24`, 3 replica, port 80.

**Q4 (Pod design, 6%).** Update image `api` lên `nginx:1.25`, theo dõi rollout, rồi rollback về
bản trước. Ghi lại revision hiện tại.

**Q5 (Pod design, 5%).** Tạo CronJob `report` image `busybox`, chạy mỗi 2 phút, in `date`. Đảm
bảo job bị huỷ nếu chạy quá 10 giây.

**Q6 (Config, 7%).** Tạo ConfigMap `app-config` với `APP_MODE=prod` và `APP_TIER=backend`. Sửa
deployment `api` để nạp **toàn bộ** ConfigMap này thành biến môi trường.

**Q7 (Config, 7%).** Tạo Secret `db-secret` với `DB_PASS=Sup3rS3cr3t`. Sửa deployment `api` để
nạp `DB_PASS` thành biến môi trường `DATABASE_PASSWORD`.

**Q8 (Config/Security, 6%).** Tạo pod `secure` image `nginx` trong `team-a` chạy với `runAsUser:
2000`, `fsGroup: 3000`, và thêm capability `NET_ADMIN` cho container.

**Q9 (Config, 6%).** Thêm requests `cpu=100m,memory=128Mi` và limits `cpu=300m,memory=256Mi`
cho container của deployment `api`.

**Q10 (Config, 5%).** Tạo namespace `restricted` với ResourceQuota: tổng `requests.cpu=1`,
`limits.cpu=2`, `requests.memory=1Gi`, `limits.memory=2Gi`.

**Q11 (Observability, 7%).** Sửa deployment `api`: thêm readinessProbe httpGet `/` port 80
(delay 5s, period 10s) và livenessProbe tcpSocket port 80 (delay 10s).

**Q12 (Observability, 5%).** Tạo pod `crash` image `busybox` chạy `notexist`. Xác định nguyên
nhân lỗi (chỉ rõ lệnh bạn dùng), rồi xoá pod tức thì.

**Q13 (Services, 7%).** Expose deployment `api` bằng Service ClusterIP tên `api-svc` port 8080
→ targetPort 80. Từ pod busybox tạm, wget vào `api-svc:8080` và xác nhận phản hồi.

**Q14 (Services, 7%).** Đổi `api-svc` sang NodePort. Tìm cổng nodePort được cấp.

**Q15 (Networking, 7%).** Tạo NetworkPolicy `api-allow` trong `team-a`: chỉ pod có label
`role=frontend` được truy cập pod `app=api` trên port 80.

**Q16 (State, 6%).** Tạo PVC `cache-pvc` 2Gi RWO storageClass `standard`. Tạo pod `cache` image
`busybox` (`sleep 3600`) mount PVC tại `/data`.

---

<details>
<summary><b>👉 ĐÁP ÁN (chỉ mở sau khi đã tự làm hết)</b></summary>

```bash
# Q1
k create ns team-a
k run web --image=nginx:1.25 --port=80 -l app=web,env=dev -n team-a

# Q2
k run tools --image=busybox $do --command -- sleep 3600 > tools.yaml
k create -f tools.yaml -n team-a

# Q3
k create deploy api --image=nginx:1.24 --replicas=3 --port=80 -n team-a

# Q4
k set image deploy/api nginx=nginx:1.25 -n team-a
k rollout status deploy api -n team-a
k rollout undo deploy api -n team-a
k rollout history deploy api -n team-a

# Q5  (cronjob; activeDeadlineSeconds nằm trong jobTemplate.spec)
k create cronjob report --image=busybox --schedule="*/2 * * * *" $do -- /bin/sh -c 'date' > report.yaml
#   thêm:  spec.jobTemplate.spec.activeDeadlineSeconds: 10
k create -f report.yaml -n team-a

# Q6
k create cm app-config --from-literal=APP_MODE=prod --from-literal=APP_TIER=backend -n team-a
k edit deploy api -n team-a
#   thêm trong containers[]:
#     envFrom:
#     - configMapRef: { name: app-config }

# Q7
k create secret generic db-secret --from-literal=DB_PASS=Sup3rS3cr3t -n team-a
k edit deploy api -n team-a
#     env:
#     - name: DATABASE_PASSWORD
#       valueFrom: { secretKeyRef: { name: db-secret, key: DB_PASS } }

# Q8
cat <<'EOF' | kubectl apply -n team-a -f -
apiVersion: v1
kind: Pod
metadata: { name: secure }
spec:
  securityContext: { runAsUser: 2000, fsGroup: 3000 }
  containers:
  - name: nginx
    image: nginx
    securityContext: { capabilities: { add: ["NET_ADMIN"] } }
EOF

# Q9  (k edit deploy api -n team-a → resources)
#   resources:
#     requests: { cpu: 100m, memory: 128Mi }
#     limits:   { cpu: 300m, memory: 256Mi }

# Q10
k create ns restricted
k create quota rq --namespace=restricted \
  --hard=requests.cpu=1,limits.cpu=2,requests.memory=1Gi,limits.memory=2Gi

# Q11  (k edit deploy api -n team-a → trong containers[])
#   readinessProbe: { httpGet: { path: /, port: 80 }, initialDelaySeconds: 5, periodSeconds: 10 }
#   livenessProbe:  { tcpSocket: { port: 80 }, initialDelaySeconds: 10 }

# Q12
k run crash --image=busybox -n team-a --restart=Never -- notexist
k describe po crash -n team-a    # Events: "executable file not found" (logs RỖNG)
k delete po crash -n team-a --force --grace-period=0

# Q13
k expose deploy api --name=api-svc --port=8080 --target-port=80 -n team-a
k run tmp --image=busybox --restart=Never --rm -it -n team-a -- wget -O- --timeout=2 api-svc:8080

# Q14
k patch svc api-svc -n team-a -p '{"spec":{"type":"NodePort"}}'
k get svc api-svc -n team-a       # đọc cột PORT(S): 8080:3xxxx/TCP

# Q15
cat <<'EOF' | kubectl apply -n team-a -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: api-allow }
spec:
  podSelector: { matchLabels: { app: api } }
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector: { matchLabels: { role: frontend } }
    ports:
    - { protocol: TCP, port: 80 }
EOF

# Q16
cat <<'EOF' | kubectl apply -n team-a -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: cache-pvc }
spec:
  storageClassName: standard
  accessModes: ["ReadWriteOnce"]
  resources: { requests: { storage: 2Gi } }
---
apiVersion: v1
kind: Pod
metadata: { name: cache }
spec:
  containers:
  - name: cache
    image: busybox
    command: ["sleep","3600"]
    volumeMounts: [{ name: data, mountPath: /data }]
  volumes:
  - name: data
    persistentVolumeClaim: { claimName: cache-pvc }
EOF
```

### Tự chấm
- ≥ 11/16 câu hoàn chỉnh đúng namespace → bạn đang ở ngưỡng đậu. Dưới mức đó, rà lại domain yếu.
- Lưu ý lỗi hay gặp: **quên `-n team-a`**, nhầm `--port` vs `--target-port`, đặt `capabilities`
  sai cấp, `activeDeadlineSeconds` sai vị trí trong CronJob.
</details>

→ Khó hơn nữa: [13-de-thi-thu-3-nang-cao.md](13-de-thi-thu-3-nang-cao.md)
