package com.hotel.booking.service;

import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;

    /**
     * Tim kiem va loc cac loai phong theo tieu chi.
     */
    public List<RoomType> searchRoomTypes(String city, Double minPrice, Double maxPrice, Integer capacity, String keyword) {
        // Neu keyword co gia tri, trim de bo khoang trang thua
        String cleanKeyword = (keyword != null) ? keyword.trim() : null;
        String cleanCity = (city != null) ? city.trim() : null;
        
        return roomTypeRepository.searchRoomTypes(cleanCity, minPrice, maxPrice, capacity, cleanKeyword);
    }
}
