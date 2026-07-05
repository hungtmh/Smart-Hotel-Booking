package com.hotel.booking.service;

import com.hotel.booking.dto.BookingRequest;
import com.hotel.booking.dto.BookingResponse;
import com.hotel.booking.model.Booking;
import com.hotel.booking.model.Hotel;
import com.hotel.booking.model.Profile;
import com.hotel.booking.model.Room;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.BookingRepository;
import com.hotel.booking.repository.ProfileRepository;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.RoomTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomTypeRepository roomTypeRepository;

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBooking_translatesPostgresOverlapConstraintToBusinessError() {
        UUID userId = UUID.randomUUID();
        UUID roomTypeId = UUID.randomUUID();
        RoomType roomType = roomType(roomTypeId);
        Room room = room(roomType);
        BookingRequest request = bookingRequest(roomTypeId);
        DataIntegrityViolationException overlap = new DataIntegrityViolationException(
                "ERROR: conflicting key value violates exclusion constraint \"booking_no_room_overlap\"");

        when(roomTypeRepository.findById(roomTypeId)).thenReturn(Optional.of(roomType));
        when(roomRepository.findAvailableRooms(roomTypeId, request.getCheckInDate(), request.getCheckOutDate()))
                .thenReturn(List.of(room));
        when(profileRepository.findById(userId)).thenReturn(Optional.of(profile(userId)));
        when(bookingRepository.saveAndFlush(any())).thenThrow(overlap);

        assertThatThrownBy(() -> bookingService.createBooking(request, userId.toString()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Phong vua duoc dat boi nguoi khac. Vui long thu lai.")
                .hasCause(overlap);
    }

    @Test
    void createBooking_rejectsCheckoutOnSameDateAsCheckin() {
        UUID roomTypeId = UUID.randomUUID();
        BookingRequest request = bookingRequest(roomTypeId);
        LocalDateTime checkIn = LocalDateTime.now().plusDays(10).withHour(10).withMinute(0).withSecond(0).withNano(0);
        request.setCheckInDate(checkIn);
        request.setCheckOutDate(checkIn.withHour(15));

        assertThatThrownBy(() -> bookingService.createBooking(request, UUID.randomUUID().toString()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ngay check-out phai sau ngay check-in.");
    }

    @Test
    void createBooking_billsOneNightWhenCheckoutBeforeNoonOnNextDay() {
        LocalDateTime checkIn = LocalDateTime.now().plusDays(10).withHour(16).withMinute(0).withSecond(0).withNano(0);
        BookingResponse response = createSuccessfulBooking(
                checkIn,
                checkIn.plusDays(1).withHour(9));

        assertThat(response.getNumNights()).isEqualTo(1);
    }

    @Test
    void createBooking_billsExtraNightWhenCheckoutAfterNoon() {
        LocalDateTime checkIn = LocalDateTime.now().plusDays(10).withHour(16).withMinute(0).withSecond(0).withNano(0);
        BookingResponse response = createSuccessfulBooking(
                checkIn,
                checkIn.plusDays(1).withHour(14));

        assertThat(response.getNumNights()).isEqualTo(2);
    }

    private BookingResponse createSuccessfulBooking(LocalDateTime checkInDate, LocalDateTime checkOutDate) {
        UUID userId = UUID.randomUUID();
        UUID roomTypeId = UUID.randomUUID();
        RoomType roomType = roomType(roomTypeId);
        Room room = room(roomType);
        BookingRequest request = bookingRequest(roomTypeId);
        request.setCheckInDate(checkInDate);
        request.setCheckOutDate(checkOutDate);

        when(roomTypeRepository.findById(roomTypeId)).thenReturn(Optional.of(roomType));
        when(roomRepository.findAvailableRooms(roomTypeId, request.getCheckInDate(), request.getCheckOutDate()))
                .thenReturn(List.of(room));
        when(profileRepository.findById(userId)).thenReturn(Optional.of(profile(userId)));
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            ReflectionTestUtils.setField(booking, "id", UUID.randomUUID());
            return booking;
        });

        return bookingService.createBooking(request, userId.toString());
    }

    private BookingRequest bookingRequest(UUID roomTypeId) {
        BookingRequest request = new BookingRequest();
        request.setRoomTypeId(roomTypeId);
        request.setCheckInDate(LocalDateTime.now().plusDays(10).withHour(14).withMinute(0));
        request.setCheckOutDate(LocalDateTime.now().plusDays(12).withHour(11).withMinute(0));
        request.setNumAdults(2);
        request.setNumChildren(0);
        return request;
    }

    private Profile profile(UUID userId) {
        Profile profile = new Profile();
        profile.setId(userId);
        profile.setFullName("Test User");
        return profile;
    }

    private Room room(RoomType roomType) {
        Room room = new Room();
        ReflectionTestUtils.setField(room, "id", UUID.randomUUID());
        room.setRoomType(roomType);
        room.setRoomNumber("101");
        room.setStatus("AVAILABLE");
        return room;
    }

    private RoomType roomType(UUID roomTypeId) {
        Hotel hotel = new Hotel();
        ReflectionTestUtils.setField(hotel, "id", UUID.randomUUID());
        hotel.setName("Smart Hotel");
        hotel.setCity("Da Nang");

        RoomType roomType = new RoomType();
        ReflectionTestUtils.setField(roomType, "id", roomTypeId);
        roomType.setName("Deluxe");
        roomType.setBasePrice(2500000.0);
        roomType.setHotel(hotel);
        return roomType;
    }
}
