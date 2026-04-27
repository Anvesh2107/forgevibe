package com.forgevibe.service;

import com.forgevibe.dto.request.CommentRequest;
import com.forgevibe.dto.response.CommentResponse;
import com.forgevibe.entity.Comment;
import com.forgevibe.entity.Project;
import com.forgevibe.entity.ThoughtPost;
import com.forgevibe.entity.User;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepo;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ProjectRepository projectRepository;
    private final ThoughtPostRepository thoughtPostRepository;

    public CommentResponse addComment(String contentType, Long contentId, CommentRequest req, User author) {
        Comment comment = Comment.builder()
                .content(req.getContent())
                .contentType(contentType)
                .contentId(contentId)
                .author(author)
                .parentId(req.getParentId())
                .build();
        comment = commentRepo.save(comment);
        notifyContentOwner(contentType, contentId, author);
        return toResponse(comment);
    }

    private void notifyContentOwner(String contentType, Long contentId, User commenter) {
        if ("project".equals(contentType)) {
            projectRepository.findById(contentId).ifPresent(project -> {
                User owner = project.getAuthor();
                if (owner != null && !owner.getId().equals(commenter.getId())) {
                    notificationService.create(owner, "commented", Map.of(
                            "fromUser", commenter.getUsername(),
                            "projectId", contentId,
                            "projectName", project.getTitle()
                    ));
                }
            });
        } else if ("thought".equals(contentType)) {
            thoughtPostRepository.findById(contentId).ifPresent(thought -> {
                User owner = thought.getAuthor();
                if (owner != null && !owner.getId().equals(commenter.getId())) {
                    notificationService.create(owner, "commented", Map.of(
                            "fromUser", commenter.getUsername(),
                            "thoughtId", contentId
                    ));
                }
            });
        }
    }

    public List<CommentResponse> getComments(String contentType, Long contentId) {
        List<Comment> topLevel = commentRepo.findByContentTypeAndContentIdAndParentIdIsNullOrderByCreatedAtAsc(
                contentType, contentId);

        return topLevel.stream().map(c -> {
            CommentResponse resp = toResponse(c);
            List<CommentResponse> replies = commentRepo
                    .findByParentIdOrderByCreatedAtAsc(c.getId())
                    .stream().map(this::toResponse).toList();
            resp.setReplies(replies);
            return resp;
        }).toList();
    }

    private CommentResponse toResponse(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .author(userService.toResponse(c.getAuthor()))
                .parentId(c.getParentId())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
