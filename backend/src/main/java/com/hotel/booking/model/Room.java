package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity anh xa voi bang rooms (phong vat ly cu the).
 * Moi phong thuoc mot RoomType va co so phong rieng (101, 201...).
 */
@Entity
@Table(name = "rooms")
@Getter
@Setter
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    private Integer floor;

    // AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE
    @Column(nullable = false)
    private String status = "AVAILABLE";

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
