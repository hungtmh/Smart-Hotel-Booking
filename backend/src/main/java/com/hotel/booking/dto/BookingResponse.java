package com.hotel.booking.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO tra ve thong tin dat phong cho Frontend.
 * Chua du thong tin de hien thi: ma booking, ten phong, ten khach san, ngay, gia, trang thai.
 */
@Data
@Builder
public class BookingResponse {
    private UUID bookingId;
    private String status;

    // Thong tin phong
    private String roomNumber;
    private String roomTypeName;
    private String hotelName;
    private String hotelCity;

    // Thong tin dat phong
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer numNights;
    private Integer numAdults;
    private Integer numChildren;
    private BigDecimal totalAmount;
    private String specialRequests;

    private OffsetDateTime createdAt;
}
