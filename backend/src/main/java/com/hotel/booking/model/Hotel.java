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
 * Entity anh xa voi bang hotels trong database.
 */
@Entity
@Table(name = "hotels")
@Getter
@Setter
public class Hotel {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String country = "Vietnam";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "star_rating")
    private Integer starRating;

    private String phone;
    private String email;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "images", columnDefinition = "text[]")
    private List<String> images;

    private Double latitude;
    private Double longitude;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
