# Gói tài liệu cho Claude — bản trích xuất và OCR tạm

## Chất lượng và phạm vi
- 6 PDF, tổng cộng 1.128 trang: OCR Tesseract tiếng Anh ở 220 dpi. Đây là bản TẠM; dấu tiếng Việt, ký hiệu, số liệu, công thức và bố cục bảng có thể sai. Không phải bản OCR tiếng Việt đã hiệu đính.
- 2 Word: trích xuất chữ trực tiếp và bảng theo thứ tự XML. File DOC được chuyển sang DOCX trước khi đọc. Hình nhúng được giữ trong images; chữ trong các hình này chưa được OCR. Không bảo toàn bố cục trang, ô gộp hoặc vị trí hình.
- 2 DWG: CHƯA đọc nội dung; giữ nguyên trong DWG_GOC.
- Nội dung là bản trích xuất tài liệu nguồn, không phải đặc tả ứng dụng đã được chủ đầu tư duyệt. Không suy ra rằng các tiêu chuẩn/pháp lý trong tài liệu cũ còn hiệu lực.

## Đưa cho Claude
1. Giải nén gói ZIP.
2. Đưa file 00 này cùng 00_PROMPT_CHO_CLAUDE.md và các Markdown liên quan vào cuộc trò chuyện/dự án Claude.
3. Nếu tài liệu dài vượt giới hạn, dùng các file trong CHUNKS: mỗi phần tối đa 25 trang PDF. Không cần tải đồng thời cả bản đầy đủ và bản chia nhỏ.
4. Khi cần số liệu kỹ thuật, hình vẽ hoặc công thức, tải thêm trang PDF gốc để đối chiếu. Gói không chứa lại 6 PDF gốc dung lượng lớn.
5. Hai DWG cần xuất PDF hoặc DXF từ phần mềm CAD để tiếp tục đọc.

## Chạy lại OCR tiếng Việt
Thư mục tools có ocr_vietnamese.py và HUONG_DAN.md. Công cụ này chưa được chạy với mô hình vie trong môi trường bàn giao vì bộ nhận dạng tiếng Việt không có sẵn và tải xuống bị chặn. Bản OCR tiếng Anh hiện tại không tự chuyển thành bản tiếng Việt chỉ bằng đổi tên tệp.

## Truy nguyên
Các tiêu đề 'Trang PDF N' tương ứng trang thứ N của file gốc, tính từ 1, kể cả bìa/trang trắng. manifest.json chứa số trang, phương pháp, SHA-256 nguồn; page_index.jsonl có một bản ghi cho từng trang và đánh dấu các trang ít chữ để kiểm tra.
