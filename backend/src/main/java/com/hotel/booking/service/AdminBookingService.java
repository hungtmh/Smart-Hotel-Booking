package com.hotel.booking.service;

import com.hotel.booking.dto.BookingResponse;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Booking;
import com.hotel.booking.model.Hotel;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xu ly cac nghiep vu Booking danh rieng cho Admin:
 * - Lay tat ca bookings (moi user)
 * - Duyet hoac huy booking
 * - Tu dong chuyen booking het han sang COMPLETED (goi boi Scheduler)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminBookingService {

    private final BookingRepository bookingRepository;

    /**
     * Lay danh sach tat ca booking trong he thong (moi user), sap xep theo ngay tao moi nhat.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin cap nhat trang thai cua mot booking (CONFIRMED, CANCELLED, COMPLETED...).
     *
     * @param bookingId ID cua booking can cap nhat
     * @param newStatus Trang thai moi (CONFIRMED, CANCELLED, COMPLETED, PENDING)
     * @return BookingResponse sau khi da cap nhat
     */
    @Transactional
    public BookingResponse updateBookingStatus(UUID bookingId, String newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay booking: " + bookingId));

        String oldStatus = booking.getStatus();
        booking.setStatus(newStatus.toUpperCase());
        Booking saved = bookingRepository.save(booking);
        log.info("Admin cap nhat booking {} tu {} sang {}", bookingId, oldStatus, newStatus);
        return toResponse(saved);
    }

    /**
     * Duoc goi boi BookingScheduler moi ngay luc 2:00 AM.
     * Tim tat ca booking da qua ngay check-out nhung chua COMPLETED/CANCELLED,
     * tu dong chuyen sang COMPLETED.
     */
    @Transactional
    public void autoCompleteExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expired = bookingRepository.findExpiredBookings(now);
        if (expired.isEmpty()) {
            log.info("Scheduler: Khong co booking nao can chuyen trang thai.");
            return;
        }
        expired.forEach(b -> b.setStatus("COMPLETED"));
        bookingRepository.saveAll(expired);
        log.info("Scheduler: Da tu dong chuyen {} booking sang COMPLETED (checkOutDate <= {}).",
                expired.size(), now);
    }

    private BookingResponse toResponse(Booking booking) {
        long nights = calculateBillableNights(booking);
        RoomType roomType = booking.getRoom().getRoomType();
        return BookingResponse.builder()
                .bookingId(booking.getId())
                .status(booking.getStatus())
                .roomNumber(booking.getRoom().getRoomNumber())
                .roomTypeName(roomType.getName())
                .roomImage(firstImage(roomType))
                .roomDescription(roomType.getDescription())
                .roomBasePrice(roomType.getBasePrice())
                .areaSqm(roomType.getAreaSqm())
                .capacityAdults(roomType.getCapacityAdults())
                .capacityChildren(roomType.getCapacityChildren())
                .hotelName(roomType.getHotel().getName())
                .hotelCity(roomType.getHotel().getCity())
                .hotelImage(firstHotelImage(roomType.getHotel()))
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .numNights((int) nights)
                .numAdults(booking.getNumAdults())
                .numChildren(booking.getNumChildren())
                .totalAmount(booking.getTotalAmount())
                .specialRequests(booking.getSpecialRequests())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private String firstImage(RoomType roomType) {
        if (roomType.getImages() == null || roomType.getImages().isEmpty()) {
            return null;
        }
        return roomType.getImages().get(0);
    }

    private String firstHotelImage(Hotel hotel) {
        if (hotel.getImages() == null || hotel.getImages().isEmpty()) {
            return null;
        }
        return hotel.getImages().get(0);
    }

    private long calculateBillableNights(Booking booking) {
        long nights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate());
        if (booking.getCheckOutDate().toLocalTime().isAfter(LocalTime.NOON)) {
            nights++;
        }
        return Math.max(1, nights);
    }
}
