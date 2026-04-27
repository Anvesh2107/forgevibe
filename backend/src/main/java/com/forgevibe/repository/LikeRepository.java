package com.forgevibe.repository;

import com.forgevibe.entity.Like;
import com.forgevibe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    List<Like> findByContentTypeAndContentId(String contentType, Long contentId);
    Optional<Like> findByContentTypeAndContentIdAndUser(String contentType, Long contentId, User user);
}
