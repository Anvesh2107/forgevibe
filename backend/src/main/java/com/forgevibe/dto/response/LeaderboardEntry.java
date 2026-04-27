package com.forgevibe.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaderboardEntry {
    private Integer rank;
    private UserResponse user;
    private Integer forgeScore;
    private Integer diamonds;
    private Integer stars;
    private Integer totalLikes;
}
