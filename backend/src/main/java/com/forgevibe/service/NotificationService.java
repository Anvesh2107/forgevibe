package com.forgevibe.service;

import com.forgevibe.entity.Notification;
import com.forgevibe.entity.User;
import com.forgevibe.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;

    public void create(User recipient, String type, Map<String, Object> payload) {
        if (recipient == null) return;
        try {
            String payloadJson = buildJson(payload);
            notificationRepo.save(Notification.builder()
                    .user(recipient)
                    .type(type)
                    .payload(payloadJson)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create notification type={} for userId={}: {}", type, recipient.getId(), e.getMessage());
        }
    }

    public List<Notification> getForUser(Long userId) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAllRead(Long userId) {
        notificationRepo.markAllReadForUser(userId);
    }

    private String buildJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) return "{}";
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> {
            if (sb.length() > 1) sb.append(",");
            sb.append("\"").append(k).append("\":");
            if (v == null) sb.append("null");
            else if (v instanceof Number) sb.append(v);
            else if (v instanceof Boolean) sb.append(v);
            else sb.append("\"").append(v.toString().replace("\"", "\\\"")).append("\"");
        });
        sb.append("}");
        return sb.toString();
    }
}
