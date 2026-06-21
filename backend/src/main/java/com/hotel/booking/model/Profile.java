package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity anh xa voi bang profiles trong Supabase PostgreSQL.
 * Luu tru ho so nguoi dung: vai tro (ADMIN/USER), hang the thanh vien, diem thuong.
 */
@Entity
@Table(name = "profiles")
@Getter
@Setter
public class Profile {

    @Id
    private UUID id; // Trung voi auth.users.id cua Supabase, khong tu dong sinh

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    private String role = "USER"; // USER hoac ADMIN

    @Column(name = "loyalty_tier", nullable = false)
    private String loyaltyTier = "MEMBER"; // MEMBER, SILVER, GOLD, PLATINUM

    @Column(name = "loyalty_points", nullable = false)
    private Integer loyaltyPoints = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
