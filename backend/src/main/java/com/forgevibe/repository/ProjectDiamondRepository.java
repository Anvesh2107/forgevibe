package com.forgevibe.repository;

import com.forgevibe.entity.ProjectDiamond;
import com.forgevibe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProjectDiamondRepository extends JpaRepository<ProjectDiamond, Long> {

    Optional<ProjectDiamond> findByProjectIdAndUser(Long projectId, User user);

    List<ProjectDiamond> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    boolean existsByUserAndCreatedAtAfter(User user, LocalDateTime since);
}
