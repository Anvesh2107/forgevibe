package com.forgevibe.service;

import com.forgevibe.entity.Notification;
import com.forgevibe.entity.User;
import com.forgevibe.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final ObjectMapper objectMapper;

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

    public void markOneRead(Long notificationId, Long userId) {
        notificationRepo.findById(notificationId).ifPresent(n -> {
            if (userId != null && userId.equals(n.getUser().getId())) {
                n.setRead(true);
                notificationRepo.save(n);
            }
        });
    }

    private String buildJson(Map<String, Object> map) {
        try { return objectMapper.writeValueAsString(map != null ? map : java.util.Map.of()); }
        catch (Exception e) { return "{}"; }
    }
}
