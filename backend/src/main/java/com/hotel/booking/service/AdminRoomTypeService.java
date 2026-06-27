package com.hotel.booking.service;

import com.hotel.booking.dto.RoomTypeRequest;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Hotel;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.HotelRepository;
import com.hotel.booking.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service xu ly cac nghiep vu CRUD Loai Phong danh rieng cho Admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final HotelRepository hotelRepository;

    /**
     * Lay danh sach tat ca loai phong (co the loc theo hotel).
     */
    @Transactional(readOnly = true)
    public List<RoomType> getAllRoomTypes() {
        return roomTypeRepository.findAll();
    }

    /**
     * Tao moi mot loai phong thuoc khach san chi dinh.
     */
    @Transactional
    public RoomType createRoomType(RoomTypeRequest request) {
        Hotel hotel = hotelRepository.findById(request.getHotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay khach san: " + request.getHotelId()));

        RoomType roomType = new RoomType();
        roomType.setHotel(hotel);
        mapRequestToRoomType(request, roomType);
        RoomType saved = roomTypeRepository.save(roomType);
        log.info("Admin tao loai phong moi: {} thuoc khach san: {}", saved.getId(), hotel.getId());
        return saved;
    }

    /**
     * Cap nhat thong tin loai phong theo ID.
     */
    @Transactional
    public RoomType updateRoomType(UUID roomTypeId, RoomTypeRequest request) {
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai phong: " + roomTypeId));

        // Neu doi khach san
        if (request.getHotelId() != null && !request.getHotelId().equals(roomType.getHotel().getId())) {
            Hotel hotel = hotelRepository.findById(request.getHotelId())
                    .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay khach san: " + request.getHotelId()));
            roomType.setHotel(hotel);
        }

        mapRequestToRoomType(request, roomType);
        RoomType saved = roomTypeRepository.save(roomType);
        log.info("Admin cap nhat loai phong: {}", roomTypeId);
        return saved;
    }

    /**
     * Xoa loai phong theo ID.
     */
    @Transactional
    public void deleteRoomType(UUID roomTypeId) {
        if (!roomTypeRepository.existsById(roomTypeId)) {
            throw new ResourceNotFoundException("Khong tim thay loai phong: " + roomTypeId);
        }
        roomTypeRepository.deleteById(roomTypeId);
        log.info("Admin xoa loai phong: {}", roomTypeId);
    }

    private void mapRequestToRoomType(RoomTypeRequest request, RoomType roomType) {
        if (request.getName() != null) roomType.setName(request.getName());
        if (request.getBasePrice() != null) roomType.setBasePrice(request.getBasePrice());
        if (request.getCapacityAdults() != null) roomType.setCapacityAdults(request.getCapacityAdults());
        if (request.getCapacityChildren() != null) roomType.setCapacityChildren(request.getCapacityChildren());
        if (request.getAreaSqm() != null) roomType.setAreaSqm(request.getAreaSqm());
        if (request.getDescription() != null) roomType.setDescription(request.getDescription());
        if (request.getAmenities() != null) roomType.setAmenities(request.getAmenities());
        if (request.getImages() != null) roomType.setImages(request.getImages());
    }
}
