# OCR lại tiếng Việt trên máy của bạn

Cần Python 3, PyMuPDF và Tesseract 5 với hai mô hình vie + eng. Cài PyMuPDF bằng `python -m pip install pymupdf`. Cài Tesseract cho hệ điều hành của bạn và chọn dữ liệu tiếng Việt. Kiểm tra `tesseract --list-langs` phải có vie và eng. Nếu lệnh không tìm thấy, thêm thư mục Tesseract vào PATH.

Đặt các PDF gốc vào một thư mục, rồi chạy:

```
python ocr_vietnamese.py --input "D:/TaiLieuGoc" --output "D:/OCR_TiengViet" --workers 4
```

Công cụ xuất Markdown và cache từng trang, OCR ở 300 dpi. Có thể chạy tiếp sau khi gián đoạn. Chỉ dùng một thư mục đầu ra cho cùng một bộ nguồn; không thay PDF giữa chừng. OCR tự động vẫn phải đối chiếu số liệu, bảng và công thức với bản gốc. Công cụ không xử lý DWG hay hình nhúng Word.
