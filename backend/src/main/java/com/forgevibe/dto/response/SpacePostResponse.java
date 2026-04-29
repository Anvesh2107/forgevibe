package com.forgevibe.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SpacePostResponse {
    private Long id;
    private Long spaceId;
    private UserResponse author;
    private String content;
    private Integer likeCount;
    private Long commentCount;
    private LocalDateTime createdAt;
    private boolean hasLiked;
}
