package com.forgevibe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String stack;

    @Column(length = 200)
    private String repoUrl;

    @Column(length = 200)
    private String liveUrl;

    @Builder.Default
    private Integer aiScore = 0;

    @Builder.Default
    private Integer stars = 0;

    @Builder.Default
    private Integer diamonds = 0;

    @Builder.Default
    @Column(length = 20)
    private String analysisStatus = "pending";

    private Integer architectureScore;
    private Integer securityScore;
    private Integer qualityScore;
    private Integer docsScore;

    @Column(columnDefinition = "TEXT")
    private String analysisSummary;

    @Column(length = 500)
    private String analysisVibeCheck;

    @Column(columnDefinition = "TEXT")
    private String analysisStrengths;

    @Column(columnDefinition = "TEXT")
    private String analysisImprovements;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
