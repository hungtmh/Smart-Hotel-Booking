package com.hotel.booking.dto;

import lombok.Data;
import java.util.UUID;

/**
 * DTO nhan du lieu tu form khi Admin tao moi hoac chinh sua Phong Vat Ly.
 */
@Data
public class RoomRequest {
    private UUID roomTypeId;    // Phong nay thuoc loai phong nao
    private String roomNumber;  // So phong (vd: "101", "302")
    private Integer floor;      // Tang
    private String status;      // AVAILABLE, MAINTENANCE, CLEANING
}
