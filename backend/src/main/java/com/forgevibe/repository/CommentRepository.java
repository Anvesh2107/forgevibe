package com.forgevibe.repository;

import com.forgevibe.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByContentTypeAndContentIdAndParentIdIsNullOrderByCreatedAtAsc(String contentType, Long contentId);
    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);
    long countByContentTypeAndContentId(String contentType, Long contentId);
}
