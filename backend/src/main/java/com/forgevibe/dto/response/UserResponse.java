package com.forgevibe.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private Integer forgeScore;
    private Integer reputationPoints;
    private Integer diamonds;
    private Integer stars;
    private Integer totalLikes;
    private Integer publicRepoCount;
    private Integer followerCount;
    private Boolean verified;
}
