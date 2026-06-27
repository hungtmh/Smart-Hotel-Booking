package com.hotel.booking.service;

import com.hotel.booking.dto.HotelRequest;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Hotel;
import com.hotel.booking.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service xu ly cac nghiep vu CRUD Khach San danh rieng cho Admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminHotelService {

    private final HotelRepository hotelRepository;

    /**
     * Lay danh sach tat ca khach san trong he thong.
     */
    @Transactional(readOnly = true)
    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    /**
     * Tao moi mot khach san.
     */
    @Transactional
    public Hotel createHotel(HotelRequest request) {
        Hotel hotel = new Hotel();
        mapRequestToHotel(request, hotel);
        Hotel saved = hotelRepository.save(hotel);
        log.info("Admin tao khach san moi: {}", saved.getId());
        return saved;
    }

    /**
     * Cap nhat thong tin khach san theo ID.
     */
    @Transactional
    public Hotel updateHotel(UUID hotelId, HotelRequest request) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay khach san: " + hotelId));
        mapRequestToHotel(request, hotel);
        Hotel saved = hotelRepository.save(hotel);
        log.info("Admin cap nhat khach san: {}", hotelId);
        return saved;
    }

    /**
     * Xoa khach san theo ID.
     */
    @Transactional
    public void deleteHotel(UUID hotelId) {
        if (!hotelRepository.existsById(hotelId)) {
            throw new ResourceNotFoundException("Khong tim thay khach san: " + hotelId);
        }
        hotelRepository.deleteById(hotelId);
        log.info("Admin xoa khach san: {}", hotelId);
    }

    /**
     * Anh xa du lieu tu HotelRequest vao Hotel entity.
     */
    private void mapRequestToHotel(HotelRequest request, Hotel hotel) {
        if (request.getName() != null) hotel.setName(request.getName());
        if (request.getAddress() != null) hotel.setAddress(request.getAddress());
        if (request.getCity() != null) hotel.setCity(request.getCity());
        if (request.getCountry() != null) hotel.setCountry(request.getCountry());
        if (request.getDescription() != null) hotel.setDescription(request.getDescription());
        if (request.getStarRating() != null) hotel.setStarRating(request.getStarRating());
        if (request.getPhone() != null) hotel.setPhone(request.getPhone());
        if (request.getEmail() != null) hotel.setEmail(request.getEmail());
        if (request.getImages() != null) hotel.setImages(request.getImages());
        if (request.getLatitude() != null) hotel.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) hotel.setLongitude(request.getLongitude());
    }
}
