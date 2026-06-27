# Danh sách các nhóm chức năng Dự án Smart Hotel Booking

Dưới đây là danh sách phân rã 20+ nhóm chức năng cho hệ thống quản lý và đặt phòng khách sạn thông minh (Smart Hotel Booking). Bạn có thể dựa vào danh sách này để lên kế hoạch phát triển (Sprint), phân chia công việc, và thiết kế cơ sở dữ liệu.

## Nhóm 1: Xác thực & Phân quyền (Authentication & Authorization)
1. **Đăng nhập/Đăng ký**: Sử dụng Supabase Auth (Email/Password, Google, OAuth).
2. **Quản lý Phiên đăng nhập (Session)**: Xử lý cấp phát và làm mới JWT Token.
3. **Phân quyền (RBAC)**: Định nghĩa và phân quyền User, Staff (Lễ tân, Buồng phòng), Admin.
4. **Quên mật khẩu**: Gửi email reset mật khẩu.

## Nhóm 2: Quản lý Hồ sơ & Thành viên (User & Profile Management)
5. **Thông tin cá nhân**: Cập nhật họ tên, số điện thoại, avatar (Supabase Storage).
6. **Lịch sử hoạt động**: Xem lịch sử đặt phòng, hủy phòng, và đánh giá.
7. **Hạng thành viên (Loyalty)**: Tích điểm sau mỗi lần đặt phòng, nâng hạng (Silver, Gold, Diamond) để nhận ưu đãi.

## Nhóm 3: Quản lý Khách sạn & Cơ sở vật chất (Hotel & Facility Management)
8. **Thông tin chung**: Quản lý tên, địa chỉ, mô tả, chính sách của khách sạn.
9. **Tiện ích khách sạn**: Cấu hình các tiện ích chung (Hồ bơi, Gym, Spa, Bãi đỗ xe).
10. **Hình ảnh & Media**: Quản lý thư viện hình ảnh tổng quan của khách sạn.

## Nhóm 4: Quản lý Loại phòng & Phòng (Room Management)
11. **Quản lý Loại phòng (Room Types)**: Cấu hình loại phòng (Standard, Deluxe, Suite), diện tích, sức chứa, giá cơ bản.
12. **Quản lý Phòng vật lý (Rooms)**: Đánh số phòng thực tế (101, 102), gán thuộc loại phòng nào.
13. **Trạng thái phòng**: Cập nhật trạng thái thời gian thực (Trống, Đang có khách, Cần dọn dẹp, Đang bảo trì).

## Nhóm 5: Tìm kiếm & Gợi ý thông minh (Smart Search & AI Semantic)
14. **Tìm kiếm cơ bản**: Lọc theo ngày Check-in/Check-out, số người, mức giá, loại giường.
15. **Tìm kiếm ngữ nghĩa (AI Semantic Search)**: Tìm kiếm bằng văn bản tự nhiên sử dụng Spring AI và Supabase pgvector (Ví dụ: "Tìm phòng có view biển, yên tĩnh cho 2 người").
16. **Gợi ý cá nhân hóa**: Gợi ý phòng dựa trên lịch sử đặt phòng của người dùng.

## Nhóm 6: Trợ lý ảo AI (AI Virtual Concierge)
17. **Chatbot Hỏi đáp (Q&A)**: Tự động trả lời các câu hỏi về quy định, giờ mở cửa, chính sách vật nuôi.
18. **Chatbot Đặt phòng**: Hỗ trợ tìm và đưa ra link đặt phòng ngay trong khung chat.
19. **Tiếp nhận yêu cầu dịch vụ**: AI nhận các lệnh như "Cho tôi mượn thêm bàn ủi", "Dọn phòng lúc 3h chiều" và tự động chuyển xuống bộ phận liên quan.

## Nhóm 7: Quản lý Đặt phòng (Booking Management)
20. **Tạo đơn đặt phòng**: Chọn ngày, phòng, khách lưu trú, tính toán tổng tiền.
21. **Quản lý trạng thái Booking**: Pending (Chờ thanh toán), Confirmed (Đã xác nhận), Cancelled (Đã hủy), Completed (Đã hoàn thành).
22. **Hủy và hoàn tiền**: Xử lý logic hủy phòng dựa trên chính sách khách sạn, tính phí phạt (nếu có).

## Nhóm 8: Thanh toán & Hóa đơn (Payment & Invoicing)
23. **Tích hợp cổng thanh toán**: Thanh toán qua VNPAY, MoMo, hoặc thẻ tín dụng (Stripe).
24. **Xuất hóa đơn**: Tự động sinh file PDF hóa đơn/chứng từ sau khi hoàn tất thanh toán.
25. **Lịch sử giao dịch**: Ghi nhận toàn bộ dòng tiền vào/ra của hệ thống.

## Nhóm 9: Dịch vụ đi kèm & Yêu cầu phòng (Extra Services & Housekeeping)
26. **Dịch vụ trả phí**: Đặt xe đưa đón sân bay, mua tour, đặt bàn nhà hàng.
27. **Housekeeping (Buồng phòng)**: Hệ thống nhận và xử lý yêu cầu dọn phòng, bổ sung minibar, giặt ủi.
28. **Phục vụ tại phòng (Room Service)**: Đặt đồ ăn, thức uống mang lên tận phòng.

## Nhóm 10: Nhận phòng & Trả phòng (Check-in & Check-out)
29. **Check-in tự động / Lễ tân**: Kiểm tra giấy tờ tùy thân (CMND/Passport), giao chìa khóa/mã cửa.
30. **Check-out & Tính phí phát sinh**: Kiểm tra đồ dùng trong minibar, hư hỏng tài sản, thu thêm phụ phí trước khi khách rời đi.

## Nhóm 11: Đánh giá & Phản hồi (Reviews & Ratings)
31. **Hệ thống đánh giá**: Khách hàng chấm điểm (1-5 sao) và để lại bình luận sau khi hoàn thành lưu trú.
32. **Kiểm duyệt đánh giá**: Admin/Staff xem xét, phản hồi các đánh giá của khách.

## Nhóm 12: Khuyến mãi & Chiến dịch (Promotions & Vouchers)
33. **Quản lý Mã giảm giá (Coupons)**: Tạo mã giảm giá theo %, theo số tiền, cấu hình số lượng, hạn sử dụng.
34. **Chiến dịch giá (Dynamic Pricing)**: Cấu hình tăng/giảm giá tự động vào cuối tuần, ngày lễ tết, hoặc mùa du lịch cao điểm.

## Nhóm 13: Thông báo (Notifications)
35. **Email & SMS**: Gửi email/SMS xác nhận đặt phòng, nhắc nhở ngày check-in.
36. **Push Notifications**: Gửi thông báo trên hệ thống web (chuông thông báo) khi có booking mới, hoặc có khuyến mãi.

## Nhóm 14: Quản lý Nội dung (CMS - Content Management System)
37. **Quản lý bài viết (Blog)**: Đăng tải bài viết giới thiệu địa điểm du lịch, tin tức khách sạn.
38. **Cơ sở kiến thức (Knowledge Base)**: Quản lý bộ dữ liệu để AI (RAG) học và trả lời khách hàng.

## Nhóm 15: Thống kê & Báo cáo (Dashboard & Analytics)
39. **Báo cáo Doanh thu**: Biểu đồ doanh thu theo ngày/tháng/năm, theo loại phòng.
40. **Báo cáo Hoạt động**: Tỷ lệ lấp đầy phòng (Occupancy Rate), tỷ lệ hủy phòng.
41. **Nhật ký hệ thống (Audit Logs)**: Lưu vết mọi hành động của Admin/Staff (ai đã xóa phòng, ai đã sửa giá) để bảo mật.
