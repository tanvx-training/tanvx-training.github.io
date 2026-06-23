# CKAD - Certified Kubernetes Application Developer: Study Guide

> Tài liệu tổng hợp chi tiết từ khóa học "CKAD Crash Course" (O'Reilly) của Benjamin Muschko.
> Dành cho người mới bắt đầu - giải thích đầy đủ, rõ ràng.

---

## Mục lục

1. [Tổng quan về kỳ thi CKAD](#1-tổng-quan-về-kỳ-thi-ckad)
2. [Mẹo và chiến lược thi](#2-mẹo-và-chiến-lược-thi)
3. [Core Concepts - Khái niệm cốt lõi](#3-core-concepts---khái-niệm-cốt-lõi)
4. [Configuration - Cấu hình](#4-configuration---cấu-hình)
5. [Multi-Container Pods](#5-multi-container-pods)
6. [Observability - Giám sát](#6-observability---giám-sát)
7. [Pod Design - Thiết kế Pod](#7-pod-design---thiết-kế-pod)
8. [Services & Networking - Dịch vụ và Mạng](#8-services--networking---dịch-vụ-và-mạng)
9. [State Persistence - Lưu trữ bền vững](#9-state-persistence---lưu-trữ-bền-vững)
10. [Tổng kết và lời khuyên](#10-tổng-kết-và-lời-khuyên)

---

## 1. Tổng quan về kỳ thi CKAD

### CKAD là gì?

CKAD (Certified Kubernetes Application Developer) là chứng chỉ do **CNCF** (Cloud Native Computing Foundation) cấp, chứng minh khả năng **thiết kế, xây dựng, cấu hình và triển khai ứng dụng cloud native trên Kubernetes**.

Đây là kỳ thi **thực hành (hands-on)** trong môi trường **command-line** thực tế - bạn phải thao tác trực tiếp trên cluster Kubernetes, không phải chọn đáp án trắc nghiệm.

### Cấu trúc chương trình thi (Curriculum)

| Chủ đề | Tỷ trọng | Nội dung chính |
|--------|-----------|----------------|
| **Pod Design** | 20% | Labels, Selectors, Annotations, Deployments, Rolling Updates, Rollbacks, Jobs, CronJobs |
| **Configuration** | 18% | ConfigMaps, Secrets, SecurityContexts, Resource Requirements, ServiceAccounts |
| **Observability** | 18% | Liveness/Readiness Probes, Container Logging, Monitoring, Debugging |
| **Core Concepts** | 13% | Kubernetes API Primitives, Tạo và cấu hình Pods |
| **Services & Networking** | 13% | Services, NetworkPolicies |
| **Multi-Container Pods** | 10% | Design patterns: Sidecar, Ambassador, Adapter |
| **State Persistence** | 8% | PersistentVolumeClaims |

### Kỹ năng cần có

- **Kubernetes** - Hiểu kiến trúc và các khái niệm cơ bản
- **kubectl** - Thành thạo chạy các lệnh quản lý Kubernetes
- **Docker** - Hiểu các khái niệm nền tảng về container

### Môi trường thi

- Thi **online** và có **giám thị** (proctored)
- Bộ ba công cụ bắt buộc phải thành thạo: **YAML**, **Vim**, **Bash**
- Được phép tra cứu tài liệu chính thức tại: https://kubernetes.io/docs
- **19 câu hỏi** trong **2 giờ** (khoảng 6 phút/câu)

---

## 2. Mẹo và chiến lược thi

### 2.1. Thiết lập alias cho kubectl

Việc đầu tiên khi bắt đầu thi - tạo alias để gõ nhanh hơn:

```bash
alias k=kubectl
# Từ giờ thay vì gõ "kubectl", chỉ cần gõ "k"
k version
```

### 2.2. Đặt context và namespace

Mỗi câu hỏi sẽ yêu cầu bạn làm việc trên một cluster/namespace cụ thể. **Luôn chạy lệnh này trước khi bắt đầu mỗi câu:**

```bash
kubectl config set-context <context-của-câu-hỏi> --namespace=<namespace-của-câu-hỏi>
```

### 2.3. Sử dụng tên viết tắt (short names)

Kubernetes cho phép viết tắt tên resource để tiết kiệm thời gian:

| Tên đầy đủ | Viết tắt |
|-------------|----------|
| namespaces | ns |
| persistentvolumeclaim | pvc |
| persistentvolume | pv |
| configmaps | cm |
| services | svc |
| deployments | deploy |
| replicasets | rs |
| serviceaccounts | sa |

```bash
kubectl get ns              # Thay vì: kubectl get namespaces
kubectl describe pvc claim  # Thay vì: kubectl describe persistentvolumeclaim claim
```

### 2.4. Xóa nhanh object

Trong thi, **không nên chờ** xóa graceful (mất thời gian). Dùng force delete:

```bash
kubectl delete pod nginx --grace-period=0 --force
```

### 2.5. Tra cứu help nhanh

```bash
# Xem các subcommand và tùy chọn
kubectl create --help

# Xem chi tiết cấu trúc của một resource
kubectl explain pods.spec
kubectl explain pods.spec.containers
```

> `kubectl explain` rất hữu ích - phần **FIELDS** chứa thông tin quan trọng nhất.

### 2.6. Tìm kiếm thông tin bằng grep

```bash
# Lọc thông tin từ describe
kubectl describe pods | grep -C 10 "author=John Doe"

# Lọc labels từ YAML output
kubectl get pods -o yaml | grep -C 5 labels:
```

> **grep là người bạn thân nhất của bạn trong kỳ thi!**

### 2.7. Quản lý thời gian

- 19 câu trong 2 giờ - hãy **phân bổ thời gian hợp lý**
- Nếu gặp câu khó, **đánh dấu và bỏ qua**, quay lại sau
- Ưu tiên làm các câu dễ trước để lấy điểm chắc

---

## 3. Core Concepts - Khái niệm cốt lõi

### 3.1. Cấu trúc object trong Kubernetes

Mọi Kubernetes object đều có cấu trúc nhất quán với các phần sau:

```yaml
apiVersion: v1          # Phiên bản API (v1, apps/v1, batch/v1, ...)
kind: Pod               # Loại resource (Pod, Deployment, Service, ...)
metadata:               # Thông tin mô tả
  name: nginx           # Tên của object
  namespace: default    # Namespace chứa object
  labels:               # Nhãn để phân loại và tìm kiếm
    run: nginx
spec:                   # Trạng thái mong muốn (desired state) - do bạn định nghĩa
  containers:
  - image: nginx
    name: nginx
status: {}              # Trạng thái thực tế (actual state) - do Kubernetes quản lý
```

**Giải thích cho người mới:**
- `apiVersion`: Mỗi loại resource thuộc một nhóm API khác nhau. Ví dụ: Pod dùng `v1`, Deployment dùng `apps/v1`
- `kind`: Loại resource bạn muốn tạo
- `metadata`: "Thẻ tên" của object - gồm tên, namespace, labels
- `spec`: Bạn **mô tả** những gì bạn muốn (ví dụ: chạy container nginx)
- `status`: Kubernetes tự cập nhật trạng thái thực tế hiện tại

### 3.2. Hai cách quản lý object

#### Cách 1: Imperative (Mệnh lệnh) - Nhanh, gọn

Chạy lệnh trực tiếp, Kubernetes thực thi ngay:

```bash
kubectl create namespace ckad
kubectl run nginx --image=nginx --restart=Never -n ckad
kubectl edit pod/nginx -n ckad
```

**Ưu điểm:** Nhanh, không cần viết file YAML
**Nhược điểm:** Không lưu lại lịch sử thay đổi

#### Cách 2: Declarative (Khai báo) - Có hệ thống

Viết file YAML rồi apply:

```bash
vim nginx-pod.yaml          # Viết/chỉnh sửa file YAML
kubectl create -f nginx-pod.yaml   # Tạo resource từ file
kubectl delete pod/nginx           # Xóa resource
```

**Ưu điểm:** Theo dõi được thay đổi, phù hợp cho các cấu hình phức tạp
**Nhược điểm:** Mất thời gian hơn

#### Cách 3: Hybrid (Kết hợp) - KHUYẾN NGHỊ CHO KỲ THI

Dùng kubectl sinh ra file YAML, rồi chỉnh sửa thêm:

```bash
# Bước 1: Sinh file YAML (không tạo thật nhờ --dry-run)
kubectl run nginx --image=nginx --restart=Never --dry-run -o yaml > nginx-pod.yaml

# Bước 2: Chỉnh sửa file YAML nếu cần
vim nginx-pod.yaml

# Bước 3: Áp dụng file YAML
kubectl apply -f nginx-pod.yaml
```

> `--dry-run -o yaml` là **combo thần thánh** trong kỳ thi. Nó sinh ra YAML template mà KHÔNG tạo resource thật, giúp bạn tiết kiệm rất nhiều thời gian so với viết YAML từ đầu.

### 3.3. Hiểu về Pod

#### Pod là gì?

Pod là **đơn vị triển khai nhỏ nhất** trong Kubernetes. Nó là một "vỏ bọc" chứa **một hoặc nhiều container**.

```
┌─────────────────────────────┐
│           Pod               │
│  ┌───────────┐              │    Single-container Pod
│  │ Container │              │    (phổ biến nhất)
│  └───────────┘              │
└─────────────────────────────┘

┌─────────────────────────────┐
│           Pod               │
│  ┌───────────┐ ┌──────────┐│    Multi-container Pod
│  │Container 1│ │Container 2││    (các container chia sẻ network & storage)
│  └───────────┘ └──────────┘│
└─────────────────────────────┘
```

#### Luồng tạo Pod

Khi bạn chạy `kubectl run nginx --image=nginx`, quá trình diễn ra như sau:

1. **kubectl** gửi request đến **Kubernetes Master** (API Server)
2. **API Server** lưu thông tin vào **etcd** (database của cluster)
3. **Scheduler** quyết định Pod sẽ chạy trên Node nào
4. **Kubelet** trên Node đó nhận lệnh, tạo Pod thông qua **container runtime** (Docker)

```
kubectl → API Server → etcd
                ↓
           Scheduler → chọn Node
                ↓
           Kubelet → Docker → Container chạy
```

#### Vòng đời của Pod (Pod Lifecycle Phases)

| Phase | Ý nghĩa |
|-------|---------|
| **Pending** | Pod đã được chấp nhận nhưng container chưa được tạo xong (đang pull image, chờ schedule, ...) |
| **Running** | Ít nhất một container đang chạy hoặc đang khởi động/restart |
| **Succeeded** | Tất cả container đã kết thúc thành công (exit code 0) |
| **Failed** | Tất cả container đã dừng, ít nhất một container thất bại (exit code khác 0) |
| **Unknown** | Không thể lấy được trạng thái Pod (thường do mất liên lạc với Node) |

#### Kiểm tra trạng thái Pod

```bash
# Cách 1: Xem status nhanh
kubectl describe pods nginx | grep Status:
# Output: Status: Running

# Cách 2: Xem chi tiết dạng YAML
kubectl get pods nginx -o yaml
# Trong output sẽ có phần status.phase: Running
```

### 3.4. Cấu hình Pod cơ bản

#### Biến môi trường (Environment Variables)

Truyền cấu hình runtime vào container qua biến môi trường:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: spring-boot-app
spec:
  containers:
  - image: bmuschko/spring-boot-app:1.5.3
    name: spring-boot-app
    env:                              # Khai báo biến môi trường
    - name: SPRING_PROFILES_ACTIVE    # Tên biến
      value: production               # Giá trị
```

**Giải thích:** Khi container chạy, bên trong sẽ có biến `SPRING_PROFILES_ACTIVE=production`. Ứng dụng đọc biến này để biết cần chạy ở chế độ nào.

#### Commands và Arguments

Ghi đè lệnh mặc định của Docker image:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - image: nginx:1.15.12
    name: nginx
    args:               # Ghi đè CMD trong Dockerfile
    - /bin/sh
    - -c
    - echo hello world
```

**Giải thích:** Thay vì chạy lệnh mặc định của nginx, container sẽ chạy `echo hello world` rồi kết thúc.

#### Các lệnh kubectl hữu ích

```bash
# Xem logs của Pod (stdout/stderr)
kubectl logs busybox

# Mở shell tương tác bên trong container
kubectl exec nginx -it -- /bin/sh
# -i: interactive (tương tác)
# -t: tty (terminal)
# --: phân cách lệnh kubectl và lệnh chạy trong container
```

---

## 4. Configuration - Cấu hình

### 4.1. ConfigMap

#### ConfigMap là gì?

ConfigMap là object Kubernetes dùng để lưu trữ **dữ liệu cấu hình không nhạy cảm** dưới dạng cặp key-value. Pod có thể tham chiếu đến ConfigMap để lấy cấu hình.

```
┌──────────────────┐
│    ConfigMap      │    Lưu cấu hình dạng plain text
│  db: staging      │    (key=value)
│  username: jdoe   │
└────────┬─────────┘
         │ tham chiếu
    ┌────▼────┐
    │   Pod   │
    └─────────┘
```

#### Tạo ConfigMap - Imperative

```bash
# Cách 1: Từ giá trị trực tiếp (literal)
kubectl create configmap db-config --from-literal=db=staging

# Cách 2: Từ file chứa biến môi trường
kubectl create configmap db-config --from-env-file=config.env

# Cách 3: Từ file hoặc thư mục
kubectl create configmap db-config --from-file=config.txt
# (tên file trở thành key, nội dung file trở thành value)
```

#### Tạo ConfigMap - Declarative

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: db-config
data:                    # Dữ liệu cấu hình
  db: staging            # key: db, value: staging
  username: jdoe         # key: username, value: jdoe
```

#### Sử dụng ConfigMap trong Pod

**Cách 1: Inject dạng biến môi trường**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - image: nginx
    name: backend
    envFrom:                  # Inject tất cả key-value từ ConfigMap
    - configMapRef:
        name: db-config       # Tên ConfigMap cần tham chiếu
```

Kiểm tra:
```bash
kubectl exec -it backend -- env
# Output: DB=staging, USERNAME=jdoe, ...
```

**Cách 2: Mount dạng Volume (mỗi key thành một file)**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - name: backend
    image: nginx
    volumeMounts:                 # Mount volume vào container
    - name: config-volume
      mountPath: /etc/config      # Thư mục mount
  volumes:                        # Định nghĩa volume
  - name: config-volume
    configMap:
      name: db-config             # Tham chiếu ConfigMap
```

Kiểm tra:
```bash
kubectl exec -it backend -- /bin/sh
ls /etc/config        # Output: db  username (mỗi key là một file)
cat /etc/config/db    # Output: staging (nội dung file là value)
```

### 4.2. Secret

#### Secret là gì?

Secret tương tự ConfigMap nhưng dùng cho **dữ liệu nhạy cảm** (password, API key, certificate, ...). Giá trị được lưu trữ dưới dạng **base64-encoded**.

```
┌──────────────────┐
│     Secret       │    Lưu dữ liệu nhạy cảm
│  pwd: czNjcmUh   │    (base64-encoded)
└────────┬─────────┘
         │ tham chiếu
    ┌────▼────┐
    │   Pod   │
    └─────────┘
```

#### Tạo Secret - Imperative

```bash
# Từ giá trị trực tiếp
kubectl create secret generic db-creds --from-literal=pwd=s3cre!

# Từ file biến môi trường
kubectl create secret generic db-creds --from-env-file=secret.env

# Từ file SSH key
kubectl create secret generic db-creds --from-file=ssh-privatekey=~/.ssh/id_rsa
```

> Khi tạo imperative, Kubernetes **tự động encode base64**. Bạn không cần encode thủ công.

#### Tạo Secret - Declarative

Khi tạo bằng YAML, bạn **phải tự encode base64**:

```bash
# Encode giá trị
echo -n 's3cre!' | base64
# Output: czNjcmUh
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque              # Loại Secret phổ biến nhất
data:
  pwd: czNjcmUh           # Giá trị đã được base64-encoded
```

#### Sử dụng Secret trong Pod (Mount dạng Volume)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - name: backend
    image: nginx
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secret
  volumes:
  - name: secret-volume
    secret:
      secretName: mysecret    # Tham chiếu Secret (khác ConfigMap: dùng secretName)
```

Kiểm tra:
```bash
kubectl exec -it backend -- /bin/sh
ls /etc/secret     # Output: pwd
cat /etc/secret/pwd  # Output: s3cre!  (tự động decode base64!)
```

> Khi mount Secret dạng volume, Kubernetes **tự động decode base64** - bạn thấy giá trị gốc, không phải giá trị encoded.

### 4.3. Security Context

#### Security Context là gì?

Security Context kiểm soát **quyền truy cập và đặc quyền** cho Pod hoặc container. Ví dụ: chạy container với user/group nào, quyền gì.

#### Định nghĩa Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secured-pod
spec:
  securityContext:            # Áp dụng cho TẤT CẢ container trong Pod
    runAsUser: 1000           # Chạy với user ID 1000
  containers:
  - name: mycontainer
    image: nginx
    securityContext:          # Áp dụng riêng cho container này
      runAsGroup: 3000        # Chạy với group ID 3000
```

**Hai cấp độ:**
- **Pod-level** (`spec.securityContext`): Áp dụng cho tất cả container
- **Container-level** (`spec.containers[].securityContext`): Áp dụng riêng cho container đó, **ghi đè** cấu hình Pod-level

### 4.4. Resource Quota và Resource Requirements

#### ResourceQuota - Giới hạn tài nguyên theo Namespace

ResourceQuota đặt giới hạn **số lượng Pod, CPU, Memory** mà một Namespace được phép sử dụng.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: app
spec:
  hard:
    pods: "2"                  # Tối đa 2 Pods
    requests.cpu: "2"          # Tổng CPU requests tối đa 2 cores
    requests.memory: 500m      # Tổng Memory requests tối đa 500m
```

```bash
# Tạo namespace và áp dụng quota
kubectl create namespace rq-demo
kubectl create -f rq.yaml --namespace=rq-demo

# Xem trạng thái quota
kubectl describe quota --namespace=rq-demo
# Output hiển thị Used vs Hard limits
```

> Khi quota đã đầy, Scheduler sẽ **từ chối** tạo thêm Pod mới.

#### Resource Requirements - Yêu cầu tài nguyên cho container

Khi namespace có ResourceQuota, mỗi Pod **bắt buộc** phải khai báo resource requests:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - image: nginx
    name: mypod
    resources:
      requests:               # Tài nguyên tối thiểu cần thiết
        cpu: "0.5"            # Yêu cầu 0.5 CPU core
        memory: "200m"        # Yêu cầu 200m memory
```

> Nếu không khai báo `resources.requests`, Pod sẽ **không thể tạo** trong namespace có quota.

### 4.5. ServiceAccount

#### ServiceAccount là gì?

ServiceAccount cung cấp **danh tính (identity)** cho tiến trình chạy trong Pod, cho phép Pod xác thực với Kubernetes API Server.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  serviceAccountName: myserviceaccount   # Gán ServiceAccount cho Pod
```

> Nếu không chỉ định, Pod sẽ dùng ServiceAccount `default` của namespace.

---

## 5. Multi-Container Pods

### 5.1. Định nghĩa nhiều container trong Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container
spec:
  containers:
  - image: nginx           # Container thứ 1
    name: container1
  - image: nginx           # Container thứ 2
    name: container2
```

Các container trong cùng Pod **chia sẻ**:
- Cùng **network** (localhost, cùng IP)
- Cùng **storage** (volumes)
- Cùng **lifecycle** (khởi động và dừng cùng nhau)

### 5.2. Tương tác với container cụ thể

Khi Pod có nhiều container, dùng `--container` (hoặc `-c`) để chỉ định container:

```bash
# Xem logs của container c1
kubectl logs busybox --container=c1

# Exec vào container c2
kubectl exec busybox -it --container=c2 -- /bin/sh
```

### 5.3. Bốn Design Patterns

#### Pattern 1: Init Container

Init containers chạy **trước** các container chính, dùng để chuẩn bị môi trường.

```
┌─ Init Phase ─────────┐  ┌─ App Phase ──────────┐
│ init-c1 ✓ → init-c2 ✓│→│ main-app + sidecar   │
│ (chạy tuần tự)       │  │ (chạy đồng thời)     │
└───────────────────────┘  └──────────────────────┘
```

- Chạy **tuần tự** (init-c1 xong mới chạy init-c2)
- **Tất cả phải thành công** mới khởi động container chính
- Dùng cho: download config, chờ database sẵn sàng, khởi tạo data, ...

#### Pattern 2: Sidecar

Sidecar **bổ sung chức năng** cho container chính, chạy song song.

```
┌────────────────────────────┐
│          Pod               │
│ ┌──────────┐ ┌───────────┐ │
│ │ Web App  │ │Log Collect│ │    Sidecar thu thập logs
│ └────┬─────┘ └─────┬─────┘ │    từ filesystem chung
│      │  File System │       │
│      └──────────────┘       │
└────────────────────────────┘
```

**Ví dụ:** Web app ghi logs vào shared filesystem, sidecar container đọc logs và gửi đến hệ thống logging tập trung.

#### Pattern 3: Adapter

Adapter **chuẩn hóa output** của container chính cho dịch vụ bên ngoài.

```
┌──────────────────────────────┐
│          Pod                 │
│ ┌──────────┐ ┌─────────────┐│      ┌───────────────┐
│ │ Web App  │ │Log Normalizer├──────→│Monitoring Svc │
│ └────┬─────┘ └──────┬──────┘│      └───────────────┘
│      │  File System  │       │
│      └───────────────┘       │
└──────────────────────────────┘
```

**Ví dụ:** Web app ghi logs ở định dạng riêng, adapter container chuyển đổi thành định dạng chuẩn mà monitoring service hiểu được.

#### Pattern 4: Ambassador

Ambassador đóng vai trò **proxy** cho container chính, xử lý kết nối ra bên ngoài.

```
┌────────────────────────────────┐
│          Pod                   │
│ ┌──────────┐    ┌────────┐    │      ☁ External
│ │ Web App  │───→│ Proxy  │────├─────→  Service
│ └──────────┘    └────────┘    │
└────────────────────────────────┘
```

**Ví dụ:** Web app kết nối đến localhost, ambassador container proxy request đến database cluster phù hợp (dev/staging/prod).

---

## 6. Observability - Giám sát

### 6.1. Readiness Probe (Kiểm tra sẵn sàng)

#### Câu hỏi: "Ứng dụng đã sẵn sàng nhận traffic chưa?"

```
Readiness Probe → "Bạn sẵn sàng chưa?"
  ├─ Yes ✓ → Traffic được chuyển đến Pod
  └─ No  ✗ → Traffic KHÔNG chuyển đến Pod (Pod bị loại khỏi Service endpoints)
```

**Quan trọng:** Readiness probe thất bại **KHÔNG restart** container, chỉ **ngừng gửi traffic** đến Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: web-app
    image: eshop:4.6.3
    readinessProbe:
      httpGet:                      # Gửi HTTP GET request
        path: /                     # Đến path /
        port: 8080                  # Trên port 8080
      initialDelaySeconds: 5        # Chờ 5 giây sau khi container start mới bắt đầu kiểm tra
      periodSeconds: 2              # Kiểm tra mỗi 2 giây
```

**Giải thích:** Kubernetes sẽ gửi HTTP GET request đến `http://localhost:8080/` mỗi 2 giây. Nếu response trả về status code 200-399 → sẵn sàng. Nếu không → chưa sẵn sàng.

### 6.2. Liveness Probe (Kiểm tra sống còn)

#### Câu hỏi: "Ứng dụng có đang hoạt động bình thường không?"

```
Liveness Probe → "Bạn còn hoạt động không?"
  ├─ Yes ✓ → Container tiếp tục chạy bình thường
  └─ No  ✗ → Kubernetes RESTART container
```

**Quan trọng:** Liveness probe thất bại → Kubernetes **RESTART container**. Đây là điểm khác biệt lớn nhất so với Readiness Probe.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: web-app
    image: eshop:4.6.3
    livenessProbe:
      exec:                          # Chạy command bên trong container
        command:
        - cat
        - /tmp/healthy               # Kiểm tra file /tmp/healthy có tồn tại không
      initialDelaySeconds: 10        # Chờ 10 giây (để ứng dụng khởi động xong)
      periodSeconds: 5               # Kiểm tra mỗi 5 giây
```

**Giải thích:** Kubernetes chạy lệnh `cat /tmp/healthy` trong container. Nếu exit code = 0 (file tồn tại) → healthy. Nếu exit code khác 0 → unhealthy → restart container.

### 6.3. So sánh Readiness vs Liveness

| Đặc điểm | Readiness Probe | Liveness Probe |
|-----------|----------------|----------------|
| Câu hỏi | "Sẵn sàng nhận traffic?" | "Còn hoạt động không?" |
| Khi thất bại | Ngừng gửi traffic | **Restart** container |
| Mục đích | Kiểm soát traffic routing | Khôi phục ứng dụng bị treo |

### 6.4. Debugging (Gỡ lỗi)

Quy trình gỡ lỗi 3 bước:

```bash
# Bước 1: Xem tổng quan - có gì đang chạy/lỗi?
kubectl get all

# Bước 2: Xem chi tiết - lỗi cụ thể là gì?
kubectl describe pod <tên-pod>
# Chú ý phần Events ở cuối output - thường chứa nguyên nhân lỗi
# Ví dụ: CrashLoopBackOff, ImagePullBackOff, ...

# Bước 3: Xem logs - ứng dụng báo lỗi gì?
kubectl logs <tên-pod>
# Xem log output để tìm nguyên nhân gốc
```

---

## 7. Pod Design - Thiết kế Pod

### 7.1. Labels (Nhãn)

#### Labels là gì?

Labels là **cặp key-value** gắn vào object để **phân loại, tìm kiếm và lọc**. Đây là cơ chế tổ chức quan trọng nhất trong Kubernetes.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod1
  labels:                  # Gán labels
    tier: backend          # Tầng: backend
    env: prod              # Môi trường: production
    app: miracle           # Ứng dụng: miracle
```

#### Xem labels

```bash
kubectl get pods --show-labels
# NAME   ... LABELS
# pod1   ... tier=backend,env=prod,app=miracle
```

#### Tìm kiếm theo labels (Label Selectors)

```bash
# Equality-based: tìm Pod có tier=frontend VÀ env=dev
kubectl get pods -l tier=frontend,env=dev --show-labels

# Tìm Pod có label "version" (bất kể giá trị)
kubectl get pods -l version --show-labels

# Set-based: tier là frontend HOẶC backend, VÀ env=dev
kubectl get pods -l 'tier in (frontend,backend),env=dev' --show-labels
```

#### Selector trong YAML

**Services** dùng equality-based selector đơn giản:

```yaml
apiVersion: v1
kind: Service
spec:
  selector:
    tier: frontend
    env: dev
```

**Jobs, Deployments** dùng cả equality-based và set-based:

```yaml
apiVersion: batch/v1
kind: Job
spec:
  selector:
    matchLabels:
      version: v2.1
    matchExpressions:
    - {key: tier, operator: In, values: [frontend, backend]}
```

### 7.2. Annotations (Chú thích)

#### Annotations vs Labels

| | Labels | Annotations |
|-|--------|-------------|
| Dùng để | Phân loại, tìm kiếm, lọc | Lưu metadata bổ sung |
| Có thể query/select | Co | **Khong** |
| Ví dụ | `app: nginx`, `env: prod` | `commit: 866a8dc`, `author: Benjamin` |

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  annotations:             # Metadata mô tả, KHÔNG dùng để query
    commit: 866a8dc
    author: 'Benjamin Muschko'
    branch: 'bm/bugfix'
```

```bash
# Xem annotations qua describe (không dùng -l để filter được)
kubectl describe pods my-pod
# Output: Annotations: author: Benjamin Muschko, ...
```

### 7.3. Deployments

#### Deployment là gì?

Deployment quản lý việc **triển khai và cập nhật** một nhóm Pods. Nó tạo ReplicaSet để đảm bảo số lượng Pod mong muốn luôn chạy.

```
Deployment
  └── ReplicaSet (tự động tạo)
       ├── Pod 1
       ├── Pod 2
       └── Pod 3
```

#### Tạo Deployment

```bash
# Cách nhanh nhất (hybrid approach cho thi):
kubectl create deployment my-deploy --image=nginx \
    --dry-run -o yaml > deploy.yaml
vim deploy.yaml        # Thêm replicas, chỉnh sửa
kubectl create -f deploy.yaml
```

#### YAML đầy đủ của Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: my-deploy
  name: my-deploy
spec:
  replicas: 3                     # Số lượng Pod cần duy trì
  selector:
    matchLabels:
      app: my-deploy              # Chọn Pods thuộc Deployment này
  template:                       # Template cho Pod
    metadata:
      labels:
        app: my-deploy            # Labels của Pod (PHẢI match selector ở trên)
    spec:
      containers:
      - image: nginx
        name: nginx
```

**Lưu ý quan trọng:** `spec.selector.matchLabels` và `spec.template.metadata.labels` **PHẢI KHỚP** nhau.

#### Kiểm tra Deployment

```bash
kubectl get deployments
# NAME        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
# my-deploy   3         3         3             3           25m
```

| Cột | Ý nghĩa |
|-----|---------|
| DESIRED | Số Pod mong muốn (theo spec.replicas) |
| CURRENT | Số Pod đang chạy |
| UP-TO-DATE | Số Pod đã cập nhật đúng phiên bản |
| AVAILABLE | Số Pod sẵn sàng phục vụ |

#### Rolling Update (Cập nhật tuần tự)

Kubernetes cập nhật từng Pod một, đảm bảo **không downtime**:

```
Thời gian →
[v1] [v1]  →  [v1] [v2]  →  [v2] [v2]
 (ban đầu)   (đang update)   (hoàn tất)
```

```bash
# Xem lịch sử revision
kubectl rollout history deployments my-deploy

# Xem chi tiết một revision cụ thể
kubectl rollout history deployments my-deploy --revision=2

# Kiểm tra trạng thái rollout
kubectl rollout status deployments my-deploy
```

#### Rollback (Quay lại phiên bản trước)

Khi phát hiện lỗi ở phiên bản mới:

```bash
# Rollback về revision trước đó
kubectl rollout undo deployments my-deploy

# Rollback về revision cụ thể
kubectl rollout undo deployments my-deploy --to-revision=1
```

```
Thời gian →
[v2] [v2]  →  [v2] [v1]  →  [v1] [v1]
 (lỗi!)     (đang rollback)  (phục hồi!)
```

#### Scaling (Mở rộng/Thu hẹp)

**Manual Scaling:**

```bash
# Tăng từ 2 lên 4 replicas
kubectl scale deployments my-deploy --replicas=4
```

**Auto Scaling (HPA - Horizontal Pod Autoscaler):**

Tự động scale dựa trên CPU usage:

```bash
# Duy trì CPU trung bình 70%, min 1 Pod, max 10 Pods
kubectl autoscale deployments my-deploy --cpu-percent=70 --min=1 --max=10

# Kiểm tra HPA
kubectl get hpa my-deploy
```

```
Khi CPU > 70%:
[Pod1: 86%] [Pod2: 67%]  →  [Pod1: 33%] [Pod2: 63%] [Pod3: 46%]
 (quá tải!)                   (tự động thêm Pod, tải phân bổ đều)
```

### 7.4. Jobs

#### Job là gì?

Job chạy **một tác vụ một lần** rồi kết thúc (khác với Pod chạy liên tục).

| Loại | Tính chất |
|------|-----------|
| **Pod** | Chạy liên tục (web server, API, ...) |
| **Job** | Chạy một lần rồi dừng (backup, migration, ...) |
| **CronJob** | Chạy định kỳ theo lịch (cleanup hàng đêm, ...) |

#### Tạo Job

```bash
# Hybrid approach:
kubectl create job counter --image=nginx --dry-run -o yaml \
    -- /bin/sh -c 'counter=0; while [ $counter -lt 3 ]; \
    do counter=$((counter+1)); echo "$counter"; sleep 3; done;' \
    > job.yaml
vim job.yaml      # Chỉnh thêm completions, parallelism, ...
kubectl create -f job.yaml
```

#### YAML đầy đủ của Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: counter
spec:
  completions: 1          # Số lần hoàn thành thành công cần đạt
  parallelism: 1           # Số Pod chạy song song
  backoffLimit: 6          # Số lần thử lại trước khi đánh dấu Job thất bại
  template:
    spec:
      restartPolicy: OnFailure   # OnFailure: restart container, Never: tạo Pod mới
      containers:
      - name: counter
        image: nginx
        args:
        - /bin/sh
        - -c
        - 'counter=0; while [ $counter -lt 3 ]; do counter=$((counter+1)); echo "$counter"; sleep 3; done;'
```

**Giải thích các trường:**
- `completions`: Cần bao nhiêu Pod thành công → Job mới complete
- `parallelism`: Bao nhiêu Pod chạy cùng lúc
- `backoffLimit`: Thử lại bao nhiêu lần nếu thất bại (mặc định 6)
- `restartPolicy`: **Bắt buộc** phải là `OnFailure` hoặc `Never` (không được dùng `Always`)

#### Sự khác nhau giữa OnFailure vs Never

**`restartPolicy: OnFailure`** - Restart container trong **cùng một Pod**:

```
Pod "counter-ztkvf": fail → restart → fail → restart → success ✓
(Cùng tên Pod, container bên trong được restart)
```

**`restartPolicy: Never`** - Tạo **Pod MỚI** mỗi khi thất bại:

```
Pod "counter-ztkvf": fail ✗
Pod "counter-tgnlh": fail ✗
Pod "counter-pjz5g": fail ✗
Pod "counter-jj4lb": success ✓
(Mỗi lần là Pod mới với tên khác)
```

#### Kiểm tra Job

```bash
kubectl get jobs
# NAME      DESIRED   SUCCESSFUL   AGE
# counter   1         1            3m

kubectl get pods
# NAME            READY   STATUS      RESTARTS   AGE
# counter-924lc   0/1     Completed   0          22m

kubectl logs counter-924lc
# 1
# 2
# 3
```

### 7.5. CronJob

#### CronJob là gì?

CronJob giống Job nhưng chạy **theo lịch định kỳ**.

#### Tạo CronJob

```yaml
apiVersion: batch/v1beta1       # (Kubernetes mới dùng batch/v1)
kind: CronJob
metadata:
  name: counter
spec:
  schedule: "*/1 * * * *"       # Chạy mỗi phút
  jobTemplate:                  # Template cho Job
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: counter
            image: nginx
            args:
            - /bin/sh
            - -c
            - 'echo "Hello at $(date)"'
```

#### Cú pháp Cron Schedule

```
┌───────────── phút (0-59)
│ ┌───────────── giờ (0-23)
│ │ ┌───────────── ngày trong tháng (1-31)
│ │ │ ┌───────────── tháng (1-12)
│ │ │ │ ┌───────────── ngày trong tuần (0-6, 0=Chủ nhật)
│ │ │ │ │
* * * * *
```

| Expression | Ý nghĩa |
|-----------|---------|
| `*/1 * * * *` | Mỗi phút |
| `0 * * * *` | Đầu mỗi giờ |
| `0 0 * * *` | Mỗi ngày lúc nửa đêm |
| `0 0 * * 1` | Mỗi thứ Hai lúc nửa đêm |

#### Kiểm tra CronJob

```bash
kubectl get cronjobs
# NAME    SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
# counter */1 * * * *   False     0        26s             1h

# Theo dõi Jobs được tạo theo thời gian thực
kubectl get jobs --watch
```

---

## 8. Services & Networking - Dịch vụ và Mạng

### 8.1. Service (Dịch vụ)

#### Service là gì?

Service cung cấp **một điểm truy cập mạng ổn định** cho một nhóm Pods. Vì Pod có thể bị restart, di chuyển, thay đổi IP → cần Service làm "cửa ngõ" cố định.

```
                    ┌──────────┐
Incoming Traffic →  │ Service  │ → Pod 1
                    │          │ → Pod 2
                    │          │ → Pod 3
                    └──────────┘
```

#### Service chọn Pod như thế nào?

Bằng **Label Selector**! Service so khớp labels của mình với labels của Pod:

```yaml
# Service có selector: tier: frontend
# → Chỉ route traffic đến Pod có label tier: frontend

Pod (tier: backend)   → ✗ Không nhận traffic
Pod (tier: frontend)  → ✓ Nhận traffic
Pod (không có label)  → ✗ Không nhận traffic
```

#### Tạo Service - Imperative

```bash
# Tạo Pod VÀ Service cùng lúc
kubectl run nginx --image=nginx --restart=Never --port=80 --expose
# service/nginx created
# pod/nginx created
```

#### Tạo Service - Declarative

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  selector:              # Chọn Pod dựa trên label
    tier: frontend
  ports:
  - port: 3000           # Port mà Service lắng nghe (traffic đến)
    protocol: TCP
    targetPort: 80        # Port trên Pod mà traffic được chuyển đến
  type: ClusterIP         # Kiểu Service
```

#### Port Mapping (Ánh xạ Port)

```
Incoming Traffic → port (3000) → targetPort (80) → containerPort (80)
                   [Service]      [Pod/Service]      [Container]
```

- `port`: Port mà **Service** lắng nghe
- `targetPort`: Port trên **Pod** mà Service chuyển traffic đến
- `containerPort`: Port mà **container** thực sự lắng nghe

#### Các loại Service

| Type | Mô tả | Truy cập từ |
|------|--------|-------------|
| `ClusterIP` | IP nội bộ cluster. **Mặc định** | Chỉ trong cluster |
| `NodePort` | Mở port trên mỗi Node | Ngoài cluster (qua NodeIP:NodePort) |
| `LoadBalancer` | Dùng Load Balancer của cloud provider | Ngoài cluster (qua external IP) |

```bash
# ClusterIP - chỉ truy cập nội bộ
kubectl get service nginx
# NAME   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
# nginx  ClusterIP   10.105.201.83   <none>        80/TCP    3h

# NodePort - truy cập từ ngoài
kubectl get service nginx
# NAME   TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
# nginx  NodePort   10.105.201.83   <none>        80:30184/TCP   3h
#                                                  ^port:nodePort
```

#### Mối quan hệ Deployment - Service

```
┌───────────┐       "exposes" (phơi bày)
│  Service  │ ←───── Xử lý traffic đến Pods
└─────┬─────┘
      │
  ┌───▼───┐
  │ Pods  │
  └───┬───┘
      │
┌─────▼─────┐       "manages" (quản lý)
│ Deployment│ ←───── Quản lý lifecycle, replicas, updates
└───────────┘
```

- **Deployment** quản lý Pods (tạo, cập nhật, scale)
- **Service** phơi bày Pods (routing traffic)
- Hai khái niệm **độc lập** nhưng **bổ trợ** nhau

### 8.2. Network Policy (Chính sách mạng)

#### Network Policy là gì?

Network Policy kiểm soát **traffic giữa các Pod** - hoạt động như **firewall** cho Pod.

```
Pod A ──✗──→ Pod B      (bị chặn)
Pod B ──✓──→ Pod C      (cho phép)
Pod C ──✗──→ Pod B      (bị chặn)
```

#### Hai câu hỏi chính của Network Policy

1. **Áp dụng cho Pod nào?** → Dùng `podSelector` (label matching)
2. **Hướng traffic nào? Ai được phép?** → Dùng `Ingress` (vào) và `Egress` (ra)

#### Tạo Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: my-network-policy
spec:
  podSelector:               # Policy áp dụng cho Pod nào?
    matchLabels:
      tier: frontend
  policyTypes:                # Kiểm soát hướng nào?
  - Ingress                   # Traffic VÀO Pod
  - Egress                    # Traffic RA khỏi Pod
  ingress:                    # Ai được kết nối VÀO?
  - from:
    - podSelector:
        matchLabels:
          tier: backend
  egress:                     # Pod được kết nối ĐẾN đâu?
  - to:
    ...
```

#### Best Practice: Bắt đầu bằng deny-all

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}             # {} = áp dụng cho TẤT CẢ Pods
  policyTypes:
  - Ingress                   # Chặn hết traffic vào
  - Egress                    # Chặn hết traffic ra
# Không có rules ingress/egress = CHẶN TẤT CẢ
```

> **Nguyên tắc:** Chặn tất cả trước, sau đó cho phép từng rule cụ thể.

#### Giới hạn theo Port

```yaml
ingress:
- from:
  - podSelector:
      matchLabels:
        tier: backend
  ports:                       # Chỉ cho phép port cụ thể
  - protocol: TCP
    port: 5432                 # Chỉ port 5432 (PostgreSQL) được phép
```

#### Ví dụ thực tế: App + Database

```
┌─────────────────────────────────────┐
│        Kubernetes Cluster           │
│                                     │
│  External ──✓──→ [App Pod]          │   App nhận traffic từ ngoài
│                     │               │
│                     ✓               │   App kết nối được đến DB
│                     ▼               │
│                  [DB Pod]           │   DB chỉ nhận từ App
│                     │               │
│                     ✗──→ External   │   DB KHÔNG kết nối ra ngoài
└─────────────────────────────────────┘
```

---

## 9. State Persistence - Lưu trữ bền vững

### 9.1. Volumes (Ổ đĩa)

#### Vấn đề: Dữ liệu mất khi container restart

Mặc định, filesystem trong container là **tạm thời** (ephemeral). Khi container restart → **dữ liệu bị mất hết**.

#### Giải pháp: Volume

Volume cho phép dữ liệu **tồn tại qua các lần restart container** và có thể **chia sẻ giữa các container** trong cùng Pod.

```
Không có Volume:                    Có Volume:
┌────────────────┐                 ┌────────────────────────┐
│      Pod       │                 │         Pod            │
│ ┌────────────┐ │                 │ ┌──────┐   ┌────────┐ │
│ │ Container  │ │                 │ │ C1   │   │ C2     │ │
│ │ /tmp (mất!)│ │                 │ │/var/ │   │/var/   │ │
│ └────────────┘ │                 │ └──┬───┘   └──┬─────┘ │
└────────────────┘                 │    └───┬──────┘       │
                                   │     [Volume]          │
                                   │    (dữ liệu giữ lại) │
                                   └────────────────────────┘
```

#### Các loại Volume

| Loại | Mô tả | Dữ liệu tồn tại khi... |
|------|--------|------------------------|
| `emptyDir` | Thư mục rỗng, tạo khi Pod start | Pod còn chạy (mất khi Pod bị xóa) |
| `hostPath` | Mount thư mục từ Node host | Node còn tồn tại |
| `configMap` / `secret` | Mount ConfigMap/Secret dạng file | ConfigMap/Secret còn tồn tại |
| `nfs` | Mount NFS share | NFS server còn hoạt động |
| Cloud (EBS, GCE, Azure) | Giải pháp cloud provider | Tài nguyên cloud còn tồn tại |

#### Tạo Volume trong Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-container
spec:
  volumes:                       # Bước 1: Định nghĩa Volume
  - name: logs-volume
    emptyDir: {}                 # Loại: emptyDir (thư mục rỗng)
  containers:
  - image: nginx
    name: my-container
    volumeMounts:                # Bước 2: Mount Volume vào container
    - mountPath: /var/logs       # Mount tại đường dẫn /var/logs
      name: logs-volume          # Tham chiếu volume ở trên
```

Sử dụng:
```bash
kubectl exec -it my-container -- /bin/sh
cd /var/logs
touch app-logs.txt       # Tạo file → dữ liệu được lưu trong Volume
ls                       # Output: app-logs.txt
```

### 9.2. PersistentVolume (PV) và PersistentVolumeClaim (PVC)

#### Tại sao cần PV/PVC?

Volume thường **gắn liền với Pod** - khi Pod bị xóa, dữ liệu có thể mất. PV/PVC cho phép dữ liệu **tồn tại độc lập**, qua cả Pod restart, Node restart.

```
Pod ──→ PVC (yêu cầu) ──→ PV (cung cấp storage)
                              │
                        [Disk vật lý]
```

- **PersistentVolume (PV)**: Đại diện cho một phần storage thực tế (do admin tạo)
- **PersistentVolumeClaim (PVC)**: Yêu cầu sử dụng storage (do developer tạo)
- Pod không truy cập PV trực tiếp mà qua PVC làm **trung gian**

#### Tạo PersistentVolume

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv
spec:
  capacity:
    storage: 512m               # Dung lượng: 512MB
  accessModes:
  - ReadWriteOnce               # Chỉ 1 Node đọc/ghi tại một thời điểm
  storageClassName: shared      # Tên storage class (để PVC match)
  hostPath:
    path: /data/config          # Đường dẫn trên Node host
```

**Access Modes:**

| Mode | Ý nghĩa |
|------|---------|
| `ReadWriteOnce` (RWO) | 1 Node đọc/ghi |
| `ReadOnlyMany` (ROX) | Nhiều Node chỉ đọc |
| `ReadWriteMany` (RWX) | Nhiều Node đọc/ghi |

#### Tạo PersistentVolumeClaim

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: pvc
spec:
  accessModes:
  - ReadWriteMany               # Yêu cầu nhiều Node đọc/ghi
  resources:
    requests:
      storage: 256m             # Yêu cầu 256MB (phải <= PV capacity)
  storageClassName: shared      # PHẢI KHỚP với PV's storageClassName
```

> `storageClassName` của PVC **phải khớp** với PV để binding thành công.

#### Mount PVC vào Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  volumes:
  - name: configpvc
    persistentVolumeClaim:
      claimName: pvc             # Tham chiếu PVC theo tên
  containers:
  - image: nginx
    name: app
    volumeMounts:
    - mountPath: "/data/app/config"   # Mount vào đường dẫn trong container
      name: configpvc
```

#### Tóm tắt luồng PV/PVC

```
1. Admin tạo PV (định nghĩa storage thực tế)
   ↓
2. Developer tạo PVC (yêu cầu storage với size & access mode)
   ↓
3. Kubernetes tự động BIND PVC với PV phù hợp (match storageClassName, capacity, accessMode)
   ↓
4. Developer mount PVC vào Pod (qua volumes + volumeMounts)
   ↓
5. Container trong Pod truy cập storage qua mountPath
```

---

## 10. Tổng kết và lời khuyên

### Lời khuyên ôn thi

1. **Thực hành, thực hành, thực hành!** - Đây là kỳ thi thực hành, không có cách nào khác ngoài luyện tập
2. **Đọc hết tài liệu** tại https://kubernetes.io/docs từ đầu đến cuối
3. **Thành thạo công cụ**: vim, bash, YAML - ba công cụ không thể thiếu
4. **Chọn thời gian thi** mà bạn thoải mái nhất, ngủ đủ giấc
5. **Lần thi đầu tiên** hãy thoải mái nhưng cố gắng hết sức

### Quick Reference - Các lệnh quan trọng nhất

```bash
# === SETUP ===
alias k=kubectl
kubectl config set-context <ctx> --namespace=<ns>

# === POD ===
kubectl run nginx --image=nginx --restart=Never --dry-run -o yaml > pod.yaml
kubectl get pods --show-labels
kubectl describe pod <name>
kubectl logs <pod-name>
kubectl exec <pod-name> -it -- /bin/sh
kubectl delete pod <name> --grace-period=0 --force

# === CONFIGMAP & SECRET ===
kubectl create configmap <name> --from-literal=key=value
kubectl create secret generic <name> --from-literal=key=value

# === DEPLOYMENT ===
kubectl create deployment <name> --image=<img> --dry-run -o yaml > deploy.yaml
kubectl rollout history deployments <name>
kubectl rollout undo deployments <name>
kubectl scale deployments <name> --replicas=<n>
kubectl autoscale deployments <name> --cpu-percent=70 --min=1 --max=10

# === JOB & CRONJOB ===
kubectl create job <name> --image=<img> --dry-run -o yaml > job.yaml
kubectl create cronjob <name> --image=<img> --schedule="*/1 * * * *"

# === SERVICE ===
kubectl run nginx --image=nginx --restart=Never --port=80 --expose
kubectl get svc

# === DEBUG ===
kubectl get all
kubectl describe <resource> <name>
kubectl logs <pod-name>
kubectl explain <resource.field>
```

### Cheat Sheet - YAML Templates

<details>
<summary>Pod cơ bản</summary>

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  containers:
  - name: myapp
    image: nginx
    ports:
    - containerPort: 80
    env:
    - name: MY_VAR
      value: "hello"
    resources:
      requests:
        cpu: "0.5"
        memory: "128Mi"
```
</details>

<details>
<summary>Pod với Probes</summary>

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: myapp
    image: nginx
    readinessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 2
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
```
</details>

<details>
<summary>Deployment</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: nginx:1.21
```
</details>

<details>
<summary>Service</summary>

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```
</details>

<details>
<summary>Job</summary>

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: myjob
spec:
  completions: 1
  parallelism: 1
  backoffLimit: 6
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: myjob
        image: busybox
        args: ["/bin/sh", "-c", "echo done"]
```
</details>

<details>
<summary>CronJob</summary>

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mycron
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: mycron
            image: busybox
            args: ["/bin/sh", "-c", "echo hello"]
```
</details>

<details>
<summary>PV + PVC + Pod</summary>

```yaml
# PersistentVolume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mypv
spec:
  capacity:
    storage: 1Gi
  accessModes:
  - ReadWriteOnce
  storageClassName: standard
  hostPath:
    path: /data

---
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mypvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
  storageClassName: standard

---
# Pod using PVC
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: mypvc
  containers:
  - name: myapp
    image: nginx
    volumeMounts:
    - mountPath: /data
      name: storage
```
</details>

<details>
<summary>NetworkPolicy</summary>

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```
</details>

---

> **Chúc bạn thi CKAD thành công!** Hãy nhớ: chìa khóa là **thực hành liên tục** trên môi trường Kubernetes thật.
