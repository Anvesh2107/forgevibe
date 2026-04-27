package com.forgevibe.aiworker.consumer;

import com.forgevibe.aiworker.event.ThoughtReviewedEvent;
import com.forgevibe.aiworker.event.ThoughtSubmittedEvent;
import com.forgevibe.aiworker.service.AiValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThoughtConsumer {

    private final AiValidationService aiService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "thought.submitted", groupId = "forgevibe-ai-worker",
                   containerFactory = "thoughtSubmittedListenerFactory")
    public void onThoughtSubmitted(ThoughtSubmittedEvent event) {
        log.info("[ThoughtConsumer] Received thoughtId={}", event.getThoughtId());

        AiValidationService.ValidationResult result = aiService.validateThought(event.getContent());

        ThoughtReviewedEvent reviewed = ThoughtReviewedEvent.builder()
                .thoughtId(event.getThoughtId())
                .status(result.status())
                .confidence(result.confidence())
                .reason(result.reason())
                .build();

        kafkaTemplate.send("thought.reviewed", String.valueOf(event.getThoughtId()), reviewed);
        log.info("[ThoughtConsumer] Sent thought.reviewed → thoughtId={} status={}", event.getThoughtId(), result.status());
    }
}
