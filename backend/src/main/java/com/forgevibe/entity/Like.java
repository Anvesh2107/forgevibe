package com.forgevibe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Generic reaction/like for both thoughts and projects.
 * contentType: "thought" | "project"
 * contentId:   the id of the thought or project
 * reactionType: "agree" | "brilliant" | "build_it" | "respect" | "fire"
 */
@Entity
@Table(name = "likes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"content_type", "content_id", "user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Like {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "reaction_type", nullable = false, length = 20)
    @Builder.Default
    private String reactionType = "agree";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
