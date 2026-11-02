# Nội dung gửi Claude

Tôi muốn phát triển ứng dụng hỗ trợ quản lý và tra cứu nghiệp vụ xây dựng dựa trên bộ tài liệu đính kèm. Hãy bắt đầu bằng kiểm kê nguồn và đề xuất chức năng dựa trên nội dung thực sự đọc được; chưa tự coi mọi nội dung là yêu cầu bắt buộc của ứng dụng.

Yêu cầu xử lý:
1. Đọc 00_DOC_TRUOC.md và manifest.json. Phân biệt Word trích xuất trực tiếp, OCR tạm và DWG chưa đọc. Không tuyên bố đã đọc nội dung DWG.
2. Giữ liên kết nguồn: tên tài liệu, trang PDF hoặc chỉ số khối Word. Không đoán hay âm thầm sửa thông số, đơn vị, công thức, số hiệu tiêu chuẩn khi OCR không rõ; đánh dấu cần kiểm tra với trang gốc.
3. Lập bảng các nghiệp vụ, biểu mẫu, dữ liệu đầu vào/đầu ra và quy trình có bằng chứng trong tài liệu. Tách phần có căn cứ với đề xuất mới.
4. Đề xuất kiến trúc dữ liệu, phân quyền, luồng nghiệp vụ và phạm vi MVP. Hỏi tôi những quyết định sản phẩm còn thiếu trước khi triển khai các chức năng phụ thuộc chúng.
5. Với tra cứu tài liệu, đề xuất dữ liệu gồm document_id, source_filename, page, content, extraction_method, review_status. OCR tạm phải hiển thị trạng thái chưa xác minh.
6. Các công thức kỹ thuật, giới hạn nghiệm thu và viện dẫn pháp lý phải được xác minh từ bản gốc và nguồn hiện hành trước khi chuyển thành quy tắc tính toán hoặc tự động kết luận.

Đầu ra đầu tiên: kiểm kê tài liệu đọc được/chưa đọc được; ma trận nghiệp vụ có trích nguồn; đề xuất MVP; các câu hỏi cần làm rõ. Sau khi chốt phạm vi mới viết mã.
