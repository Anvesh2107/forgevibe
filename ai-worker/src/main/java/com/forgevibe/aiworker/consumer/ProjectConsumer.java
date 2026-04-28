package com.forgevibe.aiworker.consumer;

import com.forgevibe.aiworker.event.ProjectAnalyzedEvent;
import com.forgevibe.aiworker.event.ProjectSubmittedEvent;
import com.forgevibe.aiworker.service.AiValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectConsumer {

    private final AiValidationService aiService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "project.submitted", groupId = "forgevibe-ai-worker",
                   containerFactory = "projectSubmittedListenerFactory")
    public void onProjectSubmitted(ProjectSubmittedEvent event) {
        log.info("[ProjectConsumer] Received projectId={}", event.getProjectId());

        AiValidationService.ProjectAnalysisResult result = aiService.analyzeProject(
                event.getTitle(), event.getDescription(), event.getStack(), event.getRepoUrl());

        ProjectAnalyzedEvent analyzed = ProjectAnalyzedEvent.builder()
                .projectId(event.getProjectId())
                .aiScore(result.confidence())
                .feedback(result.summary())
                .architectureScore(result.architectureScore())
                .securityScore(result.securityScore())
                .qualityScore(result.qualityScore())
                .docsScore(result.docsScore())
                .summary(result.summary())
                .vibeCheck(result.vibeCheck())
                .strengths(result.strengths())
                .improvements(result.improvements())
                .build();

        kafkaTemplate.send("project.analyzed", String.valueOf(event.getProjectId()), analyzed);
        log.info("[ProjectConsumer] Sent project.analyzed → projectId={} aiScore={}",
                event.getProjectId(), result.confidence());
    }
}
