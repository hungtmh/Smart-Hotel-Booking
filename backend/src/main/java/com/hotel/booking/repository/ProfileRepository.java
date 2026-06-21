package com.hotel.booking.repository;

import com.hotel.booking.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

/**
 * Repository truy xuat du lieu cho bang profiles.
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    // Ke thua cac phuong thuc CRUD tu JpaRepository: findById, save, deleteById...
}
