package com.hotel.booking.repository;

import com.hotel.booking.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    /**
     * Tim cac phong vat ly cua mot RoomType khong bi trung lich voi khoang thoi gian yeu cau.
     * Mot phong la "trong" neu tat ca cac booking hien tai cua no:
     *   - da ket thuc truoc check_in_date YEU CAU, HOAC
     *   - bat dau sau check_out_date YEU CAU
     * va phong do co status = 'AVAILABLE'.
     */
    @Query("SELECT r FROM Room r WHERE r.roomType.id = :roomTypeId " +
           "AND r.status = 'AVAILABLE' " +
           "AND r.id NOT IN (" +
           "  SELECT b.room.id FROM Booking b " +
           "  WHERE b.status NOT IN ('CANCELLED') " +
           "  AND b.checkInDate < :checkOutDate " +
           "  AND b.checkOutDate > :checkInDate" +
           ")")
    List<Room> findAvailableRooms(
            @Param("roomTypeId") UUID roomTypeId,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate
    );
}
