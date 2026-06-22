# 8. Services & Networking — đồng hành với `f.services.md`

> **Domain CKAD:** Services and Networking (20%)
> Gồm: Service (ClusterIP, NodePort), Endpoints, expose Deployment, **NetworkPolicy**, và
> Ingress (đọc thêm). Hiểu "Pod gọi nhau qua Service, chọn bằng label".

---

## 8.1. Vì sao cần Service?

Pod là ephemeral, IP thay đổi liên tục. **Service** cung cấp **IP & DNS ổn định** + **cân
bằng tải** tới nhóm Pod được chọn qua **label selector**.

DNS nội bộ của Service: `tên-service.namespace.svc.cluster.local` (trong cùng namespace chỉ
cần `tên-service`).

### Các loại Service
| Type | Phạm vi truy cập | Dùng khi |
|------|------------------|----------|
| **ClusterIP** (mặc định) | Chỉ trong cluster | Service nội bộ giữa các app |
| **NodePort** | Mở cổng trên mọi node (30000–32767) | Truy cập từ ngoài (đơn giản/test) |
| **LoadBalancer** | LB của cloud | Production trên cloud |
| **ExternalName** | Ánh xạ tới DNS ngoài | Trỏ tới dịch vụ bên ngoài |

---

## 8.2. Lệnh cốt lõi

```bash
# Cách nhanh nhất: run pod + tạo luôn service
k run nginx --image=nginx --port=80 --expose      # tạo pod + ClusterIP service port 80

# Expose một resource đã có
k expose pod nginx --port=80 --name=nginx-svc
k expose deployment foo --port=6262 --target-port=8080 --name=foo
# --port: cổng của Service; --target-port: cổng container

# Kiểm tra
k get svc
k get endpoints nginx-svc        # xem service đang trỏ tới IP pod nào (rất quan trọng để debug)
k describe svc nginx-svc

# Đổi type sang NodePort
k expose deployment foo --port=80 --type=NodePort
# hoặc: k edit svc foo  → đổi spec.type: NodePort

# Test từ trong cluster
k run tmp --image=busybox --restart=Never --rm -it -- wget -O- --timeout=2 nginx-svc:80
```

> **Endpoints rỗng = service không thấy pod nào.** Nguyên nhân số 1: **label selector của
> Service không khớp label của Pod**, hoặc sai `target-port`. Luôn `kubectl get endpoints`
> để chẩn đoán.

YAML Service mẫu:
```yaml
apiVersion: v1
kind: Service
metadata: { name: foo }
spec:
  type: ClusterIP            # hoặc NodePort
  selector:
    app: foo                 # PHẢI khớp label trên Pod
  ports:
    - port: 6262             # cổng của Service
      targetPort: 8080       # cổng container
      # nodePort: 30080      # chỉ khi type=NodePort (tuỳ chọn)
```

---

## 8.3. NetworkPolicy — tường lửa cấp Pod ⭐

Mặc định mọi Pod **gọi được nhau tự do**. NetworkPolicy giới hạn traffic **vào (ingress)**
và/hoặc **ra (egress)** dựa trên label, namespace, port.

> ⚠️ Cần CNI hỗ trợ (Calico…). kind mặc định không enforce — xem chương 1 để bật Calico.

Mẫu: chỉ cho pod có label `access: granted` truy cập deployment nginx:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: allow-access }
spec:
  podSelector:                 # áp policy lên pod nào (đích)
    matchLabels:
      app: nginx
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:         # nguồn được phép
            matchLabels:
              access: granted
      ports:
        - protocol: TCP
          port: 80
```

Điểm dễ nhầm:
- `podSelector` cấp `spec` = **chọn Pod bị áp luật** (đích).
- `podSelector` trong `from`/`to` = **chọn nguồn/đích được phép**.
- Một policy có cả `from` (ingress) lẫn `to` (egress) tuỳ `policyTypes`.
- `from:` có thể là `podSelector`, `namespaceSelector`, hoặc `ipBlock`. **Cẩn thận YAML:**
  liệt kê trong cùng 1 phần tử `-` là AND, tách thành nhiều `-` là OR.

```bash
k get networkpolicy
k describe networkpolicy allow-access
```

---

## 8.4. Ingress (nên đọc thêm — có thể xuất hiện)

Service NodePort/LoadBalancer expose từng dịch vụ; **Ingress** định tuyến HTTP/HTTPS theo
host/path tới nhiều Service qua 1 điểm vào (cần Ingress Controller, vd nginx-ingress).

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: web }
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /app
            pathType: Prefix
            backend:
              service:
                name: foo
                port: { number: 80 }
```
```bash
k create ingress web --rule="example.com/app=foo:80"   # cách imperative nhanh
```

---

## 8.5. Ánh xạ bài tập `f.services.md`
| Bài | Kỹ năng |
|-----|---------|
| pod nginx expose port 80 | `--expose`, kiểm tra svc + endpoints |
| ClusterIP + endpoints | `get svc`, `get endpoints`, wget từ busybox |
| chuyển ClusterIP → NodePort | `edit svc` đổi type, tìm nodePort, hit qua IP node |
| deployment foo 3 replica, port 8080 | `create deployment` + `--port` khai báo container port |
| hit IP từng pod | mỗi pod IP riêng, hostname khác nhau (load balancing) |
| expose deployment port 6262 | `expose deployment ... --target-port=8080` |
| wget tới service | tên service phân giải DNS, mỗi lần ra hostname khác (cân tải) |
| NetworkPolicy access: granted | tạo policy ingress theo podSelector |

---

## 8.6. Lỗi thường gặp
- ❌ Service `selector` không khớp label Pod → Endpoints rỗng → không kết nối.
- ❌ Nhầm `port` (Service) với `targetPort` (container).
- ❌ NetworkPolicy "không có tác dụng" vì CNI không hỗ trợ (kind mặc định).
- ❌ Nhầm AND/OR trong `from`/`to` của NetworkPolicy (số lượng dấu `-`).
- ❌ NodePort không truy cập được vì hit sai IP/cổng (phải là IP node + nodePort).

---

## 8.7. Bài tự luyện
1. Deployment `web` 3 replica nginx, expose ClusterIP port 80, từ busybox wget thấy phản hồi.
2. Đổi service thành NodePort, truy cập qua IP node.
3. (Cần Calico) Tạo NetworkPolicy chỉ cho pod `access=granted` gọi `web`; verify pod không
   có label bị chặn, pod có label thì vào được.

→ Tiếp: [09-state-persistence.md](09-state-persistence.md)
