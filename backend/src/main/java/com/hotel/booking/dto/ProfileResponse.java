package com.hotel.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO tra ve thong tin profile cua user dang nhap hien tai.
 * Tach biet hoan toan voi entity Profile de bao mat cau truc database.
 */
@Data
@AllArgsConstructor
public class ProfileResponse {
    private String id;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private String role;
    private String loyaltyTier;
    private Integer loyaltyPoints;
}
