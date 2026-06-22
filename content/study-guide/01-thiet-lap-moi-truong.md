# 1. Thiết lập môi trường luyện tập & Tăng tốc kubectl

Không có cluster để gõ tay = không thể đậu CKAD. Phần này giúp bạn dựng cluster trong
~15 phút và cấu hình `kubectl` để gõ nhanh như trong phòng thi.

---

## 1.1. Chọn cách dựng cluster luyện tập

Bạn đang dùng **macOS**. Có 3 lựa chọn, khuyến nghị theo thứ tự:

### Lựa chọn A — `kind` (Kubernetes in Docker) ⭐ khuyến nghị
Nhẹ, nhanh, tạo được multi-node, dễ xoá làm lại. Cần Docker Desktop.

```bash
brew install kind kubectl
# Tạo cluster 1 control-plane + 2 worker (giống môi trường thi nhiều node)
cat <<EOF | kind create cluster --name ckad --config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
EOF

kubectl get nodes        # phải thấy 3 node Ready
```

> NetworkPolicy: kind mặc định dùng `kindnet` **không** enforce NetworkPolicy. Để luyện
> bài NetworkPolicy thật sự chặn được traffic, cài thêm Calico (xem 1.6) hoặc dùng minikube
> với `--cni=calico`.

### Lựa chọn B — `minikube`
Một node, có addon tiện (ingress, metrics-server, dashboard).

```bash
brew install minikube kubectl
minikube start --kubernetes-version=stable --cni=calico
minikube addons enable metrics-server
minikube addons enable ingress
```

### Lựa chọn C — Cluster trên cloud / killercoda
- https://killercoda.com/ — playground K8s miễn phí ngay trên trình duyệt, không cần cài gì.
  Rất tốt khi bạn chưa muốn cài đặt máy. (Mỗi session có giới hạn thời gian.)

> **Khuyến nghị:** dùng **kind** cho đa số bài, bật Calico nếu cần NetworkPolicy; dùng
> **killercoda** khi đi xa không mang máy.

---

## 1.2. Kiểm tra cài đặt

```bash
kubectl version --client      # xem phiên bản client
kubectl cluster-info          # xem cluster đang trỏ tới đâu
kubectl get nodes             # các node
kubectl config current-context
```

Cài thêm **metrics-server** nếu dùng kind (cho bài `kubectl top`):
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# kind cần thêm cờ insecure TLS:
kubectl -n kube-system patch deployment metrics-server --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

---

## 1.3. Tăng tốc kubectl — alias & biến môi trường ⭐ (BẮT BUỘC luyện)

Đây là phần **quyết định bạn có kịp giờ thi hay không**. Thêm vào `~/.zshrc` (macOS) hoặc
`~/.bashrc`. **Trong phòng thi**, gõ các dòng này 1 lần ở đầu giờ (chúng được phép).

```bash
alias k=kubectl                       # gõ 'k' thay vì 'kubectl'
export do="--dry-run=client -o yaml"  # $do = tạo YAML không apply
export now="--force --grace-period=0" # $now = xoá tức thì

# Bật autocomplete cho 'k' (zsh)
source <(kubectl completion zsh)
complete -F __start_kubectl k
```

Cách dùng:
```bash
k run nginx --image=nginx $do > pod.yaml     # tạo YAML pod nhanh
k delete pod nginx $now                       # xoá ngay không chờ
```

> `$do` đọc là "**d**ry-**o**utput". `$now` để xoá nhanh khi cần làm lại bài.

---

## 1.4. Cấu hình vim cho YAML ⭐

YAML **rất nhạy cảm với khoảng trắng** và **không cho dùng tab**. Cấu hình vim để tự thụt
2 space. Tạo file `~/.vimrc`:

```vim
set number          " hiện số dòng
set expandtab       " tab -> space
set tabstop=2       " 1 tab = 2 space
set shiftwidth=2    " thụt lề 2 space
set autoindent      " tự thụt theo dòng trên
```

### 12 thao tác vim tối thiểu phải thuộc
| Lệnh | Tác dụng |
|------|----------|
| `i` | chèn (insert) tại con trỏ |
| `Esc` | thoát insert về normal mode |
| `:w` | lưu |
| `:wq` hoặc `ZZ` | lưu & thoát |
| `:q!` | thoát không lưu |
| `dd` | xoá cả dòng |
| `yy` rồi `p` | copy dòng / dán |
| `u` | undo |
| `Ctrl+r` | redo |
| `/text` rồi `n` | tìm "text" / kết quả tiếp |
| `:set paste` | tắt auto-indent khi dán (tránh lệch lề) |
| `gg` / `G` | về đầu file / cuối file |
| `:%s/cũ/mới/g` | thay toàn bộ "cũ" thành "mới" |

> Mẹo cứu cánh: khi dán YAML từ tài liệu bị lệch thụt lề, gõ `:set paste` trước khi dán,
> dán xong gõ `:set nopaste`.

---

## 1.5. Mẹo dùng tài liệu kubernetes.io khi thi

Trong phòng thi bạn được mở **1 tab** kubernetes.io. Tập thói quen:
- Dùng ô **Search** trên trang, gõ từ khoá như `configmap`, `network policy`, `persistent volume`.
- Mỗi trang tài liệu có **ví dụ YAML** — copy về rồi sửa, nhanh hơn gõ tay.
- Các "breadcrumb" ở đầu mỗi bài trong repo (vd: `kubectl Commands -> ...`) chính là đường
  dẫn tới trang tài liệu liên quan — học để biết tra ở đâu.
- Trang vàng cần thuộc đường đi:
  - kubectl Cheat Sheet
  - Pods → Pod Lifecycle (probes)
  - ConfigMaps / Secrets
  - Deployments
  - Services / Ingress / Network Policies
  - Persistent Volumes

---

## 1.6. (Tuỳ chọn) Bật NetworkPolicy trên kind bằng Calico

```bash
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml
kubectl -n kube-system rollout status ds/calico-node   # chờ Ready
```
Sau đó các bài NetworkPolicy trong `f.services.md` mới thật sự chặn được traffic.

---

## 1.7. Lệnh "reset" cluster luyện tập về sạch
```bash
# Xoá nhanh mọi pod/deploy/svc trong namespace hiện tại để làm lại bài
kubectl delete all --all
# Hoặc xoá hẳn cluster kind rồi tạo lại
kind delete cluster --name ckad
```

---

## ✅ Checklist hoàn tất phần thiết lập
- [ ] `kubectl get nodes` trả về node Ready.
- [ ] `alias k=kubectl`, `$do`, `$now` hoạt động.
- [ ] Autocomplete cho `k` chạy được (gõ `k g<Tab>` ra `get`).
- [ ] `~/.vimrc` đã set 2-space, thử mở 1 YAML thấy thụt lề đẹp.
- [ ] (Tuỳ chọn) metrics-server chạy: `kubectl top nodes` có số liệu.

→ Tiếp theo: [02-kien-thuc-nen-tang-k8s.md](02-kien-thuc-nen-tang-k8s.md)
