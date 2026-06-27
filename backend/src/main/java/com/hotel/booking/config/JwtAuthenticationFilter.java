package com.hotel.booking.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.AlgorithmParameters;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.hotel.booking.model.Profile;
import com.hotel.booking.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Filter xac thuc JWT token tu Supabase tren moi request gui len.
 * Supabase dung thuat toan ES256 (ECDSA P-256), nen can dung PublicKey (khoa
 * cong khai)
 * xay tu toa do X, Y thay vi HS256 secret key thong thuong.
 */
@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private ProfileRepository profileRepository;

    // Toa do khoa cong khai ES256 tu Supabase JWKS (kid:
    // 05be8d9e-72b2-4fb7-a7c3-11537e573b14)
    private static final String EC_X = "jo4Mt5HiCKT3jIJ00dMxgPmZHD3QZ30xKEkJYcrxhNE";
    private static final String EC_Y = "SFnte_JIZoEkyJhzWYPufmy-aqmWu3Yspkty8GzgFa4";

    // Cache lai de khong phai build lai moi request (chi build 1 lan duy nhat)
    private PublicKey publicKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = extractJwtFromRequest(request);
            if (jwt != null) {
                authenticateWithJwt(jwt, request);
            }
        } catch (Exception ex) {
            log.error("Khong the xac thuc JWT token: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Trich xuat JWT token tu header Authorization: Bearer <token>
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Giai ma JWT bang khoa cong khai ES256, trich xuat userId va role,
     * thiet lap Authentication vao SecurityContext.
     *
     * Phan quyen Admin:
     * - Neu email cua user nam trong ADMIN_EMAILS -> tu dong gan ROLE_ADMIN
     * - Khong can cau hinh Supabase custom claim, chi can them email vao day
     */
    private void authenticateWithJwt(String token, HttpServletRequest request) throws Exception {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getPublicKey()) // Dung khoa cong khai ES256
                .build()
                .parseClaimsJws(token)
                .getBody();

        // Subject chinh la UUID cua user tren Supabase
        String userId = claims.getSubject();

        // Lay email tu JWT claim ("email" la standard claim Supabase cung cap)
        String email = claims.get("email", String.class);

        // Lay role tu JWT claim ("role" duoc hook boi Supabase, default la
        // "authenticated")
        String claimRole = claims.get("role", String.class);

        // Neu claimRole la "authenticated" hoac null, doc tu app_metadata.role do
        // Supabase tu dong nhung
        if (claimRole == null || claimRole.isEmpty() || "authenticated".equalsIgnoreCase(claimRole)) {
            java.util.Map<?, ?> appMetadata = claims.get("app_metadata", java.util.Map.class);
            if (appMetadata != null && appMetadata.get("role") != null) {
                claimRole = appMetadata.get("role").toString();
            }
        }
        // 1. Tra cuu vai tro tu database (bang profiles) lam phuong an du phong neu JWT claim chua phan quyen ADMIN
        if ((claimRole == null || claimRole.isEmpty() || "authenticated".equalsIgnoreCase(claimRole) || "user".equalsIgnoreCase(claimRole)) 
                && userId != null && profileRepository != null) {
            try {
                Optional<Profile> profileOpt = profileRepository.findById(UUID.fromString(userId));
                if (profileOpt.isPresent() && "ADMIN".equalsIgnoreCase(profileOpt.get().getRole())) {
                    claimRole = "ADMIN";
                }
            } catch (Exception e) {
                log.error("Loi khi doc role tu database cho userId {}: {}", userId, e.getMessage());
            }
        }

        String role;
        if (claimRole == null || claimRole.isEmpty() || "authenticated".equalsIgnoreCase(claimRole)) {
            role = "ROLE_USER";
        } else if (!claimRole.startsWith("ROLE_")) {
            role = "ROLE_" + claimRole.toUpperCase();
        } else {
            role = claimRole;
        }

        if (userId != null) {
            List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null,
                    authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Xac thuc JWT thanh cong cho userId: {}, email: {}, role: {}", userId, email, role);
        }
    }

    /**
     * Xay dung ECPublicKey tu toa do X, Y (P-256 / secp256r1).
     * Su dung synchronized + cache de chi build 1 lan, tranh ton tai nguyen.
     */
    private synchronized PublicKey getPublicKey() throws Exception {
        if (publicKey != null)
            return publicKey;

        byte[] xBytes = Base64.getUrlDecoder().decode(EC_X);
        byte[] yBytes = Base64.getUrlDecoder().decode(EC_Y);

        ECPoint point = new ECPoint(new BigInteger(1, xBytes), new BigInteger(1, yBytes));

        AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
        params.init(new ECGenParameterSpec("secp256r1"));
        ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

        publicKey = KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, ecSpec));
        log.info("Da khoi tao thanh cong ECPublicKey ES256 tu toa do Supabase JWKS");
        return publicKey;
    }
}
