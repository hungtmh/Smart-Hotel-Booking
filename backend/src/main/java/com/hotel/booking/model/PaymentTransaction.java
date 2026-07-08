package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity luu tru tat ca cac giao dich thanh toan / Webhook gui ve tu SePay hoac Postman.
 * Giup Admin kiemsoat giao dich hop le (MATCHED) va giao dich sai cu phap (UNMATCHED).
 */
@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "gateway")
    private String gateway; // Vd: VietinBank, MBBank, SePay

    @Column(name = "account_number")
    private String accountNumber; // Vd: 108879632507

    @Column(name = "transfer_amount")
    private BigDecimal transferAmount; // Vd: 1500000

    @Column(name = "content")
    private String content; // Vd: "Thanh toan tien phong" (sai cu phap) hoac "PAY C5B9D1A2"

    @Column(name = "transaction_date")
    private String transactionDate; // Vd: "2026-07-06 22:38:00"

    @Column(name = "status")
    private String status; // "MATCHED" (Khop tu dong / Da xu ly) hoac "UNMATCHED" (Sai cu phap / Chua khop)

    @Column(name = "matched_booking_id")
    private UUID matchedBookingId; // ID don dat phong (neu khop duoc hoac admin duyet thu cong gan vao)

    @Column(name = "note")
    private String note; // Ghi chu them (Vd: "Khach nhap sai ma CK, Admin duyet thu cong")

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
