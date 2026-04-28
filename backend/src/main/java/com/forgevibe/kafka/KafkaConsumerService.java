package com.forgevibe.kafka;

import com.forgevibe.entity.Project;
import com.forgevibe.entity.ThoughtPost;
import com.forgevibe.event.ProjectAnalyzedEvent;
import com.forgevibe.event.ThoughtReviewedEvent;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import com.forgevibe.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final ThoughtPostRepository thoughtPostRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    @KafkaListener(topics = KafkaTopics.THOUGHT_REVIEWED, groupId = "forgevibe-backend",
                   containerFactory = "thoughtReviewedListenerFactory")
    public void onThoughtReviewed(ThoughtReviewedEvent event) {
        log.info("Received thought.reviewed for thoughtId={} status={}", event.getThoughtId(), event.getStatus());
        thoughtPostRepository.findById(event.getThoughtId()).ifPresent(post -> {
            post.setStatus(event.getStatus());
            post.setAiConfidence(event.getConfidence());
            post.setAiReason(event.getReason());
            thoughtPostRepository.save(post);
            log.info("Updated ThoughtPost {} → status={}", event.getThoughtId(), event.getStatus());

            String notifType = "published".equals(event.getStatus()) ? "post_approved" : "post_rejected";
            notificationService.create(post.getAuthor(), notifType, Map.of(
                    "thoughtId", post.getId()
            ));
        });
    }

    @KafkaListener(topics = KafkaTopics.PROJECT_ANALYZED, groupId = "forgevibe-backend",
                   containerFactory = "projectAnalyzedListenerFactory")
    public void onProjectAnalyzed(ProjectAnalyzedEvent event) {
        log.info("Received project.analyzed for projectId={} aiScore={}", event.getProjectId(), event.getAiScore());
        projectRepository.findById(event.getProjectId()).ifPresent(project -> {
            project.setAiScore(event.getAiScore());
            project.setAnalysisStatus("analyzed");
            project.setArchitectureScore(event.getArchitectureScore());
            project.setSecurityScore(event.getSecurityScore());
            project.setQualityScore(event.getQualityScore());
            project.setDocsScore(event.getDocsScore());
            project.setAnalysisSummary(event.getSummary());
            project.setAnalysisVibeCheck(event.getVibeCheck());
            project.setAnalysisStrengths(event.getStrengths());
            project.setAnalysisImprovements(event.getImprovements());
            projectRepository.save(project);
            log.info("Updated Project {} → analyzed, aiScore={}", event.getProjectId(), event.getAiScore());

            notificationService.create(project.getAuthor(), "analysis_complete", Map.of(
                    "projectId", project.getId(),
                    "projectName", project.getTitle()
            ));
        });
    }
}
