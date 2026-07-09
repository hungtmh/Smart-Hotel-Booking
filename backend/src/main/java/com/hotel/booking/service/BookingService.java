package com.hotel.booking.service;

import com.hotel.booking.dto.BookingRequest;
import com.hotel.booking.dto.BookingResponse;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Booking;
import com.hotel.booking.model.Hotel;
import com.hotel.booking.model.Profile;
import com.hotel.booking.model.Room;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.ProfileRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
     * 1. Kiem tra ngay hop le.
     * 2. Tim RoomType theo ID.
     * 3. Tim phong vat ly (Room) con trong trong khoang ngay yeu cau.
     * 4. Tinh tong tien = gia co ban * so dem.
     * 5. Luu Booking vao DB.
     */
    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userId) {
        // 1. Kiem tra thoi diem check-in/check-out hop le
        if (!request.getCheckInDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Thoi diem check-in phai o trong tuong lai.");
        }
        if (!request.getCheckOutDate().toLocalDate().isAfter(request.getCheckInDate().toLocalDate())) {
            throw new IllegalArgumentException("Ngay check-out phai sau ngay check-in (khong duoc trung ngay).");
        }

        // 2. Tim RoomType
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Loai phong khong ton tai: " + request.getRoomTypeId()));

        // 3. Tim mot phong vat ly con trong
        List<Room> availableRooms = roomRepository.findAvailableRooms(
                request.getRoomTypeId(),
                request.getCheckInDate(),
                request.getCheckOutDate());

        if (availableRooms.isEmpty()) {
            throw new IllegalStateException("Khong con phong trong trong khoang thoi gian " +
                    request.getCheckInDate() + " - " + request.getCheckOutDate() + ".");
        }
        Room selectedRoom = availableRooms.get(0); // Lay phong dau tien con trong

        // 4. Lay thong tin profile nguoi dung
        Profile userProfile = profileRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay profile nguoi dung."));

        // 5. Tinh so dem va tong tien
        long numNights = calculateBillableNights(request.getCheckInDate(), request.getCheckOutDate());
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

        Booking saved;
        try {
            saved = bookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException ex) {
            if (isRoomOverlapConstraintViolation(ex)) {
                throw new IllegalStateException("Phong vua duoc dat boi nguoi khac. Vui long thu lai.", ex);
            }
            throw ex;
        }
        log.info("Booking moi duoc tao: {} cho user: {}", saved.getId(), userId);

        return toResponse(saved, (int) numNights);
    }

    /**
     * User tu huy booking cua chinh minh (chi duoc huy khi PENDING).
     * Dung JPQL UPDATE truc tiep de tranh cac van de ve lazy loading va RLS.
     */
    @Transactional
    public void cancelMyBooking(UUID bookingId, String userId) {
        UUID userUUID;
        try {
            userUUID = UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("User ID khong hop le.");
        }

        // Kiem tra booking ton tai va thuoc ve user truoc
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay booking: " + bookingId));

        if (!booking.getUser().getId().equals(userUUID)) {
            throw new IllegalStateException("Khong co quyen huy booking nay.");
        }

        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Chi co the huy booking dang o trang thai PENDING.");
        }

        // Dung JPQL UPDATE truc tiep de cap nhat trang thai
        int updated = bookingRepository.updatePendingBookingStatus(bookingId, userUUID, "CANCELLED");
        if (updated == 0) {
            throw new IllegalStateException("Khong the huy booking. Vui long thu lai.");
        }
        log.info("User {} da huy booking: {}", userId, bookingId);
    }

    /**
     * Lay danh sach tat ca booking cua user hien tai.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(UUID.fromString(userId));
        return bookings.stream()
                .map(b -> {
                    long nights = calculateBillableNights(b.getCheckInDate(), b.getCheckOutDate());
                    return toResponse(b, (int) nights);
                })
                .collect(Collectors.toList());
    }

    /**
     * Chuyen doi Booking entity sang BookingResponse DTO.
     */
    private BookingResponse toResponse(Booking booking, int numNights) {
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
                .numNights(numNights)
                .numAdults(booking.getNumAdults())
                .numChildren(booking.getNumChildren())
                .totalAmount(booking.getTotalAmount())
                .specialRequests(booking.getSpecialRequests())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private String firstImage(RoomType roomType) {
        if (roomType.getImages() == null || roomType.getImages().isEmpty()) {
            log.info("RoomType {} không có ảnh", roomType.getName());
            return null;
        }

        String image = roomType.getImages().get(0);

        log.info(
                "RoomType id: {}, name: {}, first image: {}",
                roomType.getId(),
                roomType.getName(),
                image);

        return image;
    }

    private String firstHotelImage(Hotel hotel) {
        if (hotel.getImages() == null || hotel.getImages().isEmpty()) {
            return null;
        }
        return hotel.getImages().get(0);
    }

    private boolean isRoomOverlapConstraintViolation(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.contains("booking_no_room_overlap")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private long calculateBillableNights(LocalDateTime checkInDate, LocalDateTime checkOutDate) {
        long nights = ChronoUnit.DAYS.between(checkInDate.toLocalDate(), checkOutDate.toLocalDate());
        if (checkOutDate.toLocalTime().isAfter(LocalTime.NOON)) {
            nights++;
        }
        return Math.max(1, nights);
    }
}
