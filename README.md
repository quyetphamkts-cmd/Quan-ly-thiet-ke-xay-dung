# Quản lý thiết kế và thi công xây dựng (Sổ Công Trường)

Ứng dụng nội bộ cho công ty tư vấn thiết kế và thi công (kiến trúc, nội thất, cảnh quan). Chạy thuần HTML, không cần máy chủ.

- `index.html`: ứng dụng.
- `nhatky.js`: số phiên bản, ghi chú phát hành, nhật ký sử dụng (lưu trong máy).
- `kb.js`, `kb2.js`: thư viện thi công (quy trình, checklist giám sát, lỗi thường gặp, nghiệm thu, lấy mẫu, quản lý chất lượng).
- `forms.js`: biểu mẫu hợp đồng, biên bản, giấy đề nghị thanh toán, báo giá; tự điền từ thông tin công ty.
- `manifest.json`, `sw.js`: cài như ứng dụng trên Android, dùng offline.

Dữ liệu người dùng lưu trong trình duyệt của thiết bị (localStorage), chưa đồng bộ giữa các thiết bị. Tài khoản đăng nhập và đồng bộ sẽ bổ sung sau.

Trên Android: mở đường dẫn GitHub Pages bằng Chrome, chọn Thêm vào màn hình chính. Khi in biểu mẫu chọn In, rồi Lưu dạng PDF.

## Quy tắc đánh số phiên bản (giống Deep Flow)

Dạng `x.y.z-beta.N`, hiển thị là `1.0.1 beta 1`. Beta tăng dần 1 → 99; sau beta 99 thì tăng số cuối và quay về beta 1 (`1.0.1-beta.99` → `1.0.2-beta.1`). Không quay về beta 1 của cùng số. Thứ tự: `1.0.1-beta.99` < `1.0.1` < `1.0.2-beta.1`.

Mỗi lần sửa app: `git pull`, sửa, rồi chạy `python3 tools/bump.py "ghi chú 1" "ghi chú 2"` để tự nâng số và thêm ghi chú phát hành vào `nhatky.js`; tăng `CACHE` trong `sw.js`. Số beta phải tăng dần, không trùng khi nhiều phiên cùng sửa.

Bản cài Android (APK) đánh số theo cùng quy tắc nhưng riêng (`versionName`), `versionCode` tăng 1 mỗi lần build. File khóa ký `.jks` không đưa lên repo.
