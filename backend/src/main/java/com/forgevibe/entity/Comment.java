package com.forgevibe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Generic comment for both thoughts and projects.
 * contentType: "thought" | "project"
 * parentId: null = top-level weigh-in; non-null = 1-level reply
 */
@Entity
@Table(name = "comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** null = top-level; non-null = reply (1-level only) */
    @Column(name = "parent_id")
    private Long parentId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
