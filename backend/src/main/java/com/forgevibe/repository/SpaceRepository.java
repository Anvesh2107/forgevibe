package com.forgevibe.repository;

import com.forgevibe.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findAllByOrderByMemberCountDesc();
    List<Space> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    long countByOwnerId(Long ownerId);
    Optional<Space> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
