package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity anh xa voi bang bookings.
 * Luu tru giao dich dat phong cua nguoi dung.
 */
@Entity
@Table(name = "bookings")
@Getter
@Setter
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // Lien ket toi profiles (nguoi dat phong)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Profile user;

    // Lien ket toi rooms (phong vat ly duoc dat)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "num_adults", nullable = false)
    private Integer numAdults = 1;

    @Column(name = "num_children", nullable = false)
    private Integer numChildren = 0;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    // PENDING, CONFIRMED, CANCELLED, COMPLETED
    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
