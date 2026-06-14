# Bỏ Tính năng Audit Log (Remove Audit Log Feature)

Yêu cầu là loại bỏ hoàn toàn tính năng Audit Log (lịch sử hoạt động) ra khỏi hệ thống Admin Dashboard. Việc này bao gồm gỡ bỏ các route truy cập, gỡ bỏ liên kết trên menu thanh điều hướng và menu thả xuống của Admin, loại bỏ dữ liệu mock liên quan, và xóa các file component không dùng tới.

## User Review Required

Không có quyết định kiến trúc lớn hoặc thay đổi đột ngột nào cần lưu ý đặc biệt. Mọi thay đổi đều cục bộ trong mã nguồn frontend.

## Open Questions

Không có câu hỏi mở nào.

## Proposed Changes

### Admin Routing & Navigation
Loại bỏ route và liên kết điều hướng đến trang Audit Log.

---

#### [MODIFY] [AppRoutes.jsx](file:///d:/SWP/FE_Horse-Racing/src/routes/AppRoutes.jsx)
- Gỡ bỏ import `AuditLog` từ `../pages/admin/AuditLog/AuditLog`.
- Gỡ bỏ thẻ `<Route path="/admin/audit-log" element={<AuditLog />} />` tại dòng 90.

#### [MODIFY] [adminMockData.js](file:///d:/SWP/FE_Horse-Racing/src/data/adminMockData.js)
- Gỡ bỏ phần khai báo mảng `auditLogs` (dòng 126-132).
- Gỡ bỏ mục menu `/admin/audit-log` khỏi mảng `adminNavItems` (dòng 152).
- Gỡ bỏ thuộc tính `'/admin/audit-log': 'Audit Log'` khỏi đối tượng `breadcrumbLabels` (dòng 173).

#### [MODIFY] [AdminHeader.jsx](file:///d:/SWP/FE_Horse-Racing/src/components/admin/AdminHeader.jsx)
- Gỡ bỏ đường dẫn `<Link to="/admin/audit-log" ...>Audit Log</Link>` trong menu dropdown của user (dòng 107-109).

### Unused Code Clean Up
Xóa bỏ các file liên quan tới component Audit Log đã không còn sử dụng.

---

#### [DELETE] [AuditLog.jsx](file:///d:/SWP/FE_Horse-Racing/src/pages/admin/AuditLog/AuditLog.jsx)
- Xóa file giao diện Audit Log.

#### [DELETE] [AuditLog.css](file:///d:/SWP/FE_Horse-Racing/src/pages/admin/AuditLog/AuditLog.css)
- Xóa file CSS giao diện Audit Log.

## Verification Plan

### Automated Tests
- Chạy kiểm tra build/dev server để đảm bảo không lỗi biên dịch: `npm run dev` (hoặc build thử nếu cần).

### Manual Verification
1. Truy cập vào trang Admin Dashboard.
2. Kiểm tra Sidebar: Xem menu điều hướng bên trái có còn hiển thị mục "Audit Log" nữa không.
3. Kiểm tra User Dropdown: Nhấn vào Avatar Admin ở góc trên bên phải, xác nhận xem có còn tùy chọn "Audit Log" không.
4. Kiểm tra URL trực tiếp: Thử truy cập thủ công vào địa chỉ `/admin/audit-log`, hệ thống phải điều hướng về trang chủ `/` (do có Route fallback `*` sang `/`).
