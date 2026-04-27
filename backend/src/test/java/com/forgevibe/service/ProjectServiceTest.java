package com.forgevibe.service;

import com.forgevibe.dto.response.ProjectResponse;
import com.forgevibe.dto.response.UserResponse;
import com.forgevibe.entity.Like;
import com.forgevibe.entity.Project;
import com.forgevibe.entity.User;
import com.forgevibe.kafka.KafkaProducerService;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.LikeRepository;
import com.forgevibe.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock ProjectRepository projectRepo;
    @Mock LikeRepository likeRepo;
    @Mock CommentRepository commentRepo;
    @Mock KafkaProducerService kafka;
    @Mock UserService userService;
    @Mock NotificationService notificationService;

    @InjectMocks ProjectService projectService;

    private User author;
    private Project project;
    private UserResponse authorResponse;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(1L).username("bob")
                .diamonds(0).stars(0).totalLikes(0).forgeScore(0)
                .publicRepoCount(0).followerCount(0).verified(false)
                .build();

        project = Project.builder()
                .id(10L).title("Test Project").description("A cool project")
                .stack("Java,Spring").repoUrl("https://github.com/bob/test")
                .author(author).build();

        authorResponse = UserResponse.builder()
                .id(1L).username("bob").forgeScore(0)
                .diamonds(0).stars(0).totalLikes(0)
                .publicRepoCount(0).followerCount(0).verified(false)
                .build();

        // Stub common dependencies used by toResponse
        lenient().when(likeRepo.findByContentTypeAndContentId(anyString(), anyLong()))
                .thenReturn(List.of());
        lenient().when(likeRepo.findByContentTypeAndContentIdAndUser(anyString(), anyLong(), any()))
                .thenReturn(Optional.empty());
        lenient().when(userService.toResponse(author)).thenReturn(authorResponse);
    }

    @Test
    void getByAuthorId_returnsProjectsForAuthor() {
        when(projectRepo.findByAuthorIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(project));

        List<ProjectResponse> result = projectService.getByAuthorId(1L, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Project");
        verify(projectRepo).findByAuthorIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void toggleLike_whenNotYetLiked_savesLikeAndIncreasesTotalLikes() {
        when(projectRepo.findById(10L)).thenReturn(Optional.of(project));
        when(likeRepo.findByContentTypeAndContentIdAndUser("project", 10L, author))
                .thenReturn(Optional.empty());

        projectService.toggleLike(10L, author);

        verify(likeRepo).save(any(Like.class));
        assertThat(author.getTotalLikes()).isEqualTo(1);
        verify(userService).recalcScore(author, 0);
    }

    @Test
    void toggleLike_whenAlreadyLiked_deletesLikeAndDecreasesTotalLikes() {
        author.setTotalLikes(5);
        Like existingLike = Like.builder()
                .id(99L).contentType("project").contentId(10L)
                .user(author).reactionType("like").build();

        when(projectRepo.findById(10L)).thenReturn(Optional.of(project));
        when(likeRepo.findByContentTypeAndContentIdAndUser("project", 10L, author))
                .thenReturn(Optional.of(existingLike));

        projectService.toggleLike(10L, author);

        verify(likeRepo).delete(existingLike);
        assertThat(author.getTotalLikes()).isEqualTo(4);
    }
}
