# Lời giải chi tiết — `f.services.md` (Services & Networking)

> Đọc kèm [08-services-networking.md](../08-services-networking.md).

---

### 1. Pod nginx + expose port 80
```bash
kubectl run nginx --image=nginx --restart=Never --port=80 --expose
```
**Giải thích:** `--port=80` khai báo containerPort; `--expose` tạo thêm **Service ClusterIP**
trỏ vào Pod. Không có `--expose` thì chỉ có Pod, không có Service.

### 2. Xác nhận ClusterIP + endpoints
```bash
kubectl get svc nginx
kubectl get ep            # endpoints = IP các pod mà service trỏ tới
```
**Giải thích:** **Endpoints** liệt kê IP:port các Pod đứng sau Service. Endpoints rỗng = Service
không tìm thấy Pod nào (sai selector/targetPort).

### 3. Lấy ClusterIP, busybox tạm wget vào IP đó
```bash
IP=$(kubectl get svc nginx --template={{.spec.clusterIP}})
kubectl run busybox --rm --image=busybox -it --restart=Never --env="IP=$IP" -- wget -O- $IP:80 --timeout 2
```
**Giải thích:** `--template={{.spec.clusterIP}}` trích ClusterIP. `--timeout 2` để fail nhanh
(2 giây) thay vì chờ lâu khi không kết nối được.

### 4. Đổi ClusterIP → NodePort, tìm port, hit qua IP node, rồi xoá
```bash
kubectl patch svc nginx -p '{"spec":{"type":"NodePort"}}'   # hoặc kubectl edit svc nginx
kubectl get svc            # thấy dạng 80:31931/TCP
wget -O- <NODE_IP>:31931
kubectl delete svc nginx; kubectl delete pod nginx
```
**Giải thích:** `NodePort` mở 1 cổng (30000–32767) trên **mọi node**; truy cập qua `IP_node:nodePort`
từ ngoài cluster. `patch` sửa nhanh 1 trường mà không mở editor.

### 5. Deployment `foo` (image simpleapp, 3 replica, port 8080), KHÔNG tạo service
```bash
kubectl create deploy foo --image=dgkanatsios/simpleapp --port=8080 --replicas=3
```
**Giải thích:** `create deploy` tự gắn label `app=foo`. App này trả về hostname của Pod → dùng
để thấy load balancing.

### 6. Lấy IP các pod, busybox tạm hit port 8080
```bash
kubectl get pods -l app=foo -o wide          # cột IP
kubectl run busybox --image=busybox --restart=Never -it --rm -- sh
# trong shell: wget -O- <POD_IP>:8080   (dùng IP, KHÔNG dùng tên pod)
```
**Giải thích:** mỗi Pod có IP riêng, hit từng IP thấy hostname khác nhau. Pod **không** có DNS
theo tên (chỉ Service mới có).

### 7. Service expose deployment trên port 6262
```bash
kubectl expose deploy foo --port=6262 --target-port=8080
kubectl get svc foo
kubectl get endpoints foo     # 3 IP pod, cổng 8080
```
**Giải thích — phân biệt:** `--port=6262` = cổng của **Service** (client gọi vào); `--target-port=8080`
= cổng **container** nhận. Service nhận ở 6262 rồi chuyển tới 8080 của Pod.

### 8. busybox tạm wget tới service `foo`, thấy hostname đổi mỗi lần; rồi dọn dẹp
```bash
kubectl run busybox --image=busybox -it --rm --restart=Never -- sh
# wget -O- foo:6262        → DNS phân giải tên service, mỗi lần ra Pod khác (cân tải)
kubectl delete svc foo; kubectl delete deploy foo
```
**Giải thích:** trong cùng namespace, gọi Service bằng **tên** (`foo`) là được nhờ DNS nội bộ.
Service cân tải round-robin tới các Pod.

### 9. nginx deployment 2 replica + ClusterIP service + NetworkPolicy chỉ cho `access=granted`
```bash
kubectl create deployment nginx --image=nginx --replicas=2
kubectl expose deployment nginx --port=80
kubectl describe svc nginx        # xem selector app=nginx của pod
```
```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: access-nginx
spec:
  podSelector:                    # áp luật lên pod nào (đích)
    matchLabels:
      app: nginx
  ingress:
  - from:
    - podSelector:                # nguồn được phép
        matchLabels:
          access: granted
```
Kiểm tra:
```bash
kubectl run busybox --image=busybox --rm -it --restart=Never -- wget -O- http://nginx:80 --timeout 2
# ↑ BỊ CHẶN (không có label access=granted)
kubectl run busybox --image=busybox --rm -it --restart=Never --labels=access=granted -- wget -O- http://nginx:80 --timeout 2
# ↑ THÀNH CÔNG
```
**Giải thích — 2 podSelector khác vai trò:**
- `spec.podSelector` = chọn **Pod bị áp chính sách** (pod nginx được bảo vệ).
- `ingress.from.podSelector` = chọn **nguồn được phép** (pod có `access=granted`).
- Mọi traffic vào pod nginx **không** khớp `from` đều bị chặn.

**Bẫy:** NetworkPolicy chỉ có hiệu lực nếu CNI hỗ trợ (kind mặc định **không** enforce → cần
Calico). Nếu test thấy "không chặn được", kiểm tra CNI.

---

## 🎯 Tổng kết chương f
- `--expose`/`expose` tạo Service; `--port` (service) vs `--target-port` (container).
- `get endpoints` để debug: rỗng = sai selector/target-port.
- ClusterIP (nội bộ) ↔ NodePort (ngoài, qua IP node:nodePort); đổi bằng `patch`/`edit`.
- Trong cluster gọi Service qua **tên DNS**; gọi Pod phải qua **IP**.
- NetworkPolicy: `spec.podSelector` = đích, `from/to.podSelector` = nguồn/đích cho phép.
