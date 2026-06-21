package com.hotel.booking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller kiểm tra kết nối API công khai (không yêu cầu bảo mật đăng nhập).
 */
@RestController
@RequestMapping("/api/public")
public class PublicTestController {

    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    // Inject JdbcTemplate thông qua Constructor (khuyến khích trong Spring Boot)
    public PublicTestController(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Endpoint kiểm tra kết nối.
     * URL: GET /api/public/hello
     */
    @GetMapping("/hello")
    public ResponseEntity<Map<String, String>> hello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Xin chào! Kết nối giữa React Frontend và Spring Boot Backend đã thành công.");
        response.put("status", "SUCCESS");
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint kiểm tra kết nối trực tiếp đến cơ sở dữ liệu Supabase.
     * URL: GET /api/public/db-check
     */
    @GetMapping("/db-check")
    public ResponseEntity<Map<String, Object>> dbCheck() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Thực thi truy vấn đơn giản nhất 'SELECT 1' trên database postgres của Supabase
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            response.put("status", "SUCCESS");
            response.put("message", "Kết nối tới cơ sở dữ liệu Supabase PostgreSQL thành công!");
            response.put("test_query_result", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "FAILED");
            response.put("message", "Lỗi kết nối cơ sở dữ liệu: " + e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
