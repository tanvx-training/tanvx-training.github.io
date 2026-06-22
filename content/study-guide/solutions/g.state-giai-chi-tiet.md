# Lời giải chi tiết — `g.state.md` (State Persistence)

> Đọc kèm [09-state-persistence.md](../09-state-persistence.md).

---

### 1. Pod 2 container busybox, cùng mount emptyDir `/etc/foo`; ghi/đọc chéo file
```yaml
spec:
  containers:
  - args: ['/bin/sh', '-c', 'sleep 3600']
    image: busybox
    name: busybox
    volumeMounts:
    - name: myvolume
      mountPath: /etc/foo
  - args: ['/bin/sh', '-c', 'sleep 3600']
    image: busybox
    name: busybox2          # tên khác
    volumeMounts:
    - name: myvolume        # CÙNG volume
      mountPath: /etc/foo
  volumes:
  - name: myvolume
    emptyDir: {}
```
```bash
kubectl exec -it busybox -c busybox2 -- /bin/sh
  cat /etc/passwd | cut -f1 -d':' > /etc/foo/passwd     # container 2 ghi
  exit
kubectl exec -it busybox -c busybox -- cat /etc/foo/passwd   # container 1 đọc thấy
kubectl delete po busybox
```
**Giải thích:** `emptyDir` là volume chung trong Pod; cả 2 container mount **cùng `name`** nên
file container 2 ghi thì container 1 đọc được. `cut -f1 -d':'` lấy cột đầu (username) của
`/etc/passwd`. `sleep 3600` giữ container sống để exec vào.

---

### 2. PersistentVolume 10Gi `myvolume`, RWO+RWX, storageClass `normal`, hostPath `/etc/foo`
```yaml
kind: PersistentVolume
apiVersion: v1
metadata:
  name: myvolume
spec:
  storageClassName: normal
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
    - ReadWriteMany
  hostPath:
    path: /etc/foo
```
```bash
kubectl create -f pv.yaml
kubectl get pv          # status 'Available' (chưa có PVC nào bind)
```
**Giải thích:** PV = ổ lưu trữ thật trong cluster (admin tạo). `capacity` dung lượng,
`accessModes` cách mount, `hostPath` = thư mục trên node (chỉ phù hợp 1 node/test).

---

### 3. PersistentVolumeClaim `mypvc` 4Gi RWO storageClass `normal`
```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: mypvc
spec:
  storageClassName: normal
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 4Gi
```
```bash
kubectl create -f pvc.yaml
kubectl get pvc        # 'Bound'
kubectl get pv         # PV cũng chuyển sang 'Bound'
```
**Giải thích:** PVC = **yêu cầu** lưu trữ. K8s tìm PV khớp (cùng storageClass, accessMode tương
thích, capacity đủ) rồi **bind**. Yêu cầu 4Gi ≤ 10Gi của PV nên bind được (PVC dùng cả PV).

---

### 4. Pod busybox `sleep 3600` mount PVC vào `/etc/foo`, copy `/etc/passwd` vào đó
```yaml
spec:
  containers:
  - args: ['/bin/sh', '-c', 'sleep 3600']
    image: busybox
    name: busybox
    volumeMounts:
    - name: myvolume
      mountPath: /etc/foo
  volumes:
  - name: myvolume
    persistentVolumeClaim:
      claimName: mypvc          # tham chiếu PVC, KHÔNG phải PV
```
```bash
kubectl exec busybox -it -- cp /etc/passwd /etc/foo/passwd
```
**Giải thích:** Pod luôn tham chiếu **PVC** (`persistentVolumeClaim.claimName`), không bao giờ
tham chiếu PV trực tiếp.

---

### 5. Pod thứ 2 giống hệt; kiểm tra `/etc/foo` có file không — và vì sao có thể không
```bash
# sửa metadata.name: busybox -> busybox2, tạo lại
kubectl exec busybox2 -- ls /etc/foo
kubectl get po busybox -o wide; kubectl get po busybox2 -o wide   # xem cột NODE
# cleanup
kubectl delete po busybox busybox2; kubectl delete pvc mypvc; kubectl delete pv myvolume
```
**Giải thích — bài tư duy:** dùng `hostPath`, dữ liệu nằm trên thư mục của **một node cụ thể**.
Nếu 2 Pod bị xếp lên 2 node khác nhau → Pod 2 **không thấy** file Pod 1 ghi. Khắc phục: dùng
loại lưu trữ chia sẻ đa node (NFS, cloud disk RWX) thay vì hostPath, hoặc ép 2 pod cùng node.

---

### 6. Pod busybox `sleep 3600`, copy `/etc/passwd` từ pod ra máy local
```bash
kubectl run busybox --image=busybox --restart=Never -- sleep 3600
kubectl cp busybox:/etc/passwd ./passwd
cat passwd
```
**Giải thích:** `kubectl cp <pod>:<đường-dẫn-trong-pod> <đường-dẫn-local>`. (Cảnh báo về tar có
thể xuất hiện nhưng file vẫn được copy.)

---

## 🎯 Tổng kết chương g
- `emptyDir` (tạm, theo Pod) để chia sẻ file giữa container — cùng `name` volume.
- PV (cung) ↔ PVC (cầu) → bind theo storageClass + accessMode + capacity.
- Pod mount qua `persistentVolumeClaim.claimName`, không qua PV.
- `hostPath` gắn 1 node → không chia sẻ đa node (bẫy kinh điển).
- `kubectl cp` copy file giữa Pod và local.
