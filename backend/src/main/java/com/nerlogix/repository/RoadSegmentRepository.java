package com.nerlogix.repository;

import com.nerlogix.entity.RoadSegment;
import com.nerlogix.model.enums.SegmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadSegmentRepository extends JpaRepository<RoadSegment, Long> {
    List<RoadSegment> findByStatus(SegmentStatus status);
    List<RoadSegment> findByFromNodeIdOrToNodeId(Long fromNodeId, Long toNodeId);
}
