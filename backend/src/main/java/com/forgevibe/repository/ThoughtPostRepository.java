package com.forgevibe.repository;

import com.forgevibe.entity.ThoughtPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ThoughtPostRepository extends JpaRepository<ThoughtPost, Long> {
    List<ThoughtPost> findByStatusOrderByCreatedAtDesc(String status);
    List<ThoughtPost> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    boolean existsByContentIgnoreCase(String content);
}
