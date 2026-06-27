package com.hotel.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Lớp khởi chạy chính của ứng dụng Spring Boot Quản lý đặt phòng khách sạn.
 * @EnableScheduling: Kích hoạt cơ chế chạy tự động theo lịch (@Scheduled).
 */
@SpringBootApplication
@EnableScheduling
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }
}
