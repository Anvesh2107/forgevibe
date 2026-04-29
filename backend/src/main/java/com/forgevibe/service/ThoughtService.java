package com.forgevibe.service;

import com.forgevibe.dto.request.ThoughtRequest;
import com.forgevibe.dto.response.ThoughtResponse;
import com.forgevibe.entity.Like;
import com.forgevibe.entity.ThoughtPost;
import com.forgevibe.entity.User;
import com.forgevibe.event.ThoughtSubmittedEvent;
import com.forgevibe.kafka.KafkaProducerService;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.LikeRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThoughtService {

    private final ThoughtPostRepository thoughtRepo;
    private final LikeRepository likeRepo;
    private final CommentRepository commentRepo;
    private final KafkaProducerService kafka;
    private final UserService userService;

    public ThoughtResponse submit(ThoughtRequest req, User author) {
        ThoughtPost post = ThoughtPost.builder()
                .content(req.getContent())
                .author(author)
                .status("pending")
                .aiConfidence(0)
                .aiReason("")
                .build();
        thoughtRepo.save(post);

        kafka.sendThoughtSubmitted(ThoughtSubmittedEvent.builder()
                .thoughtId(post.getId())
                .userId(author.getId())
                .content(post.getContent())
                .build());

        return toResponse(post, author);
    }

    public ThoughtResponse getById(Long id, User viewer) {
        ThoughtPost post = thoughtRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Thought not found: " + id));
        return toResponse(post, viewer);
    }

    public List<ThoughtResponse> getPublished(User viewer) {
        return thoughtRepo.findByStatusOrderByCreatedAtDesc("published")
                .stream()
                .map(p -> toResponse(p, viewer))
                .toList();
    }

    public List<ThoughtResponse> getByAuthorId(Long authorId, User viewer) {
        return thoughtRepo.findByAuthorIdOrderByCreatedAtDesc(authorId)
                .stream()
                .filter(p -> "published".equals(p.getStatus()))
                .map(p -> toResponse(p, viewer))
                .toList();
    }

    public ThoughtResponse react(Long thoughtId, String reactionType, User user) {
        ThoughtPost post = thoughtRepo.findById(thoughtId)
                .orElseThrow(() -> new RuntimeException("Thought not found"));

        Optional<Like> existing = likeRepo.findByContentTypeAndContentIdAndUser("thought", thoughtId, user);
        if (existing.isPresent()) {
            Like like = existing.get();
            if (like.getReactionType().equals(reactionType)) {
                likeRepo.delete(like); // toggle off
            } else {
                like.setReactionType(reactionType);
                likeRepo.save(like);  // switch reaction
            }
        } else {
            likeRepo.save(Like.builder()
                    .contentType("thought")
                    .contentId(thoughtId)
                    .user(user)
                    .reactionType(reactionType)
                    .build());
            // update author totalLikes
            User author = post.getAuthor();
            author.setTotalLikes(author.getTotalLikes() + 1);
            userService.recalcScore(author, 0);
        }
        return toResponse(post, user);
    }

    public void appeal(Long thoughtId, String message, User user) {
        ThoughtPost post = thoughtRepo.findById(thoughtId)
                .orElseThrow(() -> new RuntimeException("Thought not found"));
        post.setAppealMessage(message);
        post.setAppealStatus("pending");
        thoughtRepo.save(post);
    }

    public ThoughtResponse toResponse(ThoughtPost post, User viewer) {
        Map<String, Long> reactions = likeRepo.findByContentTypeAndContentId("thought", post.getId())
                .stream()
                .collect(Collectors.groupingBy(Like::getReactionType, Collectors.counting()));

        String userReaction = viewer != null
                ? likeRepo.findByContentTypeAndContentIdAndUser("thought", post.getId(), viewer)
                        .map(Like::getReactionType).orElse(null)
                : null;

        long commentCount = commentRepo.countByContentTypeAndContentId("thought", post.getId());
        long likeCount = reactions.values().stream().mapToLong(Long::longValue).sum();
        boolean hasLiked = userReaction != null;

        var authorResponse = userService.toResponse(post.getAuthor());

        return ThoughtResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .status(post.getStatus())
                .aiConfidence(post.getAiConfidence())
                .aiReason(post.getAiReason())
                .author(authorResponse)
                .user(authorResponse)   // alias used by frontend
                .reactions(reactions)
                .userReaction(userReaction)
                .likeCount(likeCount)
                .hasLiked(hasLiked)
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
