package com.hotel.booking.controller;

import com.hotel.booking.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller cong khai dung de truy van vai tro cua nguoi dung qua email truoc khi dang nhap.
 */
@RestController
@RequestMapping("/api/public/auth")
@RequiredArgsConstructor
public class PublicAuthController {

    private final ProfileRepository profileRepository;

    /**
     * Lay vai tro cua user dua tren email.
     * URL: GET /api/public/auth/role?email=...
     */
    @GetMapping("/role")
    public ResponseEntity<Map<String, String>> getUserRole(@RequestParam String email) {
        Map<String, String> response = new HashMap<>();
        String role = profileRepository.findRoleByEmail(email).orElse("USER");
        response.put("role", role);
        return ResponseEntity.ok(response);
    }
}
