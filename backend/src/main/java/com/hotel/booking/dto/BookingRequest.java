package com.hotel.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO nhan du lieu dat phong tu Frontend.
 */
@Data
public class BookingRequest {

    @NotNull(message = "roomTypeId la bat buoc")
    private UUID roomTypeId;

    @NotNull(message = "checkInDate la bat buoc")
    private LocalDateTime checkInDate;

    @NotNull(message = "checkOutDate la bat buoc")
    private LocalDateTime checkOutDate;

    @Min(value = 1, message = "Phai co it nhat 1 nguoi lon")
    private Integer numAdults = 1;

    @Min(value = 0, message = "So tre em khong duoc am")
    private Integer numChildren = 0;

    private String specialRequests;
}
