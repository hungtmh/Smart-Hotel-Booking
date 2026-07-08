package com.hotel.booking.controller;

import com.hotel.booking.dto.*;
import com.hotel.booking.model.Booking;
import com.hotel.booking.model.Hotel;
import com.hotel.booking.model.PaymentTransaction;
import com.hotel.booking.model.Room;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.PaymentTransactionRepository;
import com.hotel.booking.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller danh rieng cho Admin.
 * Tat ca API trong class nay deu yeu cau quyen ROLE_ADMIN (JWT co role = "ADMIN").
 * Base URL: /api/admin
 *
 * Bao gom:
 *   - Booking Management: xem tat ca, duyet/huy
 *   - Hotel CRUD
 *   - RoomType CRUD
 *   - Room CRUD
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminBookingService adminBookingService;
    private final AdminHotelService adminHotelService;
    private final AdminRoomTypeService adminRoomTypeService;
    private final AdminRoomService adminRoomService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BookingRepository bookingRepository;

    // ==============================
    // BOOKING MANAGEMENT
    // ==============================

    /**
     * Lay tat ca booking trong he thong (moi user).
     * GET /api/admin/bookings
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(adminBookingService.getAllBookings());
    }

    /**
     * Admin duyet hoac huy booking.
     * PATCH /api/admin/bookings/{id}/status
     * Body: { "status": "CONFIRMED" } hoac { "status": "CANCELLED" }
     */
    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Truong 'status' khong duoc de trong."));
        }
        BookingResponse updated = adminBookingService.updateBookingStatus(id, newStatus);
        return ResponseEntity.ok(updated);
    }

    // ==============================
    // HOTEL CRUD
    // ==============================

    /**
     * Lay danh sach tat ca khach san.
     * GET /api/admin/hotels
     */
    @GetMapping("/hotels")
    public ResponseEntity<List<Hotel>> getAllHotels() {
        return ResponseEntity.ok(adminHotelService.getAllHotels());
    }

    /**
     * Tao moi khach san.
     * POST /api/admin/hotels
     */
    @PostMapping("/hotels")
    public ResponseEntity<Hotel> createHotel(@RequestBody HotelRequest request) {
        Hotel created = adminHotelService.createHotel(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Cap nhat khach san theo ID.
     * PUT /api/admin/hotels/{id}
     */
    @PutMapping("/hotels/{id}")
    public ResponseEntity<Hotel> updateHotel(@PathVariable UUID id, @RequestBody HotelRequest request) {
        Hotel updated = adminHotelService.updateHotel(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Xoa khach san theo ID.
     * DELETE /api/admin/hotels/{id}
     */
    @DeleteMapping("/hotels/{id}")
    public ResponseEntity<Void> deleteHotel(@PathVariable UUID id) {
        adminHotelService.deleteHotel(id);
        return ResponseEntity.noContent().build();
    }

    // ==============================
    // ROOM TYPE CRUD
    // ==============================

    /**
     * Lay danh sach tat ca loai phong.
     * GET /api/admin/room-types
     */
    @GetMapping("/room-types")
    public ResponseEntity<List<RoomType>> getAllRoomTypes() {
        return ResponseEntity.ok(adminRoomTypeService.getAllRoomTypes());
    }

    /**
     * Tao moi loai phong.
     * POST /api/admin/room-types
     */
    @PostMapping("/room-types")
    public ResponseEntity<RoomType> createRoomType(@RequestBody RoomTypeRequest request) {
        RoomType created = adminRoomTypeService.createRoomType(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Cap nhat loai phong theo ID.
     * PUT /api/admin/room-types/{id}
     */
    @PutMapping("/room-types/{id}")
    public ResponseEntity<RoomType> updateRoomType(@PathVariable UUID id, @RequestBody RoomTypeRequest request) {
        RoomType updated = adminRoomTypeService.updateRoomType(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Xoa loai phong theo ID.
     * DELETE /api/admin/room-types/{id}
     */
    @DeleteMapping("/room-types/{id}")
    public ResponseEntity<Void> deleteRoomType(@PathVariable UUID id) {
        adminRoomTypeService.deleteRoomType(id);
        return ResponseEntity.noContent().build();
    }

    // ==============================
    // ROOM (PHYSICAL) CRUD
    // ==============================

    /**
     * Lay danh sach tat ca phong vat ly.
     * GET /api/admin/rooms
     */
    @GetMapping("/rooms")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(adminRoomService.getAllRooms());
    }

    /**
     * Tao moi phong vat ly.
     * POST /api/admin/rooms
     */
    @PostMapping("/rooms")
    public ResponseEntity<Room> createRoom(@RequestBody RoomRequest request) {
        Room created = adminRoomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Cap nhat phong vat ly theo ID.
     * PUT /api/admin/rooms/{id}
     */
    @PutMapping("/rooms/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable UUID id, @RequestBody RoomRequest request) {
        Room updated = adminRoomService.updateRoom(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Xoa phong vat ly theo ID.
     * DELETE /api/admin/rooms/{id}
     */
    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable UUID id) {
        adminRoomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }

    // ==============================
    // PAYMENT TRANSACTIONS (LOG / ERROR CONTROL)
    // ==============================

    /**
     * Lay danh sach tat ca giao dich thanh toan (Webhook tu SePay/Postman).
     * GET /api/admin/transactions
     */
    @GetMapping("/transactions")
    public ResponseEntity<List<PaymentTransaction>> getAllTransactions() {
        return ResponseEntity.ok(paymentTransactionRepository.findAllByOrderByCreatedAtDesc());
    }

    /**
     * Admin duyet thu cong 1 giao dich sai cu phap (UNMATCHED) va khop vao Booking.
     * POST /api/admin/transactions/{txId}/resolve/{bookingId}
     */
    @PostMapping("/transactions/{txId}/resolve/{bookingId}")
    public ResponseEntity<?> resolveTransaction(@PathVariable UUID txId, @PathVariable UUID bookingId) {
        Optional<PaymentTransaction> txOpt = paymentTransactionRepository.findById(txId);
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);

        if (txOpt.isEmpty() || bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Khong tim thay giao dich hoac don dat phong."));
        }

        PaymentTransaction tx = txOpt.get();
        Booking booking = bookingOpt.get();

        // 1. Duyet booking sang CONFIRMED
        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        // 2. Cap nhat giao dich sang MATCHED
        tx.setStatus("MATCHED");
        tx.setMatchedBookingId(booking.getId());
        tx.setNote("✅ Admin duyệt thủ công - Khớp với Booking #" + booking.getId().toString().substring(0, 8).toUpperCase());
        paymentTransactionRepository.save(tx);

        log.info("==> [Admin Resolve] Da duyet thu cong giao dich {} vao booking {}", txId, bookingId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "✅ Đã duyệt thủ công & khớp giao dịch vào Booking #" + booking.getId().toString().substring(0, 8).toUpperCase()
        ));
    }
}
