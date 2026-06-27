package com.hotel.booking.config;

import com.hotel.booking.service.AdminBookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Lop lich trinh tu dong chay cac tac vu hang ngay.
 *
 * Yeu cau: @EnableScheduling da duoc bat trong BookingApplication.java.
 *
 * Chuc nang:
 *   - Moi ngay luc 2:00 AM: tu dong chuyen cac booking da het han check-out
 *     sang trang thai COMPLETED.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {

    private final AdminBookingService adminBookingService;

    /**
     * Chay moi ngay luc 02:00 AM.
     * Cron expression: giay phut gio ngay thang thu-trong-tuan
     *   "0 0 2 * * *" = vao dung 2:00:00 AM moi ngay
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void autoCompleteExpiredBookings() {
        log.info("=== BookingScheduler bat dau chay: tu dong COMPLETED cac booking het han ===");
        try {
            adminBookingService.autoCompleteExpiredBookings();
        } catch (Exception e) {
            log.error("BookingScheduler gap loi: {}", e.getMessage(), e);
        }
        log.info("=== BookingScheduler hoan tat ===");
    }
}
