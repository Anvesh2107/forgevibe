package com.forgevibe.service;

import com.forgevibe.dto.request.SpaceRequest;
import com.forgevibe.dto.response.SpacePostResponse;
import com.forgevibe.dto.response.SpaceResponse;
import com.forgevibe.entity.Like;
import com.forgevibe.entity.Space;
import com.forgevibe.entity.SpaceMember;
import com.forgevibe.entity.SpacePost;
import com.forgevibe.entity.User;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.LikeRepository;
import com.forgevibe.repository.SpaceMemberRepository;
import com.forgevibe.repository.SpacePostRepository;
import com.forgevibe.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepo;
    private final SpaceMemberRepository memberRepo;
    private final SpacePostRepository postRepo;
    private final LikeRepository likeRepo;
    private final CommentRepository commentRepo;
    private final UserService userService;

    @org.springframework.transaction.annotation.Transactional
    public SpaceResponse createSpace(SpaceRequest req, User owner) {
        if (spaceRepo.countByOwnerId(owner.getId()) >= 5) {
            throw new RuntimeException("Cannot create more than 5 spaces");
        }
        String emoji = req.getEmoji() != null && !req.getEmoji().isBlank() ? req.getEmoji() : "🚀";
        boolean paid = req.isPaid();
        Double price = paid && req.getPriceMonthly() != null && req.getPriceMonthly() > 0
                ? req.getPriceMonthly() : null;
        if (paid && price == null) paid = false; // can't be paid without a price

        boolean finalPaid = paid;
        Double finalPrice = price;
        Space space = null;
        for (int attempt = 0; attempt < 5; attempt++) {
            try {
                String slug = generateSlug(req.getName());
                space = spaceRepo.save(Space.builder()
                        .name(req.getName())
                        .slug(slug)
                        .description(req.getDescription())
                        .emoji(emoji)
                        .owner(owner)
                        .isPaid(finalPaid)
                        .priceMonthly(finalPrice)
                        .memberCount(1)
                        .postCount(0)
                        .build());
                break;
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                // Only retry for slug uniqueness violations — rethrow everything else immediately
                if (!msg.contains("slug")) throw e;
                if (attempt == 4) throw e;
            }
        }

        memberRepo.save(SpaceMember.builder()
                .space(space)
                .user(owner)
                .role("owner")
                .build());

        return toResponse(space, owner);
    }

    public List<SpaceResponse> getAll(User viewer) {
        return spaceRepo.findAllByOrderByMemberCountDesc()
                .stream().map(s -> toResponse(s, viewer)).toList();
    }

    public SpaceResponse getById(Long id, User viewer) {
        Space space = spaceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Space not found: " + id));
        return toResponse(space, viewer);
    }

    public SpaceResponse joinSpace(Long spaceId, User user) {
        Space space = spaceRepo.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));
        if (!memberRepo.existsBySpaceIdAndUserId(spaceId, user.getId())) {
            memberRepo.save(SpaceMember.builder()
                    .space(space)
                    .user(user)
                    .role("member")
                    .build());
            space.setMemberCount(space.getMemberCount() + 1);
            spaceRepo.save(space);
        }
        return toResponse(space, user);
    }

    public SpaceResponse leaveSpace(Long spaceId, User user) {
        Space space = spaceRepo.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));
        if (space.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Owner cannot leave their own space");
        }
        memberRepo.findBySpaceIdAndUserId(spaceId, user.getId()).ifPresent(m -> {
            memberRepo.delete(m);
            space.setMemberCount(Math.max(0, space.getMemberCount() - 1));
            spaceRepo.save(space);
        });
        return toResponse(space, user);
    }

    public List<SpacePostResponse> getPosts(Long spaceId, User viewer) {
        return postRepo.findBySpaceIdOrderByCreatedAtDesc(spaceId)
                .stream().map(p -> toPostResponse(p, viewer)).toList();
    }

    public SpacePostResponse createPost(Long spaceId, String content, User author) {
        Space space = spaceRepo.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found: " + spaceId));
        if (!memberRepo.existsBySpaceIdAndUserId(spaceId, author.getId())) {
            throw new RuntimeException("You must be a member to post in this space");
        }
        SpacePost post = SpacePost.builder()
                .space(space)
                .author(author)
                .content(content)
                .likeCount(0)
                .commentCount(0)
                .build();
        post = postRepo.save(post);
        space.setPostCount(space.getPostCount() + 1);
        spaceRepo.save(space);
        return toPostResponse(post, author);
    }

    @org.springframework.transaction.annotation.Transactional
    public SpacePostResponse toggleLike(Long postId, User user) {
        SpacePost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        User author = post.getAuthor();
        Optional<Like> existing = likeRepo.findByContentTypeAndContentIdAndUser("spacepost", postId, user);
        if (existing.isPresent()) {
            likeRepo.delete(existing.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            author.setTotalLikes(Math.max(0, author.getTotalLikes() - 1));
        } else {
            likeRepo.save(Like.builder()
                    .contentType("spacepost")
                    .contentId(postId)
                    .user(user)
                    .reactionType("like")
                    .build());
            post.setLikeCount(post.getLikeCount() + 1);
            author.setTotalLikes(author.getTotalLikes() + 1);
        }
        postRepo.save(post);
        userService.recalcScore(author, 0);
        return toPostResponse(post, user);
    }

    public List<SpaceResponse> getByOwnerId(Long ownerId, User viewer) {
        return spaceRepo.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream().map(s -> toResponse(s, viewer)).toList();
    }

    public SpaceResponse toResponse(Space space, User viewer) {
        boolean isMember = viewer != null && memberRepo.existsBySpaceIdAndUserId(space.getId(), viewer.getId());
        boolean isOwner = viewer != null && space.getOwner().getId().equals(viewer.getId());
        return SpaceResponse.builder()
                .id(space.getId())
                .name(space.getName())
                .slug(space.getSlug())
                .description(space.getDescription())
                .emoji(space.getEmoji())
                .owner(userService.toResponse(space.getOwner()))
                .memberCount(space.getMemberCount())
                .postCount(space.getPostCount())
                .createdAt(space.getCreatedAt())
                .member(isMember)
                .spaceOwner(isOwner)
                .isPaid(space.isPaid())
                .priceMonthly(space.getPriceMonthly())
                .build();
    }

    public SpacePostResponse toPostResponse(SpacePost post, User viewer) {
        boolean hasLiked = viewer != null
                && likeRepo.findByContentTypeAndContentIdAndUser("spacepost", post.getId(), viewer).isPresent();
        long commentCount = commentRepo.countByContentTypeAndContentId("spacepost", post.getId());
        return SpacePostResponse.builder()
                .id(post.getId())
                .spaceId(post.getSpace().getId())
                .author(userService.toResponse(post.getAuthor()))
                .content(post.getContent())
                .likeCount(post.getLikeCount())
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .hasLiked(hasLiked)
                .build();
    }

    private String generateSlug(String name) {
        String base = name.toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (base.isBlank()) base = "space";
        if (!spaceRepo.existsBySlug(base)) return base;
        // Append unique suffix; DB unique constraint is the true race guard
        return base + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
