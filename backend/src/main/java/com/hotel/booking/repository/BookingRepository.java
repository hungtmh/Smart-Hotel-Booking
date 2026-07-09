package com.hotel.booking.repository;

import com.hotel.booking.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    /**
     * Lay danh sach booking cua mot user, sap xep theo ngay tao moi nhat.
     */
    List<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Admin: Lay tat ca booking, sap xep theo ngay tao moi nhat.
     */
    List<Booking> findAllByOrderByCreatedAtDesc();

    /**
     * Scheduler: Tim cac booking da het han (checkOutDate <= today) nhung chua COMPLETED/CANCELLED.
     * Se duoc tu dong chuyen sang COMPLETED.
     */
    @Query("SELECT b FROM Booking b WHERE b.checkOutDate <= :today AND b.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Booking> findExpiredBookings(@Param("today") LocalDateTime today);

    /**
     * Tim danh sach booking theo trang thai (VD: PENDING).
     */
    List<Booking> findByStatus(String status);

    /**
     * Cap nhat trang thai booking truc tiep bang JPQL (tranh viec load entity day du).
     * Chi cap nhat khi user_id khop va trang thai hien tai la PENDING.
     */
    @Modifying
    @Query("UPDATE Booking b SET b.status = :newStatus WHERE b.id = :bookingId AND b.user.id = :userId AND b.status = 'PENDING'")
    int updatePendingBookingStatus(@Param("bookingId") UUID bookingId, @Param("userId") UUID userId, @Param("newStatus") String newStatus);
}
