package com.hotel.booking.controller;

import com.hotel.booking.model.RoomType;
import com.hotel.booking.service.RoomTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller xu ly cac yeu cau ve Phong/Loai phong.
 * API nay can JWT de truy cap (do cau hinh SecurityConfig.java chan tat ca request khac ngoai public).
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    /**
     * API tim kiem phong co bo loc va tu khoa.
     * URL: GET /api/rooms/search
     */
    @GetMapping("/search")
    public ResponseEntity<List<RoomType>> searchRooms(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String keyword
    ) {
        List<RoomType> rooms = roomTypeService.searchRoomTypes(city, minPrice, maxPrice, capacity, keyword);
        return ResponseEntity.ok(rooms);
    }
}
