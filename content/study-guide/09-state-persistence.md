# 9. State Persistence — đồng hành với `g.state.md`

> **Domain CKAD:** Application Design and Build (volumes nằm trong 20%)
> Gồm: Volumes (`emptyDir`), PersistentVolume (PV), PersistentVolumeClaim (PVC), và cách Pod
> dùng PVC. Hiểu vòng đời dữ liệu.

---

## 9.1. Vì sao cần volume?

Filesystem trong container là **tạm** — container restart/xoá là mất dữ liệu. **Volume** cho
phép giữ/chia sẻ dữ liệu.

| Loại | Vòng đời | Dùng khi |
|------|----------|----------|
| `emptyDir` | Sống theo Pod (xoá Pod là mất) | Chia sẻ tạm giữa các container trong cùng Pod |
| `hostPath` | Thư mục trên node | Test/đặc thù node (ít dùng production) |
| **PV + PVC** | Độc lập với Pod (bền vững) | Dữ liệu phải tồn tại qua Pod chết/tái tạo |

---

## 9.2. PV & PVC — mô hình "cung & cầu"

- **PersistentVolume (PV)**: tài nguyên lưu trữ thực tế trong cluster (admin tạo, hoặc tạo
  động qua StorageClass). Giống "ổ đĩa có sẵn".
- **PersistentVolumeClaim (PVC)**: **yêu cầu** lưu trữ của developer (kích thước, accessMode,
  storageClass). K8s tìm PV phù hợp để **bind**.
- Pod tham chiếu **PVC** (không tham chiếu PV trực tiếp).

```
Pod  →  PVC (yêu cầu)  →  bind  →  PV (lưu trữ thật)
```

### Access modes
| Mode | Ý nghĩa |
|------|---------|
| `ReadWriteOnce` (RWO) | 1 node mount đọc-ghi |
| `ReadOnlyMany` (ROX) | nhiều node mount chỉ-đọc |
| `ReadWriteMany` (RWX) | nhiều node mount đọc-ghi |

---

## 9.3. YAML mẫu

PV:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata: { name: myvolume }
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
    - ReadWriteMany
  storageClassName: normal
  hostPath:
    path: /etc/foo
```

PVC (request một phần dung lượng PV):
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: mypvc }
spec:
  storageClassName: normal
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 4Gi
```

Pod dùng PVC:
```yaml
spec:
  containers:
    - name: busybox
      image: busybox
      command: ["sleep", "3600"]
      volumeMounts:
        - name: data
          mountPath: /etc/foo
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: mypvc
```

```bash
k get pv         # trạng thái: Available → Bound khi PVC khớp
k get pvc        # Bound khi đã gắn PV
k describe pvc mypvc
```

---

## 9.4. Câu hỏi "vì sao pod 2 không thấy file?" (bài quan trọng trong `g.`)

Bài tạo 2 pod cùng dùng `hostPath`/PV, pod 2 có thể **không thấy** file pod 1 ghi. Lý do:
`hostPath` gắn với **node cụ thể** — nếu 2 pod nằm trên 2 node khác nhau thì dữ liệu không
chia sẻ. Cách kiểm tra: `kubectl get pods -o wide` xem cột NODE. Khắc phục (khái niệm): dùng
storage chia sẻ thật sự (RWX, NFS, hoặc ép 2 pod cùng node). Đây là bài rèn tư duy chứ không
chỉ gõ lệnh.

---

## 9.5. `kubectl cp` — copy file giữa local và Pod
```bash
k cp <pod>:/etc/passwd ./passwd       # từ pod ra local
k cp ./file <pod>:/tmp/file           # từ local vào pod
k cp <namespace>/<pod>:/path ./local  # chỉ định namespace
```

---

## 9.6. Lỗi thường gặp
- ❌ PVC không Bound: sai `storageClassName`, accessMode không tương thích, hoặc request lớn
  hơn capacity PV.
- ❌ Pod tham chiếu PV trực tiếp (sai) — phải qua `persistentVolumeClaim.claimName`.
- ❌ Dùng `hostPath` rồi ngạc nhiên vì dữ liệu không chia sẻ giữa các node.
- ❌ Nhầm `emptyDir` là bền vững — nó mất khi Pod bị xoá.

---

## 9.7. Bài tự luyện
1. Tạo PV 5Gi RWO storageClass `manual` hostPath `/mnt/data`; PVC 2Gi cùng class; xác nhận Bound.
2. Tạo pod busybox mount PVC tại `/data`, ghi file; xoá pod, tạo pod mới cùng PVC, kiểm tra
   file còn đó (nếu cùng node).
3. Copy `/etc/hostname` từ pod ra máy local bằng `kubectl cp`.

→ Tiếp: [10-helm-crd-podman.md](10-helm-crd-podman.md)
