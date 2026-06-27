package com.hotel.booking.repository;

import com.hotel.booking.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, UUID> {

    @Query("SELECT rt FROM RoomType rt JOIN rt.hotel h WHERE " +
           "(cast(:city as string) IS NULL OR :city = '' OR LOWER(h.city) = LOWER(:city)) AND " +
           "(cast(:minPrice as double) IS NULL OR rt.basePrice >= :minPrice) AND " +
           "(cast(:maxPrice as double) IS NULL OR rt.basePrice <= :maxPrice) AND " +
           "(cast(:capacity as integer) IS NULL OR (rt.capacityAdults + rt.capacityChildren) >= :capacity) AND " +
           "(cast(:keyword as string) IS NULL OR :keyword = '' OR LOWER(rt.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(h.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(rt.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<RoomType> searchRoomTypes(
            @Param("city") String city,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("capacity") Integer capacity,
            @Param("keyword") String keyword
    );
}
