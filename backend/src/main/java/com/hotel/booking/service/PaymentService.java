package com.hotel.booking.service;

import com.hotel.booking.model.Booking;
import com.hotel.booking.model.PaymentTransaction;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStatus(UUID bookingId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return Map.of("error", true, "message", "Khong tim thay booking voi ID: " + bookingId);
        }
        Booking booking = bookingOpt.get();
        boolean isPaid = "CONFIRMED".equalsIgnoreCase(booking.getStatus()) ||
                         "COMPLETED".equalsIgnoreCase(booking.getStatus());

        return Map.of(
                "bookingId", booking.getId(),
                "status", booking.getStatus(),
                "isPaid", isPaid,
                "totalAmount", booking.getTotalAmount()
        );
    }

    @Transactional
    public Map<String, Object> confirmPaymentDemo(UUID bookingId) {
        log.info("==> [Demo ByPass] Yeu cau xac nhan thanh toan nhanh cho bookingId: {}", bookingId);
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return Map.of("error", true, "success", false, "message", "Khong tim thay booking voi ID: " + bookingId);
        }

        Booking booking = bookingOpt.get();
        if ("CONFIRMED".equalsIgnoreCase(booking.getStatus()) || "COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            return Map.of(
                    "success", true,
                    "message", "Booking nay da duoc thanh toan & xac nhan tu truoc.",
                    "bookingId", booking.getId(),
                    "status", booking.getStatus()
            );
        }

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        PaymentTransaction tx = PaymentTransaction.builder()
                .gateway("Demo ByPass")
                .accountNumber("108879632507")
                .transferAmount(booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO)
                .content("PAY " + booking.getId().toString().substring(0, 8).toUpperCase())
                .transactionDate(OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .status("MATCHED")
                .matchedBookingId(booking.getId())
                .note("Xác nhận nhanh bằng nút Test Đồ án / Postman")
                .build();
        paymentTransactionRepository.save(tx);

        log.info("==> [Demo ByPass] Da xac nhan thanh toan CONFIRMED cho booking: {}", bookingId);

        return Map.of(
                "success", true,
                "message", "🎉 [ByPass Đồ Án] Đã giả lập thanh toán & xác nhận thành công cho Booking: " + bookingId,
                "bookingId", booking.getId(),
                "status", "CONFIRMED"
        );
    }

    @Transactional
    public Map<String, Object> processSePayWebhook(Map<String, Object> payload) {
        log.info("==> [SePay Webhook] Nhan duoc webhook tu SePay / Postman: {}", payload);

        String bookingIdStr = (String) payload.get("bookingId");
        if (bookingIdStr != null && !bookingIdStr.isBlank()) {
            try {
                UUID bookingId = UUID.fromString(bookingIdStr);
                return confirmPaymentDemo(bookingId);
            } catch (Exception e) {
                log.warn("bookingId trong webhook khong dung dinh dang UUID: {}", bookingIdStr);
            }
        }

        String content = (String) payload.getOrDefault("content",
                         payload.getOrDefault("des",
                         payload.getOrDefault("description", "")));
        String gateway = (String) payload.getOrDefault("gateway", "VietinBank");
        String accountNumber = (String) payload.getOrDefault("accountNumber", "108879632507");
        String dateStr = (String) payload.getOrDefault("transactionDate", OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        BigDecimal amount = BigDecimal.ZERO;
        Object amountObj = payload.get("transferAmount");
        if (amountObj instanceof Number) {
            amount = BigDecimal.valueOf(((Number) amountObj).doubleValue());
        } else if (amountObj != null) {
            try { amount = new BigDecimal(amountObj.toString()); } catch (Exception ignored) {}
        }

        if (content == null || content.isBlank()) {
            PaymentTransaction tx = PaymentTransaction.builder()
                    .gateway(gateway)
                    .accountNumber(accountNumber)
                    .transferAmount(amount)
                    .content("(Trống nội dung CK)")
                    .transactionDate(dateStr)
                    .status("UNMATCHED")
                    .note("Chuyển khoản thiếu nội dung CK")
                    .build();
            paymentTransactionRepository.save(tx);

            return Map.of(
                    "success", false,
                    "message", "Webhook thiếu nội dung CK. Đã lưu vào danh sách 'Giao dịch lỗi' trên Admin.",
                    "status", "UNMATCHED",
                    "error", true
            );
        }

        String contentUpper = content.toUpperCase();
        log.info("==> [SePay Webhook] Dang tim don dat phong PENDING khop voi noi dung CK: {}", contentUpper);

        List<Booking> pendingBookings = bookingRepository.findByStatus("PENDING");
        Booking matchedBooking = null;

        for (Booking b : pendingBookings) {
            String shortId = b.getId().toString().substring(0, 8).toUpperCase();
            String fullId = b.getId().toString().toUpperCase();
            if (contentUpper.contains(shortId) || contentUpper.contains(fullId)) {
                matchedBooking = b;
                break;
            }
        }

        if (matchedBooking == null) {
            log.warn("==> [SePay Webhook] Khong tim thay don PENDING nao khop voi noi dung CK: {}", contentUpper);
            PaymentTransaction tx = PaymentTransaction.builder()
                    .gateway(gateway)
                    .accountNumber(accountNumber)
                    .transferAmount(amount)
                    .content(content)
                    .transactionDate(dateStr)
                    .status("UNMATCHED")
                    .note("Chuyển khoản sai cú pháp hoặc không tìm thấy mã đơn phòng PENDING tương ứng")
                    .build();
            paymentTransactionRepository.save(tx);

            return Map.of(
                    "success", false,
                    "message", "⚠️ Chuyển khoản sai cú pháp hoặc không tìm thấy đơn PENDING. Đã lưu vào danh sách 'Giao dịch lỗi' trên trang Admin để kiểm tra thủ công.",
                    "status", "UNMATCHED",
                    "transactionId", tx.getId(),
                    "error", true
            );
        }

        matchedBooking.setStatus("CONFIRMED");
        bookingRepository.save(matchedBooking);

        PaymentTransaction tx = PaymentTransaction.builder()
                .gateway(gateway)
                .accountNumber(accountNumber)
                .transferAmount(amount)
                .content(content)
                .transactionDate(dateStr)
                .status("MATCHED")
                .matchedBookingId(matchedBooking.getId())
                .note("Tự động khớp thành công theo mã Booking #" + matchedBooking.getId().toString().substring(0, 8).toUpperCase())
                .build();
        paymentTransactionRepository.save(tx);

        log.info("==> [SePay Webhook] Da xac nhan thanh toan thanh cong cho booking: {} (Khop theo shortId: {})",
                matchedBooking.getId(), matchedBooking.getId().toString().substring(0, 8).toUpperCase());

        return Map.of(
                "success", true,
                "message", "✅ [SePay Webhook] Đã xác nhận chuyển khoản & duyệt Booking: " + matchedBooking.getId(),
                "bookingId", matchedBooking.getId(),
                "status", "CONFIRMED"
        );
    }

    @Transactional
    public Map<String, Object> createDemoUnmatchedTransaction(Map<String, Object> body) {
        BigDecimal amount = BigDecimal.valueOf(1500000);
        String content = "Thanh toan tien phong (Khach nhap sai cu phap)";
        if (body != null) {
            if (body.get("amount") != null) {
                try { amount = new BigDecimal(body.get("amount").toString()); } catch (Exception ignored) {}
            }
            if (body.get("content") != null) {
                content = body.get("content").toString();
            }
        }

        PaymentTransaction tx = PaymentTransaction.builder()
                .gateway("VietinBank")
                .accountNumber("108879632507")
                .transferAmount(amount)
                .content(content)
                .transactionDate(OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .status("UNMATCHED")
                .note("⚡ [Demo Đồ Án] Giả lập khách hàng chuyển khoản sai cú pháp")
                .build();
        paymentTransactionRepository.save(tx);

        log.info("==> [Demo Unmatched] Da tao giao dich sai cu phap ID: {}", tx.getId());

        return Map.of(
                "success", true,
                "message", "🧪 Đã giả lập 1 giao dịch CHUYỂN KHOẢN SAI CÚ PHÁP vào danh sách Admin!",
                "transactionId", tx.getId(),
                "status", "UNMATCHED"
        );
    }
}
