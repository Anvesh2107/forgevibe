package com.forgevibe.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectResponse {

    // Core backend fields
    private Long id;
    private String title;
    private String description;
    private String stack;
    private String repoUrl;
    private String liveUrl;
    private Integer aiScore;
    private Integer stars;
    private Integer diamonds;
    private UserResponse author;
    private Map<String, Long> reactions;
    private String userReaction;
    private Long commentCount;
    private LocalDateTime createdAt;

    // Frontend-compatible aliases and computed fields
    private String name;           // = title
    private String githubUrl;      // = repoUrl
    private UserResponse user;     // = author
    private String tags;           // JSON array from stack CSV
    private Long likeCount;
    private Boolean hasLiked;
    private Boolean hasDiamond;
    private Integer diamondCount;  // = diamonds count
    private Integer githubStars;   // = stars
    private Double forgevibeScore;
    private String coverImageUrl;
    private String analysisStatus;
    private Integer rank;
    private Integer weeklyRankChange;
    private List<DiamondGiverDto> diamondGivers;

    // Rich AI analysis object (null until analyzed)
    private AnalysisDto analysis;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DiamondGiverDto {
        private Long id;
        private String username;
        private String avatarUrl;
        private String note;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AnalysisDto {
        private Integer architectureScore;
        private Integer securityScore;
        private Integer qualityScore;
        private Integer docsScore;
        private String summary;
        private String vibeCheck;
        private String strengths;    // JSON array string
        private String improvements; // JSON array string
    }
}
