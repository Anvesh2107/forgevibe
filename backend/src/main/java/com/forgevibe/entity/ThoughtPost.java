package com.forgevibe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "thought_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThoughtPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** pending | published | needs_context | blocked */
    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    @Builder.Default
    private Integer aiConfidence = 0;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String aiReason = "";

    @Column(columnDefinition = "TEXT")
    private String appealMessage;

    /** pending | approved | rejected */
    private String appealStatus;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
