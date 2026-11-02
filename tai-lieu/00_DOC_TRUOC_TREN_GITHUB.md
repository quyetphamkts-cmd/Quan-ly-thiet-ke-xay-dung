# Bộ tài liệu bổ sung trên GitHub — đọc file này trước

Thư mục `tai-lieu/` là gói "Tài liệu Claude OCR TẠM" (02/11/2026), dùng để phát triển tiếp app Sổ Công Trường (`index.html`, `kb.js`, `kb2.js`, `forms.js` ở thư mục gốc). Đọc tiếp `00_DOC_TRUOC.md` và `00_PROMPT_CHO_CLAUDE.md` (hướng dẫn gốc của gói).

## Có trên GitHub

| File | Nguồn | Cách trích | Độ tin cậy |
|---|---|---|---|
| `01_4_ST_13_Nghiep_vu_QA_QC_cong_truong.md` (+ CHUNKS) | ST-13 Nghiệp vụ QA/QC công trường (Vinaconex 25), PDF 40 trang | OCR Tesseract mô hình tiếng Anh, 220 dpi | Tạm, mất dấu, chưa hiệu đính |
| `06_Thuyet_minh_BPKT_thi_cong_lap_dung_Cua_go_a_duyet_1.md` (+ CHUNKS) | Thuyết minh BPKT lắp dựng cửa gỗ (đã duyệt), PDF 17 trang | OCR Tesseract mô hình tiếng Anh | Tạm, mất dấu, chưa hiệu đính |
| `07_BPTC_coc_tuong_vay.md` | Thuyết minh BPTC cọc đại trà + tường vây (.docx) | Trích trực tiếp XML Word | Chữ đúng; chưa đối chiếu bố cục |
| `08_May_moc_thiet_bi.md` | Bảng kê máy móc, thiết bị (.doc) | Trích trực tiếp XML Word | Chữ đúng; chưa đối chiếu bố cục |
| `09_10_DWG_CHUA_TRICH_XUAT.md`, `DWG_GOC/` | 2 bản vẽ biện pháp cọc nhồi, tường vây | Chưa đọc | Cần xuất PDF/DXF từ CAD |
| `images/` | Hình nhúng trong 2 file Word | Chưa OCR | — |
| `manifest.json`, `page_index.jsonl` | Danh mục nguồn, SHA-256, chỉ mục từng trang | — | Siêu dữ liệu |
| `tools/` | Công cụ OCR lại bằng tiếng Việt | — | Chưa chạy |

## KHÔNG đưa lên GitHub (repo công khai, sách có bản quyền)

- `02_Quan_ly_du_an_Cam_nang_quan_ly_hieu_qua.md` — sách của First News / Dorling Kindersley, 72 trang.
- `03`, `04`, `05` — Sổ tay xử lý sự cố công trình xây dựng Tập 1, 2, 3 (NXB Xây dựng, Vietcons), 999 trang.

Các file này chỉ có trong bản ZIP trên máy của người dùng. Nếu cần nội dung, hãy yêu cầu người dùng đưa file trực tiếp vào cuộc trò chuyện. Không chép nguyên văn sách vào mã nguồn của app; chỉ biên soạn lại và ghi nguồn (tên tài liệu + trang PDF).

## Mục lục 3 tập Sổ tay xử lý sự cố (để tra trang PDF)

Số trang là **thứ tự trang trong file PDF**, không phải số in. Tiêu đề do Claude khôi phục dấu từ bản OCR mất dấu; số trang xác định bằng dò tiêu đề trong bản OCR — cần đối chiếu bản gốc.

### Tập 1 (DOC03, 386 trang)
- **1. Khái niệm chung**: 1.1 Phân loại sự cố chất lượng công trình và nguyên nhân thường gặp — tr.14 · 1.2 Nhiệm vụ và đặc điểm xử lý sự cố — tr.21 · 1.3 Nguyên tắc và yêu cầu cơ bản — tr.23 · 1.4 Trình tự và nội dung chủ yếu xử lý sự cố — tr.28 · 1.5 Phương pháp xử lý thường dùng và phạm vi sử dụng — tr.36
- **2. Kĩ thuật đo kiểm tra**: 2.1 Cường độ thực tế và tính năng vật liệu kết cấu — tr.48 · 2.2 Chất lượng bên trong cấu kiện bê tông — tr.81 · 2.3 Nứt kết cấu — tr.90 · 2.4 Quan trắc biến dạng công trình — tr.96 · 2.5 Thí nghiệm tính năng kết cấu — tr.99 · 2.6 Thí nghiệm nguyên vị nền móng — tr.106 · 2.7 Thấm dột của lớp chống thấm — tr.122
- **3. Xử lý sự cố công trình nền**: 3.1 Phân loại, đặc trưng sự cố nền — tr.123 · 3.2 Phân tích nguyên nhân — tr.135 · 3.3 Trình tự và điều cần chú ý — tr.139 · 3.4 Chọn phương án kĩ thuật thay thế — tr.144 · 3.5 Mở rộng móng và kiểu hố đào — tr.146 · 3.6 Kiểu cọc — tr.153 · 3.7 Phun vữa — tr.194 · 3.8 Chữa nghiêng — tr.232 · 3.9 Thoát nước, chắn đỡ, giảm tải, bảo vệ mái dốc — tr.258
- **4. Xử lý sự cố công trình móng**: 4.1 Sai vị trí móng — tr.263 · 4.2 Biến dạng móng — tr.279 · 4.3 Lỗ rỗng móng — tr.304 · 4.4 Móng thiết bị — tr.314 · 4.5 Giếng chìm — tr.331 · 4.6 Móng hộp — tr.338 · 4.7 Móng cọc — tr.358 (4.7.1 cọc nhồi ống chìm tr.358 · 4.7.2 cọc đúc sẵn tr.368 · 4.7.3 cọc nhồi khoan tr.372 · 4.7.4 cọc đào lỗ tr.377)

### Tập 2 (DOC04, 304 trang)
- **5. Công trình xây (khối xây)**: 5.1 Khối xây bị nứt — tr.13 · 5.2 Cường độ, độ cứng, ổn định không đủ — tr.38 · 5.3 Sập đổ cục bộ — tr.49 · 5.4 Gia cố khối xây — tr.54
- **6. Bê tông cốt thép**: 6.1 Nứt bê tông — tr.77 · 6.2 Biến dạng sai lệch vị trí — tr.131 · 6.3 Cốt thép — tr.147 · 6.4 Cường độ bê tông không đủ — tr.160 · 6.5 Lỗ rỗng, lộ cốt thép — tr.174 · 6.6 Sập đổ cục bộ — tr.185 · 6.7 Gia cố tăng cường — tr.198
- **7. Bê tông ứng suất trước**: 7.1 Neo không đạt — tr.251 · 7.2 Cốt thép ứng suất trước — tr.259 · 7.3 Rãnh lỗ để sẵn — tr.263 · 7.4 Nứt kết cấu — tr.274 · 7.5 Không khống chế được ứng suất trước — tr.287 · 7.6 Sập đổ cấu kiện — tr.291 · 7.7 Sự cố khác — tr.294

### Tập 3 (DOC05, 309 trang)
- **8. Kết cấu thép**: 8.1 Chủng loại, nguyên nhân — tr.14 · 8.2 Biến dạng — tr.15 · 8.3 Nứt cấu kiện, liên kết hư hỏng — tr.23 · 8.4 Gỉ — tr.27 · 8.5 Gia cố — tr.43 · 8.6 Mái thép — tr.73 · 8.7 Dầm cầu trục — tr.79 · 8.8 Cột thép — tr.88
- **9. Kết cấu đặc biệt**: 9.1 Bể nước — tr.90 · 9.2 Ống khói, tháp nước — tr.102 · 9.3 Bể chứa, nhà bơm giếng sâu, giá đỡ ống — tr.110
- **10. Thấm dột**: 10.1 Vật liệu lấp kín, bịt rò rỉ — tr.121 · 10.2 Thấm mái — tr.142 · 10.3 Thấm mặt tường — tr.162 · 10.4 Bếp, vệ sinh — tr.171 · 10.5 Tầng ngầm — tr.176 · 10.6 Thấm rò rỉ công trình — tr.191
- **11. Trang trí, cửa, nền sàn**: 11.1 Vết bẩn, biến màu lớp trang trí — tr.198 · 11.2 Lớp trang trí (trát láng tr.204, mặt trang trí tr.206, sơn đá tr.208, sơn tr.211, quét bả tr.212, bồi dán tr.213, tấm che phủ tr.216) · 11.3 Nền và sàn — tr.218 · 11.4 Trần — tr.226 · 11.5 Cửa đi, cửa sổ — tr.231
- **12. Vật liệu xử lý sự cố**: 12.1 Vữa phun — tr.237 · 12.2 Keo dán kết cấu — tr.263 · 12.3 Vữa, bê tông tính năng đặc biệt — tr.274 · 12.4 Chống thấm bịt rò rỉ — tr.288 · 12.5 Hóa chất khác — tr.298

## Hướng phát triển đang dở (phiên Claude 02/11/2026)

Đang làm tab **Tra cứu tài liệu gốc** trong Thư viện thi công: người dùng tự nạp file ZIP/Markdown vào bộ nhớ trình duyệt (IndexedDB) để tra cứu toàn văn theo trang, mỗi bản ghi có `document_id, source_filename, page, content, extraction_method, review_status`; OCR tạm luôn hiện nhãn "chưa xác minh"; người dùng đánh dấu từng trang đã đối chiếu. Cách này giữ sách có bản quyền ngoài repo công khai. Mục lục trên sẽ hiện trong tab Sự cố, bấm vào để mở trang tương ứng.
