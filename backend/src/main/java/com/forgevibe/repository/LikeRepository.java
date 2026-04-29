package com.forgevibe.repository;

import com.forgevibe.entity.Like;
import com.forgevibe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    List<Like> findByContentTypeAndContentId(String contentType, Long contentId);
    Optional<Like> findByContentTypeAndContentIdAndUser(String contentType, Long contentId, User user);

    @Query("SELECT p.author.id, COUNT(l) FROM com.forgevibe.entity.Project p JOIN Like l ON l.contentId = p.id WHERE l.contentType = 'project' AND l.createdAt >= :since GROUP BY p.author.id")
    List<Object[]> countProjectLikesPerAuthorSince(@Param("since") LocalDateTime since);

    @Query("SELECT t.author.id, COUNT(l) FROM com.forgevibe.entity.ThoughtPost t JOIN Like l ON l.contentId = t.id WHERE l.contentType = 'thought' AND l.createdAt >= :since GROUP BY t.author.id")
    List<Object[]> countThoughtLikesPerAuthorSince(@Param("since") LocalDateTime since);

    @Query("SELECT p.author.id, COUNT(l) FROM com.forgevibe.entity.Project p JOIN Like l ON l.contentId = p.id WHERE l.contentType = 'star' AND l.createdAt >= :since GROUP BY p.author.id")
    List<Object[]> countStarsPerAuthorSince(@Param("since") LocalDateTime since);
}
