# SKILL 2: TÍCH HỢP SUPABASE PGVECTOR & TÌM KIẾM NGỮ NGHĨA (SEMANTIC SEARCH)

Tài liệu này hướng dẫn chi tiết cách kết nối cơ sở dữ liệu Supabase, kích hoạt tính năng lưu trữ Vector, sinh vector embedding từ văn bản bằng Spring AI và thực hiện tìm kiếm thông minh bằng ngôn ngữ tự nhiên.

---

## 1. THIẾT LẬP CƠ SỞ DỮ LIỆU TRÊN SUPABASE (POSTGRESQL)

Chạy đoạn mã SQL sau trong mục **SQL Editor** trên trang quản trị Supabase của bạn:

```sql
-- 1. Kích hoạt Extension lưu trữ Vector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tạo bảng loại phòng (nếu chưa có) kèm cột lưu trữ Vector 1536 chiều
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    capacity INT NOT NULL,
    description TEXT,
    -- 1536 chiều tương ứng với vector embedding của mô hình OpenAI text-embedding-ada-002
    -- Nếu sử dụng mô hình khác (ví dụ Ollama all-minilm), hãy điều chỉnh số chiều tương ứng (ví dụ 384)
    description_vector vector(1536) 
);

-- 3. Tạo một chỉ mục (Index) kiểu HNSW để tăng tốc độ tìm kiếm tương đồng
CREATE INDEX ON room_types USING hnsw (description_vector vector_cosine_ops);
```

---

## 2. CẤU HÌNH SPRING AI TRONG SPRING BOOT

### 2.1. Thêm Dependency vào `pom.xml` (Maven)
```xml
<!-- Quản lý phiên bản Spring AI -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>0.8.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- Dependency phục vụ sinh vector embedding -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    </dependency>
</dependencies>
```

### 2.2. Cấu hình khóa API trong `application.yml`
```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY} # Khóa API OpenAI của bạn
      embedding:
        options:
          model: text-embedding-ada-002 # Mô hình chuyển văn bản thành vector
```

---

## 3. TRIỂN KHAI MÃ NGUỒN JAVA SPRING BOOT (CLEAN CODE)

### 3.1. Định nghĩa Entity hỗ trợ Vector
#### [NEW] [RoomType.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/model/RoomType.java)
```java
package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Thực thể ánh xạ với bảng room_types trong Database.
 */
@Entity
@Table(name = "room_types")
@Getter
@Setter
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;

    @Column(nullable = false)
    private Integer capacity;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Hibernate/JPA không hỗ trợ kiểu dữ liệu Vector nguyên bản.
    // Chúng ta không map trực tiếp thuộc tính description_vector này vào JPA để đọc thông thường
    // mà sẽ xử lý nó qua Native SQL trong Repository.
}
```

### 3.2. Viết Custom Query trong Repository bằng Native SQL
Sử dụng toán tử `<=>` của pgvector (đại diện cho khoảng cách Cosine - Cosine Distance) để tìm kiếm phòng phù hợp nhất. Khoảng cách càng nhỏ (càng gần 0) thì độ tương đồng càng cao.

#### [NEW] [RoomTypeRepository.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/repository/RoomTypeRepository.java)
```java
package com.hotel.booking.repository;

import com.hotel.booking.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, UUID> {

    /**
     * Tìm kiếm phòng sử dụng độ tương đồng cosine.
     * :queryVector được truyền vào dưới dạng String đại diện cho mảng float, ví dụ: '[0.1, -0.2, 0.5...]'
     * Toán tử <=> đo khoảng cách cosine. 
     * Sắp xếp tăng dần theo khoảng cách để các kết quả giống nhất nổi lên đầu.
     */
    @Query(value = "SELECT * FROM room_types ORDER BY description_vector <=> cast(:queryVector as vector) LIMIT :limitCount", 
           nativeQuery = true)
    List<RoomType> findSimilarRoomTypes(
            @Param("queryVector") String queryVector, 
            @Param("limitCount") int limitCount
    );
}
```

### 3.3. Viết Service tạo Embedding và Tìm kiếm
#### [NEW] [SemanticSearchService.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/service/SemanticSearchService.java)
```java
package com.hotel.booking.service;

import com.hotel.booking.model.RoomType;
import com.hotel.booking.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;

/**
 * Dịch vụ xử lý tìm kiếm ngữ nghĩa thông minh.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SemanticSearchService {

    private final EmbeddingClient embeddingClient;
    private final RoomTypeRepository roomTypeRepository;

    /**
     * Tìm kiếm phòng dựa trên câu mô tả tự nhiên của khách.
     * 
     * @param naturalLanguageQuery Câu truy vấn tự nhiên (ví dụ: "phòng yên tĩnh hướng biển")
     * @param limit Số lượng kết quả tối đa muốn trả về
     * @return Danh sách các RoomType khớp nhất
     */
    @Transactional(readOnly = true)
    public List<RoomType> searchRooms(String naturalLanguageQuery, int limit) {
        log.info("Bắt đầu tìm kiếm ngữ nghĩa cho câu truy vấn: '{}'", naturalLanguageQuery);

        // 1. Sử dụng Spring AI để sinh Vector Embedding từ câu truy vấn của người dùng
        List<Double> embedding = embeddingClient.embed(naturalLanguageQuery);
        
        // 2. Chuyển đổi List<Double> thành định dạng chuỗi vector của PostgreSQL (Ví dụ: '[0.123, -0.456, ...]')
        String vectorString = Arrays.toString(embedding.toArray());

        log.debug("Đã tạo xong Vector Embedding. Tiến hành truy vấn database...");

        // 3. Gọi repository thực thi truy vấn Cosine Similarity trên DB
        return roomTypeRepository.findSimilarRoomTypes(vectorString, limit);
    }
}
```

### 3.4. Viết REST API Endpoint cho Frontend gọi tìm kiếm
#### [NEW] [SearchController.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/controller/SearchController.java)
```java
package com.hotel.booking.controller;

import com.hotel.booking.model.RoomType;
import com.hotel.booking.service.SemanticSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller tiếp nhận yêu cầu tìm kiếm từ Client.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cấu hình CORS cơ bản cho phép Frontend gọi API
public class SearchController {

    private final SemanticSearchService semanticSearchService;

    /**
     * API tìm kiếm phòng thông minh bằng ngôn ngữ tự nhiên.
     * URL: GET /api/ai/search?query=phòng yên tĩnh hướng biển&limit=5
     */
    @GetMapping("/search")
    public ResponseEntity<List<RoomType>> searchRooms(
            @RequestParam("query") String query,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<RoomType> results = semanticSearchService.searchRooms(query, limit);
        return ResponseEntity.ok(results);
    }
}
```
