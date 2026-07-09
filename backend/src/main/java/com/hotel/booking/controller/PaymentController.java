package com.hotel.booking.controller;

import com.hotel.booking.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller xu ly thanh toan VietQR (SePay) & ByPass cho demo do an.
 * Tat ca cac API tai /api/public/payment khong yeu cau JWT (da duoc permitAll trong SecurityConfig).
 */
@RestController
@RequestMapping("/api/public/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 1. Kiem tra trang thai thanh toan cua booking.
     * Frontend se polling API nay moi 3 giay trong luc hien thi ma QR SePay.
     * URL: GET /api/public/payment/status/{bookingId}
     */
    @GetMapping("/status/{bookingId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable UUID bookingId) {
        Map<String, Object> result = paymentService.getPaymentStatus(bookingId);
        if (result.containsKey("error") && (Boolean) result.get("error")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 2. API ByPass nhanh bang Postman (Dinh cho do an / demo nhanh).
     * Khi goi API nay voi bookingId, he thong se tu dong chuyen trang thai sang CONFIRMED.
     * URL: POST /api/public/payment/confirm/{bookingId}
     */
    @PostMapping("/confirm/{bookingId}")
    public ResponseEntity<?> confirmPaymentDemo(@PathVariable UUID bookingId) {
        Map<String, Object> result = paymentService.confirmPaymentDemo(bookingId);
        if (result.containsKey("error") && (Boolean) result.get("error")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 3. API Gia lap Webhook tu SePay gui ve (Khi khach quet QR chuyen khoan that hoac gởi qua Postman).
     * URL: POST /api/public/payment/sepay-webhook
     */
    @PostMapping("/sepay-webhook")
    public ResponseEntity<?> receiveSePayWebhook(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = paymentService.processSePayWebhook(payload);
        if (result.containsKey("error") && (Boolean) result.get("error")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 4. API Gia lap co nguoi chuyen khoan SAI CU PHAP (Dinh cho demo Bao ve Do an).
     * URL: POST /api/public/payment/demo-unmatched
     */
    @PostMapping("/demo-unmatched")
    public ResponseEntity<?> createDemoUnmatchedTransaction(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> result = paymentService.createDemoUnmatchedTransaction(body);
        return ResponseEntity.ok(result);
    }
}
