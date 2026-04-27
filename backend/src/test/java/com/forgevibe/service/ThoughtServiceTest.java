package com.forgevibe.service;

import com.forgevibe.dto.request.ThoughtRequest;
import com.forgevibe.dto.response.ThoughtResponse;
import com.forgevibe.dto.response.UserResponse;
import com.forgevibe.entity.Like;
import com.forgevibe.entity.ThoughtPost;
import com.forgevibe.entity.User;
import com.forgevibe.event.ThoughtSubmittedEvent;
import com.forgevibe.kafka.KafkaProducerService;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.LikeRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ThoughtServiceTest {

    @Mock ThoughtPostRepository thoughtRepo;
    @Mock LikeRepository likeRepo;
    @Mock CommentRepository commentRepo;
    @Mock KafkaProducerService kafka;
    @Mock UserService userService;

    @InjectMocks ThoughtService thoughtService;

    private User user;
    private ThoughtPost post;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).username("carol")
                .diamonds(0).stars(0).totalLikes(0).forgeScore(0)
                .publicRepoCount(0).followerCount(0).verified(false)
                .build();

        post = ThoughtPost.builder()
                .id(5L).content("Java is still great")
                .status("pending").author(user)
                .aiConfidence(0).aiReason("").build();

        // Stub toResponse dependencies
        lenient().when(likeRepo.findByContentTypeAndContentId(anyString(), anyLong()))
                .thenReturn(List.of());
        lenient().when(likeRepo.findByContentTypeAndContentIdAndUser(anyString(), anyLong(), any()))
                .thenReturn(Optional.empty());
        lenient().when(userService.toResponse(user))
                .thenReturn(UserResponse.builder().id(1L).username("carol").build());
    }

    @Test
    void submit_createsPendingThought_sendsKafkaEvent() {
        ThoughtRequest req = new ThoughtRequest();
        req.setContent("AI is overhyped");
        when(thoughtRepo.save(any(ThoughtPost.class))).thenAnswer(inv -> {
            ThoughtPost p = inv.getArgument(0);
            p.setId(42L);
            return p;
        });

        ThoughtResponse resp = thoughtService.submit(req, user);

        assertThat(resp.getContent()).isEqualTo("AI is overhyped");
        assertThat(resp.getStatus()).isEqualTo("pending");
        verify(kafka).sendThoughtSubmitted(any(ThoughtSubmittedEvent.class));
    }

    @Test
    void react_whenNoExistingReaction_savesNewLike() {
        when(thoughtRepo.findById(5L)).thenReturn(Optional.of(post));
        when(likeRepo.findByContentTypeAndContentIdAndUser("thought", 5L, user))
                .thenReturn(Optional.empty());

        thoughtService.react(5L, "agree", user);

        ArgumentCaptor<Like> captor = ArgumentCaptor.forClass(Like.class);
        verify(likeRepo).save(captor.capture());
        assertThat(captor.getValue().getReactionType()).isEqualTo("agree");
        assertThat(captor.getValue().getContentType()).isEqualTo("thought");
        assertThat(user.getTotalLikes()).isEqualTo(1);
    }

    @Test
    void react_whenSameReactionExists_deletesLike() {
        Like existing = Like.builder()
                .id(1L).contentType("thought").contentId(5L)
                .user(user).reactionType("agree").build();

        when(thoughtRepo.findById(5L)).thenReturn(Optional.of(post));
        when(likeRepo.findByContentTypeAndContentIdAndUser("thought", 5L, user))
                .thenReturn(Optional.of(existing));

        thoughtService.react(5L, "agree", user);

        verify(likeRepo).delete(existing);
        verify(likeRepo, never()).save(any());
    }

    @Test
    void react_whenDifferentReactionExists_updatesReactionType() {
        Like existing = Like.builder()
                .id(1L).contentType("thought").contentId(5L)
                .user(user).reactionType("agree").build();

        when(thoughtRepo.findById(5L)).thenReturn(Optional.of(post));
        when(likeRepo.findByContentTypeAndContentIdAndUser("thought", 5L, user))
                .thenReturn(Optional.of(existing));

        thoughtService.react(5L, "brilliant", user);

        assertThat(existing.getReactionType()).isEqualTo("brilliant");
        verify(likeRepo).save(existing);
        verify(likeRepo, never()).delete(any());
    }

    @Test
    void appeal_setsAppealMessageAndPendingStatus() {
        when(thoughtRepo.findById(5L)).thenReturn(Optional.of(post));

        thoughtService.appeal(5L, "I disagree with the AI ruling", user);

        assertThat(post.getAppealMessage()).isEqualTo("I disagree with the AI ruling");
        assertThat(post.getAppealStatus()).isEqualTo("pending");
        verify(thoughtRepo).save(post);
    }
}
