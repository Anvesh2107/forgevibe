package com.forgevibe.repository;

import com.forgevibe.entity.ProjectDiamond;
import com.forgevibe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProjectDiamondRepository extends JpaRepository<ProjectDiamond, Long> {

    Optional<ProjectDiamond> findByProjectIdAndUser(Long projectId, User user);

    List<ProjectDiamond> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    boolean existsByUserAndCreatedAtAfter(User user, LocalDateTime since);

    @Query("SELECT d.project.author.id, COUNT(d) FROM ProjectDiamond d WHERE d.createdAt >= :since GROUP BY d.project.author.id")
    List<Object[]> countDiamondsPerAuthorSince(@Param("since") LocalDateTime since);
}
