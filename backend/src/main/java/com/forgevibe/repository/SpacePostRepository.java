package com.forgevibe.repository;

import com.forgevibe.entity.SpacePost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpacePostRepository extends JpaRepository<SpacePost, Long> {
    List<SpacePost> findBySpaceIdOrderByCreatedAtDesc(Long spaceId);
    List<SpacePost> findBySpaceId(Long spaceId);
}
