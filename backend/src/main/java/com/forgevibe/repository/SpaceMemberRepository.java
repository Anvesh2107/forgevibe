package com.forgevibe.repository;

import com.forgevibe.entity.SpaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SpaceMemberRepository extends JpaRepository<SpaceMember, Long> {
    boolean existsBySpaceIdAndUserId(Long spaceId, Long userId);
    Optional<SpaceMember> findBySpaceIdAndUserId(Long spaceId, Long userId);
    List<SpaceMember> findBySpaceId(Long spaceId);
    void deleteBySpaceId(Long spaceId);
}
