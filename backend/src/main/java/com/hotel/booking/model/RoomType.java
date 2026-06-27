package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Entity anh xa voi bang room_types trong database.
 */
@Entity
@Table(name = "room_types")
@Getter
@Setter
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(nullable = false)
    private String name;

    @Column(name = "base_price", nullable = false)
    private Double basePrice;

    @Column(name = "capacity_adults", nullable = false)
    private Integer capacityAdults;

    @Column(name = "capacity_children", nullable = false)
    private Integer capacityChildren;

    @Column(name = "area_sqm")
    private Double areaSqm;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "amenities", columnDefinition = "text[]")
    private List<String> amenities;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "images", columnDefinition = "text[]")
    private List<String> images;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
