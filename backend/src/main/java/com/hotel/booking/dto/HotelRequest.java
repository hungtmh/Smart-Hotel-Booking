package com.hotel.booking.dto;

import lombok.Data;
import java.util.List;

/**
 * DTO nhan du lieu tu form khi Admin tao moi hoac chinh sua Khach San.
 */
@Data
public class HotelRequest {
    private String name;
    private String address;
    private String city;
    private String country = "Vietnam";
    private String description;
    private Integer starRating;
    private String phone;
    private String email;
    private List<String> images;
    private Double latitude;
    private Double longitude;
}
