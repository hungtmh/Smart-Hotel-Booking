package com.hotel.booking.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private String roomImage;
    private String roomDescription;
    private Double roomBasePrice;
    private Double areaSqm;
    private Integer capacityAdults;
    private Integer capacityChildren;
    private String hotelName;
    private String hotelCity;
    private String hotelImage;

    // Thong tin dat phong
    private LocalDateTime checkInDate;
    private LocalDateTime checkOutDate;
    private Integer numNights;
    private Integer numAdults;
    private Integer numChildren;
    private BigDecimal totalAmount;
    private String specialRequests;

    private OffsetDateTime createdAt;
}
