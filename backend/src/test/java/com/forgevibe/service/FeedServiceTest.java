package com.forgevibe.service;

import com.forgevibe.dto.response.FeedItemResponse;
import com.forgevibe.dto.response.ProjectResponse;
import com.forgevibe.dto.response.ThoughtResponse;
import com.forgevibe.entity.Project;
import com.forgevibe.entity.ThoughtPost;
import com.forgevibe.entity.User;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedServiceTest {

    @Mock ThoughtPostRepository thoughtRepo;
    @Mock ProjectRepository projectRepo;
    @Mock ThoughtService thoughtService;
    @Mock ProjectService projectService;

    @InjectMocks FeedService feedService;

    private ThoughtPost thought;
    private Project project;
    private ThoughtResponse thoughtResponse;
    private ProjectResponse projectResponse;

    @BeforeEach
    void setUp() {
        User author = User.builder()
                .id(1L).username("dave")
                .diamonds(0).stars(0).totalLikes(0).forgeScore(0)
                .publicRepoCount(0).followerCount(0).verified(false).build();

        thought = ThoughtPost.builder()
                .id(1L).content("Rust is the future").status("published").author(author).build();

        project = Project.builder()
                .id(2L).title("Cool App").stack("Java, Spring Boot").author(author).build();

        thoughtResponse = ThoughtResponse.builder()
                .id(1L).content("Rust is the future").status("published")
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        projectResponse = ProjectResponse.builder()
                .id(2L).title("Cool App")
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();
    }

    // ── filter=all, no tag ────────────────────────────────────────────────────

    @Test
    void getFeed_filterAll_noTag_returnsBothThoughtsAndProjects() {
        when(thoughtRepo.findByStatusOrderByCreatedAtDesc("published")).thenReturn(List.of(thought));
        when(projectRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(project));
        when(thoughtService.toResponse(any(), any())).thenReturn(thoughtResponse);
        when(projectService.toResponse(any(), any())).thenReturn(projectResponse);

        List<FeedItemResponse> feed = feedService.getFeed("all", null, null);

        assertThat(feed).hasSize(2);
        assertThat(feed.stream().anyMatch(i -> "thought".equals(i.getType()))).isTrue();
        assertThat(feed.stream().anyMatch(i -> "project".equals(i.getType()))).isTrue();
    }

    @Test
    void getFeed_filterAll_emptyTag_treatsSameAsNoTag() {
        when(thoughtRepo.findByStatusOrderByCreatedAtDesc("published")).thenReturn(List.of(thought));
        when(projectRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(project));
        when(thoughtService.toResponse(any(), any())).thenReturn(thoughtResponse);
        when(projectService.toResponse(any(), any())).thenReturn(projectResponse);

        List<FeedItemResponse> feed = feedService.getFeed("all", "  ", null);

        assertThat(feed).hasSize(2);
        verify(projectRepo).findAllByOrderByCreatedAtDesc();
        verify(projectRepo, never()).findByStackContainingIgnoreCaseOrderByCreatedAtDesc(any());
    }

    // ── filter=thoughts ───────────────────────────────────────────────────────

    @Test
    void getFeed_filterThoughts_returnsOnlyThoughts() {
        when(thoughtRepo.findByStatusOrderByCreatedAtDesc("published")).thenReturn(List.of(thought));
        when(thoughtService.toResponse(any(), any())).thenReturn(thoughtResponse);

        List<FeedItemResponse> feed = feedService.getFeed("thoughts", null, null);

        assertThat(feed).hasSize(1);
        assertThat(feed.get(0).getType()).isEqualTo("thought");
        verify(projectRepo, never()).findAllByOrderByCreatedAtDesc();
    }

    // ── filter=projects ───────────────────────────────────────────────────────

    @Test
    void getFeed_filterProjects_returnsOnlyProjects() {
        when(projectRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(project));
        when(projectService.toResponse(any(), any())).thenReturn(projectResponse);

        List<FeedItemResponse> feed = feedService.getFeed("projects", null, null);

        assertThat(feed).hasSize(1);
        assertThat(feed.get(0).getType()).isEqualTo("project");
        verify(thoughtRepo, never()).findByStatusOrderByCreatedAtDesc(any());
    }

    // ── tag filter ────────────────────────────────────────────────────────────

    @Test
    void getFeed_withTag_queriesProjectsByStackAndSkipsThoughts() {
        when(projectRepo.findByStackContainingIgnoreCaseOrderByCreatedAtDesc("Java"))
                .thenReturn(List.of(project));
        when(projectService.toResponse(any(), any())).thenReturn(projectResponse);

        List<FeedItemResponse> feed = feedService.getFeed("all", "Java", null);

        assertThat(feed).hasSize(1);
        assertThat(feed.get(0).getType()).isEqualTo("project");
        // thoughts are not fetched when a tag is active (thoughts have no tags)
        verify(thoughtRepo, never()).findByStatusOrderByCreatedAtDesc(any());
        verify(projectRepo, never()).findAllByOrderByCreatedAtDesc();
        verify(projectRepo).findByStackContainingIgnoreCaseOrderByCreatedAtDesc("Java");
    }

    @Test
    void getFeed_withTag_noMatchingProjects_returnsEmpty() {
        when(projectRepo.findByStackContainingIgnoreCaseOrderByCreatedAtDesc("COBOL"))
                .thenReturn(List.of());

        List<FeedItemResponse> feed = feedService.getFeed("all", "COBOL", null);

        assertThat(feed).isEmpty();
    }

    // ── sort order ────────────────────────────────────────────────────────────

    @Test
    void getFeed_sortedByCreatedAtDesc_mostRecentFirst() {
        // thought is 1hr ago, project is 2hr ago → thought should come first
        when(thoughtRepo.findByStatusOrderByCreatedAtDesc("published")).thenReturn(List.of(thought));
        when(projectRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(project));
        when(thoughtService.toResponse(any(), any())).thenReturn(thoughtResponse);
        when(projectService.toResponse(any(), any())).thenReturn(projectResponse);

        List<FeedItemResponse> feed = feedService.getFeed("all", null, null);

        assertThat(feed.get(0).getType()).isEqualTo("thought");
        assertThat(feed.get(1).getType()).isEqualTo("project");
    }

    // ── pending thoughts must NOT appear ─────────────────────────────────────

    @Test
    void getFeed_pendingThoughtsAreNeverReturned() {
        // FeedService only queries status=published — pending thoughts are excluded
        // at the repo layer. This test verifies the correct status is passed.
        when(thoughtRepo.findByStatusOrderByCreatedAtDesc("published")).thenReturn(List.of());
        when(projectRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        List<FeedItemResponse> feed = feedService.getFeed("all", null, null);

        assertThat(feed).isEmpty();
        verify(thoughtRepo).findByStatusOrderByCreatedAtDesc("published");
        verify(thoughtRepo, never()).findByStatusOrderByCreatedAtDesc("pending");
    }
}
