package com.hotel.booking.exception;

/**
 * Ngoai le nem ra khi khong tim thay tai nguyen trong he thong.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
