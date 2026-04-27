package com.forgevibe.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentResponse {
    private Long id;
    private String content;
    private UserResponse author;
    private Long parentId;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
}
