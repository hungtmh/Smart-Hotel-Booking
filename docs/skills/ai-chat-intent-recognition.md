# SKILL 3: PHÁT TRÌNH AI CHATBOT & INTENT RECOGNITION (NHẬN DIỆN Ý ĐỊNH)

Tài liệu này hướng dẫn cách xây dựng trợ lý ảo **AI Virtual Concierge** thông minh. AI có khả năng trả lời Q&A, tự động bóc tách thông tin tìm phòng để tạo link đặt phòng trực tiếp, và nhận diện ý định gọi dịch vụ phòng của khách lưu trú để tạo phiếu dịch vụ tự động trong hệ thống.

---

## 1. THIẾT LẬP DATABASE BẢNG YÊU CẦU DỊCH VỤ PHÒNG

Chạy mã SQL sau trong Supabase SQL Editor:
```sql
CREATE TABLE room_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(10) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. TRIỂN KHAI MÃ NGUỒN JAVA SPRING BOOT

### 2.1. Thực thể RoomServiceRequest
#### [NEW] [RoomServiceRequest.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/model/RoomServiceRequest.java)
```java
package com.hotel.booking.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Thực thể lưu trữ các yêu cầu dịch vụ buồng phòng được gửi từ Chatbot AI.
 */
@Entity
@Table(name = "room_service_requests")
@Getter
@Setter
public class RoomServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
```

#### [NEW] [RoomServiceRequestRepository.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/repository/RoomServiceRequestRepository.java)
```java
package com.hotel.booking.repository;

import com.hotel.booking.model.RoomServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface RoomServiceRequestRepository extends JpaRepository<RoomServiceRequest, UUID> {
    // Kế thừa các phương thức CRUD tiêu chuẩn
}
```

### 2.2. DTO trao đổi tin nhắn Chat
#### [NEW] [ChatRequest.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/dto/ChatRequest.java)
```java
package com.hotel.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO chứa tin nhắn từ người dùng gửi lên Chatbot.
 */
@Data
public class ChatRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;

    // Có thể bổ sung trường roomNumber nếu khách đã check-in và đang lưu trú
    private String currentRoomNumber;
}
```

#### [NEW] [ChatResponse.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/dto/ChatResponse.java)
```java
package com.hotel.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO chứa phản hồi từ Chatbot AI gửi về cho Frontend.
 */
@Data
@AllArgsConstructor
public class ChatResponse {
    // Phản hồi dạng văn bản hiển thị cho người dùng
    private String reply;
    
    // Chỉ định xem đây có phải là một hành động đặc biệt không (đặt phòng hoặc yêu cầu dịch vụ)
    private String actionType; // 'NONE', 'BOOKING_REDIRECT', 'SERVICE_CREATED'
    
    // Link điều hướng nếu là hành động đặt phòng
    private String redirectUrl;
}
```

### 2.3. Service điều phối Chatbot & Nhận diện ý định (Intent Recognition)
Chúng ta sẽ sử dụng cấu trúc Prompt thông minh (System Prompt) hướng dẫn Mô hình Ngôn ngữ Lớn (LLM) trả về kết quả theo định dạng JSON chứa: Ý định (Intent), Nội dung trả lời (Reply) và các thuộc tính liên quan để Spring Boot dễ dàng bóc tách xử lý.

#### [NEW] [ChatbotService.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/service/ChatbotService.java)
```java
package com.hotel.booking.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.booking.dto.ChatRequest;
import com.hotel.booking.dto.ChatResponse;
import com.hotel.booking.model.RoomServiceRequest;
import com.hotel.booking.repository.RoomServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

/**
 * Dịch vụ xử lý logic hội thoại thông minh và nhận diện ý định người dùng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatClient chatClient;
    private final RoomServiceRequestRepository requestRepository;
    private final ObjectMapper objectMapper; // Dùng để parse chuỗi JSON trả về từ AI

    // System Prompt chỉ định rõ vai trò và định dạng đầu ra bắt buộc cho AI
    private static final String SYSTEM_PROMPT = """
        Bạn là Trợ lý ảo AI Virtual Concierge của khách sạn Marriott Smart Booking.
        Nhiệm vụ của bạn là hỗ trợ khách hàng trả lời câu hỏi, tìm phòng hoặc gọi dịch vụ phòng.
        Hãy phân tích tin nhắn của khách hàng và phân loại thành 3 ý định (Intent) sau:
        1. QNA: Khách hỏi thông tin chung (thú cưng, hồ bơi, giờ check-in, wifi...).
        2. BOOKING_ASSISTANT: Khách muốn tìm phòng, đặt phòng (Ví dụ: "tìm phòng Suite cho 2 người").
        3. ROOM_SERVICE: Khách đang ở phòng và muốn yêu cầu dịch vụ (Ví dụ: "gửi thêm 2 khăn tắm lên phòng 402").

        BẮT BUỘC trả về định dạng JSON thuần túy (không kèm markdown ```json ... ```) như sau:
        {
          "intent": "QNA" | "BOOKING_ASSISTANT" | "ROOM_SERVICE",
          "reply": "Câu trả lời bằng văn bản thân thiện, lịch sự gửi cho khách hàng",
          "parameters": {
             "roomNumber": "Số phòng của khách (nếu có trong ngữ cảnh hoặc tin nhắn)",
             "itemName": "Tên vật phẩm dịch vụ khách yêu cầu (ví dụ: khăn tắm, nước uống) - Chỉ có nếu intent là ROOM_SERVICE",
             "quantity": "Số lượng vật phẩm (dạng số nguyên) - Chỉ có nếu intent là ROOM_SERVICE",
             "roomType": "Loại phòng khách muốn tìm (suite, deluxe...) - Chỉ có nếu intent là BOOKING_ASSISTANT",
             "guests": "Số lượng khách - Chỉ có nếu intent là BOOKING_ASSISTANT"
          }
        }

        THÔNG TIN KHÁCH SẠN HỖ TRỢ Q&A:
        - Khách sạn có cho mang thú cưng không? Trả lời: Có, khách sạn cho phép mang thú cưng dưới 10kg kèm phí phụ thu 200,000 VND/đêm.
        - Giờ check-in sớm nhất? Trả lời: Giờ nhận phòng tiêu chuẩn là 14:00. Khách có thể yêu cầu check-in sớm từ 10:00 tùy thuộc vào tình trạng phòng trống (có phụ phí).
        - Hồ bơi mở cửa đến mấy giờ? Trả lời: Hồ bơi tại tầng thượng mở cửa miễn phí cho khách lưu trú từ 06:00 đến 22:00 hàng ngày.
        """;

    /**
     * Xử lý tin nhắn chat, phân tích ý định và thực hiện hành động nghiệp vụ tương ứng.
     */
    @Transactional
    public ChatResponse handleUserChat(ChatRequest chatRequest) {
        log.info("Nhận tin nhắn chat từ khách: '{}'", chatRequest.getMessage());

        try {
            // 1. Tạo Message cho System và User để gửi lên mô hình LLM
            SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(SYSTEM_PROMPT);
            Message systemMessage = systemPromptTemplate.createMessage();
            Message userMessage = new UserMessage(chatRequest.getMessage());

            // 2. Gọi mô hình AI xử lý và nhận phản hồi
            org.springframework.ai.chat.ChatResponse aiResponse = chatClient.call(new Prompt(List.of(systemMessage, userMessage)));
            String rawJsonReply = aiResponse.getResult().getOutput().getContent();

            log.debug("Phản hồi thô từ AI (JSON): {}", rawJsonReply);

            // 3. Phân tích cú pháp JSON trả về từ AI
            JsonNode jsonNode = objectMapper.readTree(rawJsonReply);
            String intent = jsonNode.get("intent").asText();
            String replyText = jsonNode.get("reply").asText();
            JsonNode parametersNode = jsonNode.get("parameters");

            // 4. Xử lý logic nghiệp vụ dựa trên ý định (Intent) đã nhận diện
            switch (intent) {
                case "ROOM_SERVICE":
                    return handleRoomServiceIntent(parametersNode, replyText);
                
                case "BOOKING_ASSISTANT":
                    return handleBookingAssistantIntent(parametersNode, replyText);
                
                case "QNA":
                default:
                    // Trả lời câu hỏi thông thường, không cần hành động gì thêm
                    return new ChatResponse(replyText, "NONE", null);
            }

        } catch (Exception ex) {
            log.error("Lỗi khi xử lý chatbot AI: ", ex);
            return new ChatResponse("Tôi gặp chút sự cố khi kết nối hệ thống. Bạn cần hỗ trợ gì có thể liên hệ lễ tân nhé!", "NONE", null);
        }
    }

    /**
     * Xử lý khi AI nhận diện ý định gọi dịch vụ phòng.
     * Tự động thêm một bản ghi yêu cầu dịch vụ vào cơ sở dữ liệu.
     */
    private ChatResponse handleRoomServiceIntent(JsonNode parameters, String replyText) {
        String roomNumber = parameters.has("roomNumber") ? parameters.get("roomNumber").asText() : "UNKNOWN";
        String itemName = parameters.has("itemName") ? parameters.get("itemName").asText() : "Khác";
        int quantity = parameters.has("quantity") ? parameters.get("quantity").asInt() : 1;

        log.info("Nhận diện ý định ROOM_SERVICE. Tạo yêu cầu: Phòng {} cần {}x {}", roomNumber, quantity, itemName);

        // Lưu vào DB
        RoomServiceRequest requestEntity = new RoomServiceRequest();
        requestEntity.setRoomNumber(roomNumber);
        requestEntity.setItemName(itemName);
        requestEntity.setQuantity(quantity);
        requestEntity.setStatus("PENDING");
        
        requestRepository.save(requestEntity);

        // Trả về phản hồi cho client báo hiệu yêu cầu đã được tạo thành công
        return new ChatResponse(replyText, "SERVICE_CREATED", null);
    }

    /**
     * Xử lý khi AI nhận diện ý định tìm phòng.
     * Tạo đường link điều hướng kèm các tham số tìm kiếm gửi về cho Frontend.
     */
    private ChatResponse handleBookingAssistantIntent(JsonNode parameters, String replyText) {
        String roomType = parameters.has("roomType") ? parameters.get("roomType").asText() : "";
        int guests = parameters.has("guests") ? parameters.get("guests").asInt() : 2;

        log.info("Nhận diện ý định BOOKING_ASSISTANT. Tham số: loại phòng: {}, số khách: {}", roomType, guests);

        // Sinh link điều hướng động
        String redirectUrl = String.format("/search?type=%s&guests=%d", roomType.toLowerCase(), guests);

        return new ChatResponse(replyText, "BOOKING_REDIRECT", redirectUrl);
    }
}
```

### 2.4. REST API Endpoint cho Khung Chat
#### [NEW] [ChatController.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/controller/ChatController.java)
```java
package com.hotel.booking.controller;

import com.hotel.booking.dto.ChatRequest;
import com.hotel.booking.dto.ChatResponse;
import com.hotel.booking.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller tiếp nhận các yêu cầu trò chuyện từ Frontend gửi lên Trợ lý ảo AI.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatbotService chatbotService;

    /**
     * Endpoint xử lý hội thoại chat AI.
     * URL: POST /api/ai/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chatWithAI(@Valid @RequestBody ChatRequest chatRequest) {
        ChatResponse response = chatbotService.handleUserChat(chatRequest);
        return ResponseEntity.ok(response);
    }
}
```
