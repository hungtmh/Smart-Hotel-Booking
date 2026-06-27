package com.hotel.booking.repository;

import com.hotel.booking.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository truy xuat du lieu cho bang profiles.
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    
    @Query(value = "SELECT p.role FROM profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = :email", nativeQuery = true)
    Optional<String> findRoleByEmail(@Param("email") String email);
}
