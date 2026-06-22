# 2. Kiến thức nền tảng Kubernetes (cho người mới hoàn toàn)

Đọc kỹ chương này trước khi đụng vào bài tập. Mục tiêu: hiểu **Kubernetes là gì, các
"vật thể" (object) chính, và cách `kubectl` + YAML hoạt động**.

---

## 2.1. Container & vì sao cần Kubernetes

- **Container** đóng gói app + thư viện + cấu hình thành 1 đơn vị chạy giống nhau ở mọi nơi
  (ví dụ: image `nginx`). Docker/Podman tạo và chạy container.
- Khi có **hàng trăm container** trên nhiều máy, ta cần công cụ để: tự khởi động lại khi
  chết, nhân bản theo tải, cập nhật không downtime, kết nối mạng, quản lý cấu hình/bí mật…
  → Đó là việc của **Kubernetes (K8s)** — một **bộ điều phối container (orchestrator)**.

**Mô hình khai báo (declarative):** Bạn mô tả *trạng thái mong muốn* ("tôi muốn 3 bản sao
nginx chạy"), K8s liên tục so sánh và đưa thực tế về đúng mong muốn đó. Đây là tư tưởng cốt lõi.

---

## 2.2. Kiến trúc cluster (chỉ cần hiểu khái niệm)

Một **cluster** = **Control Plane** (bộ não) + nhiều **Worker Node** (nơi chạy app).

**Control Plane:**
| Thành phần | Vai trò |
|------------|---------|
| **kube-apiserver** | Cửa ngõ duy nhất. `kubectl` nói chuyện với cái này. |
| **etcd** | CSDL key-value lưu toàn bộ trạng thái cluster |
| **kube-scheduler** | Quyết định Pod chạy trên node nào |
| **controller-manager** | Vòng lặp đảm bảo "thực tế = mong muốn" (vd: đủ số replica) |

**Worker Node:**
| Thành phần | Vai trò |
|------------|---------|
| **kubelet** | Agent trên mỗi node, chạy & giám sát container |
| **kube-proxy** | Định tuyến mạng cho Service |
| **container runtime** | (containerd) thực sự chạy container |

> CKAD là kỳ thi cho **developer**, nên bạn không cần cài/sửa control plane. Chỉ cần hiểu
> đủ để debug (vd: Pod Pending vì scheduler không xếp được node).

---

## 2.3. Các object cốt lõi — "từ vựng" bắt buộc

Hình dung phân lớp từ nhỏ đến lớn:

```
Container  ⊂  Pod  ⊂  ReplicaSet  ⊂  Deployment
                          (Service trỏ vào nhóm Pod qua label)
```

| Object | Là gì | Dùng khi |
|--------|-------|----------|
| **Pod** | Đơn vị nhỏ nhất K8s chạy; bọc 1 (hoặc vài) container chia sẻ mạng/volume | Đơn vị cơ bản nhất |
| **ReplicaSet** | Giữ đúng N bản sao của 1 Pod | Hiếm khi tạo trực tiếp |
| **Deployment** | Quản lý ReplicaSet, hỗ trợ rolling update & rollback | Triển khai app stateless (90% trường hợp) |
| **Service** | Địa chỉ mạng ổn định + cân bằng tải tới nhóm Pod (chọn qua label) | Cho Pod khác/bên ngoài gọi vào |
| **ConfigMap** | Lưu cấu hình dạng key-value (không bí mật) | Tách cấu hình khỏi image |
| **Secret** | Như ConfigMap nhưng cho dữ liệu nhạy cảm (base64) | Mật khẩu, token, cert |
| **Namespace** | "Thư mục" ảo chia tách tài nguyên | Phân vùng môi trường/nhóm |
| **Job / CronJob** | Chạy 1 lần tới khi xong / chạy theo lịch | Tác vụ batch |
| **PV / PVC** | Lưu trữ bền vững & yêu cầu lưu trữ | Dữ liệu cần giữ qua restart |

> **Pod là phù du (ephemeral):** Pod có thể chết và bị thay bằng Pod mới có IP khác. Vì vậy
> ta KHÔNG gọi Pod trực tiếp qua IP — ta gọi qua **Service** (IP ổn định). Hiểu điều này là
> hiểu được nửa phần Networking.

---

## 2.4. Cấu trúc một file YAML K8s

Mọi object đều có 4 trường gốc:

```yaml
apiVersion: v1          # nhóm/phiên bản API của object (v1, apps/v1, batch/v1...)
kind: Pod               # loại object
metadata:               # thông tin định danh
  name: nginx
  namespace: default
  labels:
    app: web
spec:                   # PHẦN QUAN TRỌNG NHẤT: mô tả trạng thái mong muốn
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
```

Cách nhớ `apiVersion` cho các `kind` hay gặp:
| kind | apiVersion |
|------|-----------|
| Pod, Service, ConfigMap, Secret, Namespace, PersistentVolume(Claim) | `v1` |
| Deployment, ReplicaSet, DaemonSet, StatefulSet | `apps/v1` |
| Job, CronJob | `batch/v1` |
| NetworkPolicy | `networking.k8s.io/v1` |
| Ingress | `networking.k8s.io/v1` |

> Không chắc apiVersion? Gõ `kubectl explain <kind>` (vd `kubectl explain deployment`) —
> nó in ra cả apiVersion lẫn cấu trúc field. **`kubectl explain` là bạn thân khi thi.**

### Quy tắc YAML phải nhớ
- Thụt lề bằng **space**, **không bao giờ dùng tab**. Thường 2 space/cấp.
- `key: value` (có dấu cách sau dấu hai chấm).
- List dùng dấu `-`.
- Sai 1 space → lỗi. Dùng `~/.vimrc` đã cấu hình ở chương 1.

---

## 2.5. `kubectl` — công cụ duy nhất bạn dùng

Cú pháp chung: `kubectl <ĐỘNG TỪ> <LOẠI> <TÊN> [cờ]`

### Hai phong cách:
- **Imperative** (ra lệnh trực tiếp — NHANH, ưu tiên khi thi):
  ```bash
  kubectl run nginx --image=nginx
  kubectl create deployment web --image=nginx --replicas=3
  kubectl expose deployment web --port=80
  ```
- **Declarative** (qua file YAML — cho cấu hình phức tạp/lưu lại):
  ```bash
  kubectl apply -f app.yaml
  ```

### Mẹo vàng: tạo YAML bằng imperative + `--dry-run`
```bash
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml
# (với alias chương 1:)  k run nginx --image=nginx $do > pod.yaml
```
→ Sinh khung YAML đúng cú pháp, bạn chỉ sửa phần cần. **Đây là kỹ thuật quan trọng nhất
để thi nhanh.**

### Các động từ hay dùng
| Lệnh | Tác dụng |
|------|----------|
| `kubectl get <kind>` | liệt kê (`-o wide`, `-o yaml`, `--show-labels`, `-A` = mọi namespace) |
| `kubectl describe <kind> <name>` | chi tiết + sự kiện (debug Pod lỗi) |
| `kubectl logs <pod>` | xem log (`-f` theo dõi, `--previous` log lần chết trước, `-c` chọn container) |
| `kubectl exec -it <pod> -- sh` | vào shell trong container |
| `kubectl apply -f f.yaml` | tạo/cập nhật từ YAML |
| `kubectl delete <kind> <name>` | xoá |
| `kubectl edit <kind> <name>` | sửa trực tiếp object đang chạy |
| `kubectl explain <kind>.<field>` | tra cấu trúc field |
| `kubectl label / annotate` | thêm/sửa label, annotation |
| `kubectl top pods/nodes` | xem CPU/RAM (cần metrics-server) |

### Làm việc với namespace (HAY MẤT ĐIỂM NẾU QUÊN)
```bash
kubectl get pods -n mynamespace          # chỉ định namespace
kubectl get pods -A                       # mọi namespace
kubectl config set-context --current --namespace=mynamespace   # đổi NS mặc định
```
> Đề thi thường ghi rõ namespace. **Luôn đọc kỹ và thêm `-n`** hoặc đổi context.

---

## 2.6. Vòng đời & trạng thái Pod (để debug)

| Trạng thái | Ý nghĩa | Hướng xử lý |
|------------|---------|-------------|
| `Pending` | Chưa được xếp lên node | `describe` xem Events (thiếu tài nguyên? nodeSelector?) |
| `ContainerCreating` | Đang kéo image / mount volume | Chờ; nếu lâu → `describe` |
| `Running` | Đang chạy | OK |
| `CrashLoopBackOff` | Container chết lặp đi lặp lại | `logs --previous` để xem lý do |
| `ImagePullBackOff` / `ErrImagePull` | Không kéo được image | Sai tên image / thiếu credential |
| `Completed` | Chạy xong (Job/pod 1 lần) | Bình thường với Job |
| `Error` | Thoát với mã lỗi | `logs`, `describe` |

Quy trình debug chuẩn: `kubectl get pod` → `kubectl describe pod <name>` (đọc mục **Events**)
→ `kubectl logs <name>` (thêm `--previous` nếu đã restart).

---

## 2.7. Bản đồ tư duy nhanh

```
Bạn (kubectl) → API Server → lưu vào etcd
                     ↑
   Controller so sánh mong muốn vs thực tế → ra lệnh
   Scheduler chọn node → kubelet chạy container
   Service + kube-proxy định tuyến traffic tới Pod (qua label)
```

---

## ✅ Tự kiểm tra trước khi sang bài tập
- [ ] Giải thích được khác nhau giữa Pod, ReplicaSet, Deployment, Service.
- [ ] Viết được 4 trường gốc của YAML (apiVersion/kind/metadata/spec).
- [ ] Biết tạo YAML bằng `--dry-run=client -o yaml`.
- [ ] Biết quy trình debug: get → describe → logs.
- [ ] Biết thêm `-n <namespace>` và đổi namespace mặc định.

→ Sẵn sàng làm bài: [03-core-concepts.md](03-core-concepts.md) (kèm `a.core_concepts.md`)
