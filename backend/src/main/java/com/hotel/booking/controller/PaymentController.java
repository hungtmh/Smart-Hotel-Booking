package com.hotel.booking.controller;

import com.hotel.booking.model.Booking;
import com.hotel.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * Controller xu ly thanh toan VietQR (SePay) & ByPass cho demo do an.
 * Tat ca cac API tai /api/public/payment khong yeu cau JWT (da duoc permitAll trong SecurityConfig).
 */
@RestController
@RequestMapping("/api/public/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final BookingRepository bookingRepository;

    /**
     * 1. Kiem tra trang thai thanh toan cua booking.
     * Frontend se polling API nay moi 3 giay trong luc hien thi ma QR SePay.
     * URL: GET /api/public/payment/status/{bookingId}
     */
    @GetMapping("/status/{bookingId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable UUID bookingId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Khong tim thay booking voi ID: " + bookingId));
        }
        Booking booking = bookingOpt.get();
        boolean isPaid = "CONFIRMED".equalsIgnoreCase(booking.getStatus()) ||
                         "COMPLETED".equalsIgnoreCase(booking.getStatus());

        return ResponseEntity.ok(Map.of(
                "bookingId", booking.getId(),
                "status", booking.getStatus(),
                "isPaid", isPaid,
                "totalAmount", booking.getTotalAmount()
        ));
    }

    /**
     * 2. API ByPass nhanh bang Postman (Dinh cho do an / demo nhanh).
     * Khi goi API nay voi bookingId, he thong se tu dong chuyen trang thai sang CONFIRMED.
     * URL: POST /api/public/payment/confirm/{bookingId}
     */
    @PostMapping("/confirm/{bookingId}")
    public ResponseEntity<?> confirmPaymentDemo(@PathVariable UUID bookingId) {
        log.info("==> [Demo ByPass] Yeu cau xac nhan thanh toan nhanh cho bookingId: {}", bookingId);
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Khong tim thay booking voi ID: " + bookingId));
        }

        Booking booking = bookingOpt.get();
        if ("CONFIRMED".equalsIgnoreCase(booking.getStatus()) || "COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking nay da duoc thanh toan & xac nhan tu truoc.",
                    "bookingId", booking.getId(),
                    "status", booking.getStatus()
            ));
        }

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);
        log.info("==> [Demo ByPass] Da xac nhan thanh toan CONFIRMED cho booking: {}", bookingId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "🎉 [ByPass Đồ Án] Đã giả lập thanh toán & xác nhận thành công cho Booking: " + bookingId,
                "bookingId", booking.getId(),
                "status", "CONFIRMED"
        ));
    }

    /**
     * 3. API Gia lap Webhook tu SePay gui ve (Khi khach quet QR chuyen khoan that hoac gởi qua Postman).
     * URL: POST /api/public/payment/sepay-webhook
     * Body JSON vi du:
     * {
     *   "gateway": "MBBank",
     *   "transactionDate": "2026-07-05 22:30:00",
     *   "accountNumber": "0389999999",
     *   "content": "PAY 0AB3D809",
     *   "transferAmount": 1500000,
     *   "bookingId": "0ab3d809-..." (tuy chon)
     * }
     */
    @PostMapping("/sepay-webhook")
    public ResponseEntity<?> receiveSePayWebhook(@RequestBody Map<String, Object> payload) {
        log.info("==> [SePay Webhook] Nhan duoc webhook tu SePay / Postman: {}", payload);

        // 1. Kiem tra xem co bookingId truyen truc tiep trong body khong
        String bookingIdStr = (String) payload.get("bookingId");
        if (bookingIdStr != null && !bookingIdStr.isBlank()) {
            try {
                UUID bookingId = UUID.fromString(bookingIdStr);
                return confirmPaymentDemo(bookingId);
            } catch (Exception e) {
                log.warn("bookingId trong webhook khong dung dinh dang UUID: {}", bookingIdStr);
            }
        }

        // 2. Neu khong co bookingId, tim theo noi dung chuyen khoan (content / des / description)
        String content = (String) payload.getOrDefault("content",
                         payload.getOrDefault("des",
                         payload.getOrDefault("description", "")));
        
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Webhook thieu truong 'content' hoac 'bookingId' de nhan dien don dat phong."
            ));
        }

        String contentUpper = content.toUpperCase();
        log.info("==> [SePay Webhook] Dang tim don dat phong PENDING khop voi noi dung CK: {}", contentUpper);

        List<Booking> pendingBookings = bookingRepository.findByStatus("PENDING");
        Booking matchedBooking = null;

        for (Booking b : pendingBookings) {
            String shortId = b.getId().toString().substring(0, 8).toUpperCase();
            String fullId = b.getId().toString().toUpperCase();
            // Kiem tra noi dung CK co chua ma shortId hoac fullId khong
            if (contentUpper.contains(shortId) || contentUpper.contains(fullId)) {
                matchedBooking = b;
                break;
            }
        }

        if (matchedBooking == null) {
            log.warn("==> [SePay Webhook] Khong tim thay don PENDING nao khop voi noi dung CK: {}", contentUpper);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Khong tim thay don dat phong PENDING nao khop voi noi dung: " + content
            ));
        }

        // Xac nhan booking da tim thay
        matchedBooking.setStatus("CONFIRMED");
        bookingRepository.save(matchedBooking);
        log.info("==> [SePay Webhook] Da xac nhan thanh toan thanh cong cho booking: {} (Khop theo shortId: {})",
                matchedBooking.getId(), matchedBooking.getId().toString().substring(0, 8).toUpperCase());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ [SePay Webhook] Đã xác nhận chuyển khoản & duyệt Booking: " + matchedBooking.getId(),
                "bookingId", matchedBooking.getId(),
                "status", "CONFIRMED"
        ));
    }
}
