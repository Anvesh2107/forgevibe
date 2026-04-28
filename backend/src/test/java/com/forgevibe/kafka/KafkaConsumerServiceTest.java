package com.forgevibe.kafka;

import com.forgevibe.entity.ThoughtPost;
import com.forgevibe.entity.User;
import com.forgevibe.event.ProjectAnalyzedEvent;
import com.forgevibe.event.ThoughtReviewedEvent;
import com.forgevibe.entity.Project;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import com.forgevibe.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KafkaConsumerServiceTest {

    @Mock ThoughtPostRepository thoughtPostRepository;
    @Mock ProjectRepository projectRepository;
    @Mock NotificationService notificationService;

    @InjectMocks KafkaConsumerService kafkaConsumerService;

    private User author;
    private ThoughtPost thought;
    private Project project;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(1L).username("dev")
                .diamonds(0).stars(0).totalLikes(0).forgeScore(0)
                .publicRepoCount(0).followerCount(0).verified(false).build();

        thought = ThoughtPost.builder()
                .id(10L).content("Some tech post").status("pending").author(author).build();

        project = Project.builder()
                .id(20L).title("My Project").author(author)
                .analysisStatus("pending").build();
    }

    // ── ThoughtReviewedEvent: published ───────────────────────────────────────

    @Test
    void onThoughtReviewed_published_updatesStatusAndSavesAndNotifies() {
        when(thoughtPostRepository.findById(10L)).thenReturn(Optional.of(thought));

        ThoughtReviewedEvent event = new ThoughtReviewedEvent(10L, "published", 85, "Great technical post");
        kafkaConsumerService.onThoughtReviewed(event);

        ArgumentCaptor<ThoughtPost> saved = ArgumentCaptor.forClass(ThoughtPost.class);
        verify(thoughtPostRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo("published");
        assertThat(saved.getValue().getAiConfidence()).isEqualTo(85);
        assertThat(saved.getValue().getAiReason()).isEqualTo("Great technical post");

        verify(notificationService).create(eq(author), eq("post_approved"), any());
    }

    @Test
    void onThoughtReviewed_blocked_updatesStatusAndSendsRejectedNotification() {
        when(thoughtPostRepository.findById(10L)).thenReturn(Optional.of(thought));

        ThoughtReviewedEvent event = new ThoughtReviewedEvent(10L, "blocked", 20, "Not tech-relevant");
        kafkaConsumerService.onThoughtReviewed(event);

        ArgumentCaptor<ThoughtPost> saved = ArgumentCaptor.forClass(ThoughtPost.class);
        verify(thoughtPostRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo("blocked");

        verify(notificationService).create(eq(author), eq("post_rejected"), any());
    }

    @Test
    void onThoughtReviewed_needsContext_updatesStatusAndSendsRejectedNotification() {
        when(thoughtPostRepository.findById(10L)).thenReturn(Optional.of(thought));

        ThoughtReviewedEvent event = new ThoughtReviewedEvent(10L, "needs_context", 45, "Add more detail");
        kafkaConsumerService.onThoughtReviewed(event);

        ArgumentCaptor<ThoughtPost> saved = ArgumentCaptor.forClass(ThoughtPost.class);
        verify(thoughtPostRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo("needs_context");

        verify(notificationService).create(eq(author), eq("post_rejected"), any());
    }

    @Test
    void onThoughtReviewed_unknownThoughtId_doesNothing() {
        when(thoughtPostRepository.findById(99L)).thenReturn(Optional.empty());

        kafkaConsumerService.onThoughtReviewed(new ThoughtReviewedEvent(99L, "published", 90, "ok"));

        verify(thoughtPostRepository, never()).save(any());
        verify(notificationService, never()).create(any(), any(), any());
    }

    // ── ProjectAnalyzedEvent ──────────────────────────────────────────────────

    @Test
    void onProjectAnalyzed_updatesAllFieldsAndSetsStatusAnalyzed() {
        when(projectRepository.findById(20L)).thenReturn(Optional.of(project));

        ProjectAnalyzedEvent event = ProjectAnalyzedEvent.builder()
                .projectId(20L).aiScore(78)
                .architectureScore(80).securityScore(70).qualityScore(85).docsScore(75)
                .summary("Solid project").vibeCheck("Impressive")
                .strengths("[\"Clean code\"]").improvements("[\"Add tests\"]")
                .build();

        kafkaConsumerService.onProjectAnalyzed(event);

        ArgumentCaptor<Project> saved = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(saved.capture());
        Project p = saved.getValue();
        assertThat(p.getAnalysisStatus()).isEqualTo("analyzed");
        assertThat(p.getAiScore()).isEqualTo(78);
        assertThat(p.getArchitectureScore()).isEqualTo(80);
        assertThat(p.getAnalysisSummary()).isEqualTo("Solid project");

        verify(notificationService).create(eq(author), eq("analysis_complete"), any());
    }

    @Test
    void onProjectAnalyzed_unknownProjectId_doesNothing() {
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        kafkaConsumerService.onProjectAnalyzed(ProjectAnalyzedEvent.builder().projectId(99L).build());

        verify(projectRepository, never()).save(any());
        verify(notificationService, never()).create(any(), any(), any());
    }
}
