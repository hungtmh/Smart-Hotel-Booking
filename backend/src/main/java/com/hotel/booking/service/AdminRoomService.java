package com.hotel.booking.service;

import com.hotel.booking.dto.RoomRequest;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Room;
import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.RoomRepository;
import com.hotel.booking.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service xu ly cac nghiep vu CRUD Phong Vat Ly danh rieng cho Admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    /**
     * Lay danh sach tat ca phong vat ly trong he thong.
     */
    @Transactional(readOnly = true)
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    /**
     * Tao moi mot phong vat ly thuoc loai phong chi dinh.
     */
    @Transactional
    public Room createRoom(RoomRequest request) {
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai phong: " + request.getRoomTypeId()));

        Room room = new Room();
        room.setRoomType(roomType);
        room.setRoomNumber(request.getRoomNumber());
        room.setFloor(request.getFloor());
        room.setStatus(request.getStatus() != null ? request.getStatus().toUpperCase() : "AVAILABLE");

        Room saved = roomRepository.save(room);
        log.info("Admin tao phong moi: {} (so phong: {}) thuoc loai phong: {}",
                saved.getId(), saved.getRoomNumber(), roomType.getId());
        return saved;
    }

    /**
     * Cap nhat thong tin phong vat ly theo ID.
     */
    @Transactional
    public Room updateRoom(UUID roomId, RoomRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay phong: " + roomId));

        if (request.getRoomTypeId() != null) {
            RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay loai phong: " + request.getRoomTypeId()));
            room.setRoomType(roomType);
        }
        if (request.getRoomNumber() != null) room.setRoomNumber(request.getRoomNumber());
        if (request.getFloor() != null) room.setFloor(request.getFloor());
        if (request.getStatus() != null) room.setStatus(request.getStatus().toUpperCase());

        Room saved = roomRepository.save(room);
        log.info("Admin cap nhat phong: {}", roomId);
        return saved;
    }

    /**
     * Xoa phong vat ly theo ID.
     */
    @Transactional
    public void deleteRoom(UUID roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Khong tim thay phong: " + roomId);
        }
        roomRepository.deleteById(roomId);
        log.info("Admin xoa phong: {}", roomId);
    }
}
