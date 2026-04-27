package com.forgevibe.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThoughtResponse {
    private Long id;
    private String content;
    private String status;        // pending, published, needs_context, blocked
    private Integer aiConfidence;
    private String aiReason;
    private UserResponse author;
    private UserResponse user;    // alias for author — used by frontend ThoughtPost component
    private Map<String, Long> reactions; // agree, brilliant, build_it, respect, fire
    private String userReaction;         // current user's reaction type (nullable)
    private Long likeCount;
    private Boolean hasLiked;
    private Long commentCount;
    private LocalDateTime createdAt;
}
