package com.hotel.booking.repository;

import com.hotel.booking.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
    List<PaymentTransaction> findByStatusOrderByCreatedAtDesc(String status);
}
