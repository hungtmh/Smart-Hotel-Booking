package com.hotel.booking.controller;

import com.hotel.booking.dto.BookingRequest;
import com.hotel.booking.dto.BookingResponse;
import com.hotel.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller xu ly cac yeu cau lien quan den dat phong.
 * Tat ca API can JWT xac thuc.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Tao booking moi.
     * URL: POST /api/bookings
     * Body: BookingRequest JSON
     */
    @PostMapping
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication) {
        try {
            String userId = authentication.getName(); // userId tu JWT subject
            BookingResponse response = bookingService.createBooking(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            // Loi nghiep vu: ngay sai, khong con phong trong
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * Lay danh sach booking cua user dang dang nhap.
     * URL: GET /api/bookings/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        String userId = authentication.getName();
        List<BookingResponse> bookings = bookingService.getMyBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * User tu huy booking cua chinh minh (chi duoc huy khi o trang thai PENDING).
     * URL: DELETE /api/bookings/{id}/cancel
     */
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<?> cancelMyBooking(@PathVariable UUID id, Authentication authentication) {
        try {
            String userId = authentication.getName();
            bookingService.cancelMyBooking(id, userId);
            return ResponseEntity.ok(Map.of("message", "Booking da duoc huy thanh cong."));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }
}

