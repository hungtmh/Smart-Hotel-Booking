package com.hotel.booking.repository;

import com.hotel.booking.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, UUID> {
}
