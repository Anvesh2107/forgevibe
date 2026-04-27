package com.forgevibe.repository;

import com.forgevibe.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByOrderByCreatedAtDesc();
    List<Project> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}
