# Lời giải chi tiết — `c.pod_design.md` (Pod Design)

> File dài & quan trọng nhất. Đọc kèm [05-pod-design.md](../05-pod-design.md).
> Gồm 4 nhóm: **Labels/Annotations · Pod Placement · Deployments · Jobs/CronJobs**.

---

## A. Labels & Annotations

### 1. Tạo 3 pod nginx1/2/3, đều có label `app=v1`
```bash
for i in `seq 1 3`; do kubectl run nginx$i --image=nginx --restart=Never -l app=v1; done
```
**Giải thích:** `-l`/`--labels` gắn label lúc tạo. Vòng `for` tránh gõ 3 lần. Label dùng để
**nhóm và chọn lọc** object về sau.

### 2. Hiện tất cả label của pod
```bash
kubectl get po --show-labels
```

### 3. Đổi label pod nginx2 thành `app=v2`
```bash
kubectl label po nginx2 app=v2 --overwrite
```
**Giải thích:** `--overwrite` **bắt buộc** khi label `app` đã tồn tại; thiếu nó kubectl báo lỗi.

### 4. Hiện cột giá trị label `app`
```bash
kubectl get po -L app            # -L = thêm cột theo label
```
> Phân biệt `-l` (lọc theo label) vs `-L` (hiện cột label). Dễ nhầm!

### 5. Chỉ lấy pod `app=v2`
```bash
kubectl get po -l app=v2
kubectl get po -l 'app in (v2)'  # cú pháp tập hợp
```

### 6. Lấy pod `app=v2` và KHÔNG `tier=frontend`
```bash
kubectl get po -l 'app=v2,tier!=frontend'
kubectl get po -l 'app in (v2), tier notin (frontend)'
```
**Giải thích:** dấu phẩy = AND. `!=`/`notin` = phủ định.

### 7. Thêm label `tier=web` cho mọi pod có `app=v1` HOẶC `app=v2`
```bash
kubectl label po -l 'app in (v1,v2)' tier=web
```
**Giải thích:** `label -l <selector> <key=val>` gắn label cho **nhóm** pod khớp selector.

### 8. Thêm annotation `owner=marketing` cho pod `app=v2`
```bash
kubectl annotate po -l app=v2 owner=marketing
```
**Giải thích:** annotation = metadata ghi chú, **không dùng để chọn lọc** (khác label).

### 9. Xoá label `app` khỏi các pod đã tạo
```bash
kubectl label po nginx1 nginx2 nginx3 app-     # hậu tố '-' = xoá
kubectl label po nginx{1..3} app-              # brace expansion
kubectl label po -l app app-                   # xoá ở mọi pod có key 'app'
```
**Giải thích:** cú pháp `key-` (dấu trừ cuối) = **xoá** label/annotation đó.

### 10–12. Annotate description, xem & xoá annotation
```bash
kubectl annotate po nginx{1..3} description='my description'
kubectl annotate pod nginx1 --list                                  # xem
kubectl get po nginx1 -o jsonpath='{.metadata.annotations}{"\n"}'   # cách khác
kubectl annotate po nginx{1..3} description- owner-                 # xoá nhiều annotation
```

### 13. Xoá các pod cho sạch
```bash
kubectl delete po nginx{1..3}
```

---

## B. Pod Placement (xếp pod lên node)

### 14. Pod chạy trên node có label `accelerator=nvidia-tesla-p100`
```bash
kubectl label nodes <node> accelerator=nvidia-tesla-p100   # gắn label cho node trước
```
Trong Pod YAML thêm `nodeSelector`:
```yaml
spec:
  nodeSelector:
    accelerator: nvidia-tesla-p100
```
**Giải thích:** `nodeSelector` = "chỉ chạy trên node có label này". Scheduler tìm node khớp.
Nếu không node nào khớp → Pod kẹt `Pending`. (Cách nâng cao: `nodeAffinity` với `In/NotIn`.)

### 15. Đặt pod lên `node01` bằng `nodeName`
```yaml
spec:
  nodeName: node01           # ép node, BỎ QUA scheduler
```
**Giải thích:** `nodeName` gán cứng node, scheduler không can thiệp. Khác `nodeSelector` (vẫn
qua scheduler). Sai tên node → Pod không chạy.

### 16. Taint node + pod tolerate
```bash
kubectl taint node node1 tier=frontend:NoSchedule    # key=value:Effect
```
```yaml
spec:
  tolerations:
  - key: "tier"
    operator: "Equal"
    value: "frontend"
    effect: "NoSchedule"
```
**Giải thích:** **taint** đẩy pod *ra khỏi* node trừ khi pod có **toleration** khớp. `NoSchedule`
= không xếp pod mới lên node đó. Taint+toleration ngược logic với nodeSelector (đẩy ra vs hút vào).

### 17. Đặt pod lên `controlplane` (nodeSelector + toleration)
```yaml
spec:
  nodeSelector:
    kubernetes.io/hostname: controlplane
  tolerations:
  - key: "node-role.kubernetes.io/control-plane"
    operator: "Exists"
    effect: "NoSchedule"
```
**Giải thích:** control-plane thường bị taint sẵn → cần toleration mới chạy lên đó được.
`operator: Exists` = chỉ cần key tồn tại, không cần so giá trị.

---

## C. Deployments ⭐ (hay ra thi nhất)

### 18. Deployment nginx:1.18.0, 2 replica, container port 80 (không tạo Service)
```bash
kubectl create deploy nginx --image=nginx:1.18.0 --replicas=2 --port=80
# hoặc sinh YAML rồi sửa replicas + thêm ports:
kubectl create deployment nginx --image=nginx:1.18.0 --dry-run=client -o yaml > deploy.yaml
```
**Giải thích:** `create deploy` tạo Deployment (quản ReplicaSet → Pod). `--replicas` số bản sao,
`--port` khai báo containerPort.

### 19–21. Xem YAML deployment / ReplicaSet / Pod
```bash
kubectl get deploy nginx -o yaml
kubectl get rs -l app=nginx          # ReplicaSet do deployment tạo
kubectl get po -l app=nginx          # Pod do RS tạo
```
**Giải thích:** chuỗi sở hữu **Deployment → ReplicaSet → Pod**. Label `app=nginx` (do `create`
đặt) giúp lọc đúng nhóm.

### 22. Theo dõi rollout
```bash
kubectl rollout status deploy nginx
```

### 23. Cập nhật image lên nginx:1.19.8
```bash
kubectl set image deploy nginx nginx=nginx:1.19.8
```
**Giải thích:** cú pháp `set image deploy <deploy> <container>=<image>`. Việc đổi image kích
hoạt **rolling update**: thay Pod cũ bằng mới từ từ, không downtime.

### 24. Xem lịch sử rollout
```bash
kubectl rollout history deploy nginx
kubectl get rs                       # thấy RS mới được tạo cho phiên bản mới
```

### 25. Undo rollout, xác nhận image về 1.18.0
```bash
kubectl rollout undo deploy nginx
kubectl get po
kubectl describe po <pod> | grep -i image     # phải là nginx:1.18.0
```
**Giải thích:** `rollout undo` quay về **revision trước đó** (đổi RS đang active).

### 26–27. Cập nhật image sai `nginx:1.91`, xác nhận hỏng
```bash
kubectl set image deploy nginx nginx=nginx:1.91
kubectl rollout status deploy nginx           # treo, không hoàn tất
kubectl get po                                # thấy ErrImagePull / ImagePullBackOff
```
**Giải thích:** image không tồn tại → Pod mới không pull được. Nhờ rolling update, **Pod cũ vẫn
chạy** nên app không chết hẳn.

### 28. Quay về revision 2 (image 1.19.8)
```bash
kubectl rollout undo deploy nginx --to-revision=2
kubectl describe deploy nginx | grep Image:
```
**Giải thích:** `--to-revision=N` về đúng phiên bản N (xem số từ `rollout history`).

### 29. Xem chi tiết revision 4
```bash
kubectl rollout history deploy nginx --revision=4
```

### 30. Scale lên 5 replica
```bash
kubectl scale deploy nginx --replicas=5
```

### 31. Autoscale 5–10 replica, target CPU 80%
```bash
kubectl autoscale deploy nginx --min=5 --max=10 --cpu-percent=80
kubectl get hpa nginx
```
**Giải thích:** tạo **HorizontalPodAutoscaler (HPA)** — tự tăng/giảm replica theo CPU. Cần
metrics-server. `hpa` là alias.

### 32–34. Pause → update image → resume
```bash
kubectl rollout pause deploy nginx
kubectl set image deploy nginx nginx=nginx:1.19.9
kubectl rollout history deploy nginx          # KHÔNG có revision mới (đang pause)
kubectl rollout resume deploy nginx           # áp dụng thay đổi
```
**Giải thích:** `pause` gom nhiều thay đổi lại; chỉ khi `resume` mới triển khai một lần →
tránh nhiều lần rollout liên tiếp.

### 35. Xoá deployment & HPA
```bash
kubectl delete deploy/nginx hpa/nginx
```

### 36. Canary deployment 75/25 (nâng cao)
**Ý tưởng:** 2 Deployment `my-app-v1` (3 replica) và `my-app-v2` (1 replica), **cùng label
`app: my-app`**; 1 Service selector `app: my-app` → traffic chia ~75/25 theo số Pod. Khi v2 ổn,
scale v2 lên và xoá v1.
**Giải thích:** Service cân tải theo **tổng số Pod khớp selector**, không cần công cụ thêm.
Tỷ lệ canary = tỷ lệ số replica giữa 2 phiên bản.

---

## D. Jobs

### 37. Job `pi` image perl chạy tính số pi
```bash
kubectl create job pi --image=perl:5.34 -- perl -Mbignum=bpi -wle 'print bpi(2000)'
```
**Giải thích:** Job chạy Pod tới khi **hoàn thành**. `--` ngăn cách lệnh.

### 38. Chờ xong, lấy output
```bash
kubectl wait --for=condition=complete --timeout=300s job pi
kubectl logs job/pi
kubectl delete job pi
```
**Giải thích:** `kubectl wait --for=condition=complete` chờ Job xong. `logs job/<name>` lấy log
của Pod thuộc Job.

### 39–41. Job busybox `echo hello;sleep 30;echo world`, follow log, xem status
```bash
kubectl create job busybox --image=busybox -- /bin/sh -c 'echo hello;sleep 30;echo world'
kubectl logs -f job/busybox
kubectl get jobs; kubectl describe jobs busybox
```

### 42. Job chạy 5 lần TUẦN TỰ
Thêm vào `spec`:
```yaml
spec:
  completions: 5            # cần 5 lần hoàn thành
  completionMode: Indexed   # (tuỳ chọn) mỗi lần có index riêng
  template:
    spec:
      restartPolicy: OnFailure   # Job chỉ chấp nhận Never/OnFailure
```
**Giải thích:** `completions: 5` không kèm `parallelism` → chạy lần lượt từng cái.

### 43. Job chạy 5 lần SONG SONG
```yaml
spec:
  parallelism: 5            # 5 Pod chạy cùng lúc
```

### 44. Job tự bị giết nếu chạy quá 30s
```yaml
spec:
  activeDeadlineSeconds: 30
```
**Giải thích:** quá thời hạn → K8s chấm dứt Job (đếm từ lúc Job bắt đầu, gồm cả retry).

---

## E. CronJobs

### 45. CronJob busybox chạy mỗi phút, in date + message
```bash
kubectl create cronjob busybox --image=busybox --schedule="*/1 * * * *" \
  -- /bin/sh -c 'date; echo Hello from the Kubernetes cluster'
```
**Giải thích cron 5 trường:** `phút giờ ngày-tháng tháng thứ`. `*/1 * * * *` = mỗi phút.

### 46–47. Xem log, xem job được sinh, xoá
```bash
kubectl get cj                      # cj = cronjob
kubectl get jobs --watch            # mỗi lần chạy sinh 1 Job
kubectl get po --show-labels        # pod có label trỏ về job cha
kubectl logs <pod>
kubectl delete cj busybox
```

### 48. CronJob bị chấm dứt nếu trễ giờ start > 17s
```yaml
spec:
  startingDeadlineSeconds: 17       # ở cấp CronJob.spec
  schedule: '* * * * *'
  jobTemplate: { ... }
```
**Giải thích:** `startingDeadlineSeconds` = nếu vì lý do gì job không **bắt đầu** trong 17s sau
giờ hẹn thì bỏ qua lần đó.

### 49. CronJob bị chấm dứt nếu chạy (sau khi start) > 12s
```yaml
spec:
  jobTemplate:
    spec:
      activeDeadlineSeconds: 12     # ⚠️ nằm trong jobTemplate.spec, KHÁC bài 48
```
**Giải thích — điểm dễ nhầm:** `startingDeadlineSeconds` ở **CronJob.spec** (giới hạn lúc
*khởi động*); `activeDeadlineSeconds` ở **jobTemplate.spec** (giới hạn lúc *thực thi*).

### 50. Tạo Job thủ công từ CronJob
```bash
kubectl create job --from=cronjob/sample-cron-job sample-job
```
**Giải thích:** `--from=cronjob/...` chạy ngay một lần mà không chờ lịch (test cron).

---

## 🎯 Tổng kết chương c
- Label: `-l` lọc, `-L` hiện cột, `key=val --overwrite` sửa, `key-` xoá.
- Placement: `nodeSelector` (hút theo label node), `nodeName` (ép node), taint+toleration (đẩy ra).
- Deployment: `create/scale/set image/rollout status|history|undo|pause|resume`, HPA.
- Job: `completions`, `parallelism`, `activeDeadlineSeconds`, `restartPolicy` (Never/OnFailure).
- CronJob: `schedule`, `startingDeadlineSeconds` (CronJob.spec) vs `activeDeadlineSeconds`
  (jobTemplate.spec), `--from=cronjob/...`.
