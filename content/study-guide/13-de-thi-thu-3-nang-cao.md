# 13. Đề thi thử 3 — Mức NÂNG CAO (bấm giờ 90 phút)

> 15 câu nhiều bước, mô phỏng câu "khó nhằn" của killer.sh. Yêu cầu kết hợp nhiều khái niệm,
> debug, và dùng jsonpath. **Bấm giờ 90 phút.** Làm trong cluster sạch (cần Calico nếu test
> NetworkPolicy thật).
>
> `alias k=kubectl`, `export do="--dry-run=client -o yaml"`, `export now="--force --grace-period=0"`.

---

## Đề bài

**Q1 (Multi-container, 7%).** Tạo pod `web` trong ns `prod` gồm: container chính `nginx` (port 80)
phục vụ web root từ volume chung; init container `busybox` ghi `"<h1>v3</h1>"` vào `index.html`
của volume đó. Dùng `emptyDir`. Sau khi chạy, từ pod tạm wget IP pod và xác nhận thấy `v3`.

**Q2 (Sidecar, 7%).** Sửa pod `web`: thêm sidecar `busybox` chạy
`tail -f /var/log/nginx/access.log`, mount chung thư mục log `/var/log/nginx` với container nginx
(emptyDir). Xác nhận sidecar đọc được log khi có request.

**Q3 (Pod design, 6%).** Tạo deployment `worker` (image `busybox`, lệnh `sleep 3600`), 4 replica.
Cấu hình rolling update sao cho khi update **không quá 1 pod** unavailable và **không quá 1 pod**
surge cùng lúc.

**Q4 (Job, 6%).** Tạo Job `batch` image `busybox` in `done`, cần **6 completions** chạy với
**parallelism 3**, và tối đa retry 2 lần (`backoffLimit`).

**Q5 (Placement, 6%).** Gắn label `disk=ssd` cho một node. Tạo pod `fast` chỉ chạy trên node có
label đó. Xác nhận pod được xếp đúng node (lệnh kiểm tra).

**Q6 (Config, 7%).** Trong ns `prod`: tạo ConfigMap `nginx-conf` từ file `default.conf` (bạn tự
tạo file với nội dung server block bất kỳ hợp lệ), rồi mount nó vào pod nginx tại
`/etc/nginx/conf.d/`.

**Q7 (Security, 7%).** Tạo pod `hardened` image `nginx`: `readOnlyRootFilesystem: true`,
`allowPrivilegeEscalation: false`, drop **ALL** capabilities, chạy non-root `runAsUser: 1000`.
Giải thích (1 dòng) vì sao nginx có thể fail và cách cho phép ghi (gợi ý: emptyDir cho
`/var/cache/nginx`, `/var/run`).

**Q8 (ServiceAccount, 5%).** Tạo ServiceAccount `deployer` trong `prod`, tạo pod `runner` image
`nginx` dùng SA đó. Lấy ra (jsonpath) tên SA mà pod đang dùng.

**Q9 (Quota + debug, 6%).** Trong ns `restricted` (đã có ResourceQuota về requests/limits), tạo
pod `nginx` **thiếu** resources → quan sát bị từ chối. Sửa cho hợp lệ và tạo thành công.

**Q10 (Observability, 6%).** Có nhiều pod ở các ns `qa`, `staging`. Viết một lệnh in ra
`<namespace>/<pod>` của mọi pod đang ở trạng thái không `Running` (vd Pending/CrashLoopBackOff).

**Q11 (Services, 7%).** Tạo deployment `app` (image `dgkanatsios/simpleapp`, port 8080, 3 replica)
trong `prod`. Expose ClusterIP port 80→8080. Từ pod tạm, gọi service nhiều lần và xác nhận
**hostname trả về khác nhau** (chứng minh load balancing).

**Q12 (Networking, 8%).** Trong `prod`, tạo NetworkPolicy cho deployment `app`: (a) chỉ nhận
ingress từ pod `role=client` **trong cùng namespace** trên port 8080; (b) chỉ cho egress ra
DNS (UDP/TCP 53) và tới pod `app=db`. (Cần CNI hỗ trợ.)

**Q13 (State, 7%).** Tạo PV `pv-logs` 5Gi RWX hostPath `/mnt/logs` storageClass `manual`. Tạo
PVC `logs-pvc` 3Gi RWX storageClass `manual`. Tạo 2 pod cùng mount PVC tại `/logs`; pod A ghi
file, pod B đọc được. Giải thích điều kiện để pod B thấy file.

**Q14 (Debug, 5%).** Một deployment `broken` (image `nginx:doesnotexist`) đang lỗi. Chẩn đoán
(lệnh), rồi sửa image về `nginx` để rollout thành công.

**Q15 (Image, 5%).** Tạo Secret `regcred` kiểu docker-registry (server/user/pass giả định). Viết
manifest pod dùng `imagePullSecrets` để kéo image private `myreg.local:5000/app:1.0`.

---

<details>
<summary><b>👉 ĐÁP ÁN & GIẢI THÍCH</b></summary>

```bash
k create ns prod

# Q1
cat <<'EOF' | kubectl apply -n prod -f -
apiVersion: v1
kind: Pod
metadata: { name: web, labels: { app: web } }
spec:
  initContainers:
  - name: init
    image: busybox
    command: ['sh','-c','echo "<h1>v3</h1>" > /work/index.html']
    volumeMounts: [{ name: html, mountPath: /work }]
  containers:
  - name: nginx
    image: nginx
    ports: [{ containerPort: 80 }]
    volumeMounts: [{ name: html, mountPath: /usr/share/nginx/html }]
  volumes:
  - name: html
    emptyDir: {}
EOF
k run tmp -n prod --image=busybox --restart=Never --rm -it -- \
  sh -c "wget -O- $(kubectl get po web -n prod -o jsonpath='{.status.podIP}')"

# Q2  (thêm volume log chung + sidecar; phải tạo lại pod vì không sửa được containers của pod đang chạy)
#   volumes: thêm  - name: logs / emptyDir: {}
#   nginx.volumeMounts: thêm  - name: logs / mountPath: /var/log/nginx
#   thêm container:
#   - name: sidecar
#     image: busybox
#     command: ['sh','-c','tail -f /var/log/nginx/access.log']
#     volumeMounts: [{ name: logs, mountPath: /var/log/nginx }]
#   kiểm tra:  k logs web -c sidecar -n prod

# Q3
k create deploy worker --image=busybox --replicas=4 -n prod -- sleep 3600
k edit deploy worker -n prod
#   spec.strategy:
#     type: RollingUpdate
#     rollingUpdate: { maxUnavailable: 1, maxSurge: 1 }

# Q4
k create job batch --image=busybox $do -- /bin/sh -c 'echo done' > batch.yaml
#   thêm trong spec:  completions: 6 / parallelism: 3 / backoffLimit: 2
#   (template.spec.restartPolicy phải là OnFailure hoặc Never)
k create -f batch.yaml -n prod

# Q5
k label node <node> disk=ssd
k run fast --image=nginx --restart=Never $do > fast.yaml
#   thêm spec.nodeSelector: { disk: ssd }
k create -f fast.yaml
k get po fast -o wide          # xác nhận cột NODE = node đã gán label

# Q6
echo 'server { listen 8081; location / { return 200 "ok"; } }' > default.conf
k create cm nginx-conf --from-file=default.conf -n prod
#   pod: volumes: [{name: conf, configMap: {name: nginx-conf}}]
#        volumeMounts: [{name: conf, mountPath: /etc/nginx/conf.d/}]

# Q7
cat <<'EOF' | kubectl apply -n prod -f -
apiVersion: v1
kind: Pod
metadata: { name: hardened }
spec:
  containers:
  - name: nginx
    image: nginx
    securityContext:
      runAsUser: 1000
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
      capabilities: { drop: ["ALL"] }
    volumeMounts:
    - { name: cache, mountPath: /var/cache/nginx }
    - { name: run, mountPath: /var/run }
  volumes:
  - { name: cache, emptyDir: {} }
  - { name: run, emptyDir: {} }
EOF
# Giải thích: readOnlyRootFilesystem chặn ghi; nginx cần ghi /var/cache/nginx & /var/run
# → cấp emptyDir cho các thư mục đó để ghi được mà vẫn giữ root fs chỉ-đọc.

# Q8
k create sa deployer -n prod
k run runner --image=nginx --restart=Never -n prod --overrides='{"spec":{"serviceAccountName":"deployer"}}'
k get po runner -n prod -o jsonpath='{.spec.serviceAccountName}{"\n"}'   # deployer

# Q9
k run nginx --image=nginx -n restricted --restart=Never   # → Forbidden: must specify requests/limits
k run nginx --image=nginx -n restricted --restart=Never $do > p.yaml
#   thêm resources.requests/limits hợp quota, rồi:
k create -f p.yaml -n restricted

# Q10
k get po -A --field-selector=status.phase!=Running \
  -o jsonpath='{range .items[*]}{.metadata.namespace}{"/"}{.metadata.name}{"\n"}{end}'
# (CrashLoopBackOff vẫn có phase Running; để bắt nó thì lọc thêm theo
#  .status.containerStatuses[].state.waiting.reason — nâng cao)

# Q11
k create deploy app --image=dgkanatsios/simpleapp --port=8080 --replicas=3 -n prod
k expose deploy app --port=80 --target-port=8080 -n prod
k run tmp -n prod --image=busybox --restart=Never --rm -it -- \
  sh -c 'for i in 1 2 3 4 5; do wget -qO- app:80; done'   # hostname khác nhau

# Q12
cat <<'EOF' | kubectl apply -n prod -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: app-np }
spec:
  podSelector: { matchLabels: { app: app } }
  policyTypes: ["Ingress","Egress"]
  ingress:
  - from:
    - podSelector: { matchLabels: { role: client } }
    ports: [{ protocol: TCP, port: 8080 }]
  egress:
  - to:
    - podSelector: { matchLabels: { app: db } }
  - ports:
    - { protocol: UDP, port: 53 }
    - { protocol: TCP, port: 53 }
EOF
# Lưu ý: egress DNS (53) là phần tử riêng → cho phép phân giải tên; nếu quên, app không
# resolve được service name.

# Q13
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata: { name: pv-logs }
spec:
  storageClassName: manual
  capacity: { storage: 5Gi }
  accessModes: ["ReadWriteMany"]
  hostPath: { path: /mnt/logs }
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: logs-pvc, namespace: prod }
spec:
  storageClassName: manual
  accessModes: ["ReadWriteMany"]
  resources: { requests: { storage: 3Gi } }
EOF
# 2 pod mount logs-pvc tại /logs; pod A: echo hi > /logs/a.txt ; pod B: cat /logs/a.txt
# Điều kiện pod B thấy file: với hostPath, 2 pod phải ở CÙNG node (hostPath gắn node).
# RWX chỉ có ý nghĩa thật khi backend là NFS/cloud-disk chia sẻ đa node.

# Q14
k get po -n prod                 # thấy ImagePullBackOff / ErrImagePull
k describe deploy broken -n prod # Events xác nhận image sai
k set image deploy/broken <container>=nginx -n prod
k rollout status deploy broken -n prod

# Q15
k create secret docker-registry regcred -n prod \
  --docker-server=myreg.local:5000 --docker-username=u --docker-password=p
cat <<'EOF'
apiVersion: v1
kind: Pod
metadata: { name: priv, namespace: prod }
spec:
  imagePullSecrets: [{ name: regcred }]
  containers:
  - name: app
    image: myreg.local:5000/app:1.0
EOF
```

### Tự chấm & rút kinh nghiệm
- Đề này cố tình nhiều bước + có câu giải thích. Trong đề thật, **đọc kỹ yêu cầu phụ** (vd
  "không quá 1 pod unavailable", "trong cùng namespace") vì đó là nơi mất điểm.
- Các điểm nâng cao đáng nhớ: `strategy.rollingUpdate`, egress DNS trong NetworkPolicy,
  `readOnlyRootFilesystem` + emptyDir cho thư mục ghi, `--field-selector`, `--overrides`.
</details>

→ Quay lại [README](README.md) · Ôn checklist ngày thi: [11](11-mock-exam-va-checklist.md)
