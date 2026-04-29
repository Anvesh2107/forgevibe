package com.forgevibe.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SpaceResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String emoji;
    private UserResponse owner;
    private Integer memberCount;
    private Integer postCount;
    private LocalDateTime createdAt;
    private boolean member;
    private boolean spaceOwner;
    private boolean isPaid;
    private Double priceMonthly;
}
