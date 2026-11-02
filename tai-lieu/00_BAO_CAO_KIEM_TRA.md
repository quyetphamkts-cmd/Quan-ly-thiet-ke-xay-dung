# Kiểm tra bàn giao

- PDF: 1128 / 1.128 trang có bản ghi OCR; không có lỗi tiến trình Tesseract.
- Có 2 trang dưới 100 ký tự; có thể là bìa, trang trắng, hình hoặc OCR yếu. Danh sách trong manifest.json.
- Đã kiểm tra mẫu OCR đối chiếu ảnh: nhận được nội dung nhưng có nhiều lỗi dấu tiếng Việt. Không xác nhận độ chính xác số liệu; không có đo lường accuracy toàn bộ.
- Word: đã trích xuất các đoạn/bảng; hình giữ nguyên nhưng chưa OCR.
- DWG: chưa đọc nội dung, giữ nguyên bản gốc.
- Công cụ OCR tiếng Việt: đã kiểm tra cú pháp và --help; chưa chạy OCR vie+eng do thiếu mô hình.

| Tài liệu PDF | Số trang | Ký tự OCR |
|---|---:|---:|
| 4. ST-13. Nghiep vu QA.QC cong truong.pdf | 40 | 47,486 |
| Quản lý dự án - Cẩm nang quản lý hiệu quả.pdf | 72 | 128,723 |
| So tay xu ly su co cong trinh XD_Tap 1.pdf | 386 | 920,274 |
| So tay xu ly su co cong trinh XD_Tap 2.pdf | 304 | 642,522 |
| So tay xu ly su co cong trinh XD_Tap 3.pdf | 309 | 692,273 |
| Thuyết minh BPKT thi công lắp dựng Cửa gỗ - Đã duyệt_1.pdf | 17 | 15,397 |