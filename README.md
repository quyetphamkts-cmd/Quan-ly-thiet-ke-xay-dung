# Quản lý thiết kế và thi công xây dựng (Sổ Công Trường)

Ứng dụng nội bộ cho công ty tư vấn thiết kế và thi công (kiến trúc, nội thất, cảnh quan). Chạy thuần HTML, không cần máy chủ.

- `index.html`: ứng dụng.
- `kb.js`, `kb2.js`: thư viện thi công (quy trình, checklist giám sát, lỗi thường gặp, nghiệm thu, lấy mẫu, quản lý chất lượng).
- `forms.js`: biểu mẫu hợp đồng, biên bản, giấy đề nghị thanh toán, báo giá; tự điền từ thông tin công ty.
- `manifest.json`, `sw.js`: cài như ứng dụng trên Android, dùng offline.

Dữ liệu người dùng lưu trong trình duyệt của thiết bị (localStorage), chưa đồng bộ giữa các thiết bị. Tài khoản đăng nhập và đồng bộ sẽ bổ sung sau.

Trên Android: mở đường dẫn GitHub Pages bằng Chrome, chọn Thêm vào màn hình chính. Khi in biểu mẫu chọn In, rồi Lưu dạng PDF.
