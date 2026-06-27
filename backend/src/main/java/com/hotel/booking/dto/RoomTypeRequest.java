package com.hotel.booking.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

/**
 * DTO nhan du lieu tu form khi Admin tao moi hoac chinh sua Loai Phong.
 */
@Data
public class RoomTypeRequest {
    private UUID hotelId;       // Loai phong nay thuoc khach san nao
    private String name;
    private Double basePrice;
    private Integer capacityAdults;
    private Integer capacityChildren;
    private Double areaSqm;
    private String description;
    private List<String> amenities;
    private List<String> images;
}
