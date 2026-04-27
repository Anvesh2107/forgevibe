package com.forgevibe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CommentRequest {
    @NotBlank @Size(max = 500) private String content;
    private Long parentId; // null = top-level, non-null = reply
}
