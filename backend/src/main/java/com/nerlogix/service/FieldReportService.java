package com.nerlogix.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nerlogix.dto.FieldReportDto;
import com.nerlogix.dto.FieldReportPayload;
import com.nerlogix.entity.*;
import com.nerlogix.exception.ResourceNotFoundException;
import com.nerlogix.model.enums.*;
import com.nerlogix.repository.*;
import com.nerlogix.service.risk.RiskEngine;
import com.nerlogix.util.GeoUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class FieldReportService {

    private final FieldReportRepository fieldReportRepository;
    private final ReportImageRepository reportImageRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final RoadSegmentRepository roadSegmentRepository;
    private final RoadStatusHistoryRepository roadStatusHistoryRepository;
    private final DistrictRepository districtRepository;
    private final AuditLogService auditLogService;
    private final RiskEngine riskEngine;
    private final SseService sseService;

    public FieldReportService(
            FieldReportRepository fieldReportRepository,
            ReportImageRepository reportImageRepository,
            IncidentRepository incidentRepository,
            IncidentEventRepository incidentEventRepository,
            RoadSegmentRepository roadSegmentRepository,
            RoadStatusHistoryRepository roadStatusHistoryRepository,
            DistrictRepository districtRepository,
            AuditLogService auditLogService,
            RiskEngine riskEngine,
            SseService sseService) {
        this.fieldReportRepository = fieldReportRepository;
        this.reportImageRepository = reportImageRepository;
        this.incidentRepository = incidentRepository;
        this.incidentEventRepository = incidentEventRepository;
        this.roadSegmentRepository = roadSegmentRepository;
        this.roadStatusHistoryRepository = roadStatusHistoryRepository;
        this.districtRepository = districtRepository;
        this.auditLogService = auditLogService;
        this.riskEngine = riskEngine;
        this.sseService = sseService;
    }

    @Transactional
    public Map<String, Object> createFieldReport(FieldReportPayload payload, List<MultipartFile> images, User user) {
        Optional<FieldReport> existing = fieldReportRepository.findByClientId(payload.clientId());
        if (existing.isPresent()) {
            FieldReport r = existing.get();
            List<ReportImage> rImages = reportImageRepository.findByFieldReportId(r.getId());
            return Map.of("duplicate", true, "report", FieldReportDto.fromEntity(r, rImages));
        }

        FieldReport fr = new FieldReport();
        fr.setClientId(payload.clientId());
        fr.setUser(user);
        fr.setLat(payload.lat());
        fr.setLng(payload.lng());
        fr.setAccuracy(payload.accuracy());
        fr.setCapturedAt(payload.capturedAt() != null ? payload.capturedAt() : LocalDateTime.now());
        fr.setType(payload.type());
        fr.setSeverity(payload.severity());
        fr.setNote(payload.note());
        fr.setStatus(ReportStatus.PENDING);

        fr = fieldReportRepository.save(fr);

        List<ReportImage> reportImages = new ArrayList<>();
        File uploadFolder = new File("./uploads");
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                String ext = getExtension(file.getOriginalFilename());
                String filename = "report_" + UUID.randomUUID() + ext;
                File targetFile = new File(uploadFolder, filename);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(file.getBytes());
                } catch (Exception e) {
                    throw new RuntimeException("Failed to save image file: " + e.getMessage());
                }
                ReportImage img = reportImageRepository.save(new ReportImage(fr, "/api/uploads/" + filename));
                reportImages.add(img);
            }
        }

        auditLogService.recordAudit(user, "FIELD_REPORT_SUBMITTED", "FIELD_REPORT", fr.getId(), "Submitted field report for " + fr.getType(), "127.0.0.1");

        FieldReportDto dto = FieldReportDto.fromEntity(fr, reportImages);
        return Map.of("duplicate", false, "report", dto);
    }

    public Page<FieldReportDto> getFieldReports(User currentUser, Pageable pageable) {
        Page<FieldReport> page;
        if (currentUser.getRole() == Role.USER) {
            page = fieldReportRepository.findByUserId(currentUser.getId(), pageable);
        } else {
            page = fieldReportRepository.findAll(pageable);
        }

        List<FieldReportDto> dtos = page.getContent().stream().map(r -> {
            List<ReportImage> imgs = reportImageRepository.findByFieldReportId(r.getId());
            return FieldReportDto.fromEntity(r, imgs);
        }).toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional
    public FieldReportDto verifyReport(Long id, String moderatorNote, User moderator) {
        FieldReport fr = fieldReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field report not found: " + id));

        fr.setStatus(ReportStatus.VERIFIED);
        fr.setModeratorNote(moderatorNote);

        // Find nearest segment and district
        RoadSegment nearestSeg = findNearestSegment(fr.getLat(), fr.getLng());
        District nearestDist = findNearestDistrict(fr.getLat(), fr.getLng());

        final IncidentType reportType = fr.getType();
        final double reportLat = fr.getLat();
        final double reportLng = fr.getLng();

        // Check for merge within 2km & 6h
        List<Incident> openIncidents = incidentRepository.findAll().stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.REJECTED)
                .filter(i -> i.getType() == reportType)
                .filter(i -> i.getCreatedAt().isAfter(LocalDateTime.now().minusHours(6)))
                .filter(i -> GeoUtils.haversineDistanceKm(i.getLat(), i.getLng(), reportLat, reportLng) <= 2.0)
                .toList();

        Incident incident;
        if (!openIncidents.isEmpty()) {
            incident = openIncidents.get(0);
            if (fr.getSeverity() > incident.getSeverity()) {
                incident.setSeverity(fr.getSeverity());
            }
            incident.setDescription(incident.getDescription() + " | Verified report: " + fr.getNote());
            incident = incidentRepository.save(incident);
        } else {
            incident = new Incident();
            incident.setType(fr.getType());
            incident.setSeverity(fr.getSeverity());
            incident.setLat(fr.getLat());
            incident.setLng(fr.getLng());
            incident.setSegment(nearestSeg);
            incident.setDistrict(nearestDist);
            incident.setDescription("Verified field report: " + fr.getNote());
            incident.setStatus(IncidentStatus.VERIFIED);
            incident.setSource(IncidentSource.FIELD);
            incident.setReportId(fr.getId());
            incident.setCreatedBy(fr.getUser());
            incident = incidentRepository.save(incident);
        }

        fr.setIncident(incident);
        fr = fieldReportRepository.save(fr);

        incidentEventRepository.save(new IncidentEvent(incident, "VERIFIED", moderator, moderatorNote != null ? moderatorNote : "Report verified by moderator"));

        // Status rules
        if (nearestSeg != null) {
            SegmentStatus oldStatus = nearestSeg.getStatus();
            if (fr.getSeverity() == 3 && oldStatus != SegmentStatus.BLOCKED) {
                nearestSeg.setStatus(SegmentStatus.RESTRICTED);
                nearestSeg.setStatusReason("VERIFIED Incident: " + fr.getType() + " severity 3");
            } else if (fr.getSeverity() == 4 && isBlockingIncidentType(fr.getType())) {
                nearestSeg.setStatus(SegmentStatus.BLOCKED);
                nearestSeg.setStatusReason("VERIFIED Incident: " + fr.getType() + " severity 4");
            }

            if (nearestSeg.getStatus() != oldStatus) {
                roadSegmentRepository.save(nearestSeg);
                roadStatusHistoryRepository.save(new RoadStatusHistory(nearestSeg, oldStatus, nearestSeg.getStatus(), nearestSeg.getStatusReason(), moderator));
                sseService.broadcast("road.updated", Map.of("segmentId", nearestSeg.getId(), "status", nearestSeg.getStatus()));
            }

            riskEngine.computeSegmentRisk(nearestSeg);
        }

        auditLogService.recordAudit(moderator, "FIELD_REPORT_VERIFIED", "FIELD_REPORT", fr.getId(), "Verified field report", "127.0.0.1");

        List<ReportImage> imgs = reportImageRepository.findByFieldReportId(fr.getId());
        return FieldReportDto.fromEntity(fr, imgs);
    }

    @Transactional
    public FieldReportDto rejectReport(Long id, String moderatorNote, User moderator) {
        FieldReport fr = fieldReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field report not found: " + id));

        fr.setStatus(ReportStatus.REJECTED);
        fr.setModeratorNote(moderatorNote);
        fr = fieldReportRepository.save(fr);

        auditLogService.recordAudit(moderator, "FIELD_REPORT_REJECTED", "FIELD_REPORT", fr.getId(), "Rejected field report", "127.0.0.1");

        List<ReportImage> imgs = reportImageRepository.findByFieldReportId(fr.getId());
        return FieldReportDto.fromEntity(fr, imgs);
    }

    private boolean isBlockingIncidentType(IncidentType type) {
        return type == IncidentType.LANDSLIDE || type == IncidentType.FLOOD ||
               type == IncidentType.BRIDGE_DAMAGE || type == IncidentType.ROAD_DAMAGE;
    }

    private RoadSegment findNearestSegment(double lat, double lng) {
        List<RoadSegment> segments = roadSegmentRepository.findAll();
        RoadSegment nearest = null;
        double minDistance = Double.MAX_VALUE;
        for (RoadSegment s : segments) {
            double d1 = GeoUtils.haversineDistanceKm(lat, lng, s.getFromNode().getLat(), s.getFromNode().getLng());
            double d2 = GeoUtils.haversineDistanceKm(lat, lng, s.getToNode().getLat(), s.getToNode().getLng());
            double dist = Math.min(d1, d2);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = s;
            }
        }
        return nearest;
    }

    private District findNearestDistrict(double lat, double lng) {
        List<District> districts = districtRepository.findAll();
        District nearest = null;
        double minDistance = Double.MAX_VALUE;
        for (District d : districts) {
            double dist = GeoUtils.haversineDistanceKm(lat, lng, d.getLat(), d.getLng());
            if (dist < minDistance) {
                minDistance = dist;
                nearest = d;
            }
        }
        return nearest;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".png";
        return filename.substring(filename.lastIndexOf("."));
    }
}
