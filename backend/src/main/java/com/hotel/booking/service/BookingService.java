package com.hotel.booking.service;

import com.hotel.booking.dto.BookingRequest;
import com.hotel.booking.dto.BookingResponse;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Booking;
import com.hotel.booking.model.Profile;
import com.hotel.booking.model.Room;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.ProfileRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final ProfileRepository profileRepository;

    /**
     * Tao mot booking moi.
     * Logic:
     *  1. Kiem tra ngay hop le.
     *  2. Tim RoomType theo ID.
     *  3. Tim phong vat ly (Room) con trong trong khoang ngay yeu cau.
     *  4. Tinh tong tien = gia co ban * so dem.
     *  5. Luu Booking vao DB.
     */
    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userId) {
        // 1. Kiem tra ngay check-out phai sau check-in
        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new IllegalArgumentException("Ngay check-out phai sau ngay check-in.");
        }

        // 2. Tim RoomType
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Loai phong khong ton tai: " + request.getRoomTypeId()));

        // 3. Tim mot phong vat ly con trong
        List<Room> availableRooms = roomRepository.findAvailableRooms(
                request.getRoomTypeId(),
                request.getCheckInDate(),
                request.getCheckOutDate()
        );

        if (availableRooms.isEmpty()) {
            throw new IllegalStateException("Khong con phong trong trong khoang thoi gian " +
                    request.getCheckInDate() + " - " + request.getCheckOutDate() + ".");
        }
        Room selectedRoom = availableRooms.get(0); // Lay phong dau tien con trong

        // 4. Lay thong tin profile nguoi dung
        Profile userProfile = profileRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay profile nguoi dung."));

        // 5. Tinh so dem va tong tien
        long numNights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        BigDecimal totalAmount = BigDecimal.valueOf(roomType.getBasePrice()).multiply(BigDecimal.valueOf(numNights));

        // 6. Tao va luu Booking
        Booking booking = new Booking();
        booking.setUser(userProfile);
        booking.setRoom(selectedRoom);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setTotalAmount(totalAmount);
        booking.setNumAdults(request.getNumAdults());
        booking.setNumChildren(request.getNumChildren() != null ? request.getNumChildren() : 0);
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setStatus("PENDING");

        Booking saved = bookingRepository.save(booking);
        log.info("Booking moi duoc tao: {} cho user: {}", saved.getId(), userId);

        return toResponse(saved, (int) numNights);
    }

    /**
     * Lay danh sach tat ca booking cua user hien tai.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(UUID.fromString(userId));
        return bookings.stream()
                .map(b -> {
                    long nights = ChronoUnit.DAYS.between(b.getCheckInDate(), b.getCheckOutDate());
                    return toResponse(b, (int) nights);
                })
                .collect(Collectors.toList());
    }

    /**
     * Chuyen doi Booking entity sang BookingResponse DTO.
     */
    private BookingResponse toResponse(Booking booking, int numNights) {
        return BookingResponse.builder()
                .bookingId(booking.getId())
                .status(booking.getStatus())
                .roomNumber(booking.getRoom().getRoomNumber())
                .roomTypeName(booking.getRoom().getRoomType().getName())
                .hotelName(booking.getRoom().getRoomType().getHotel().getName())
                .hotelCity(booking.getRoom().getRoomType().getHotel().getCity())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .numNights(numNights)
                .numAdults(booking.getNumAdults())
                .numChildren(booking.getNumChildren())
                .totalAmount(booking.getTotalAmount())
                .specialRequests(booking.getSpecialRequests())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
