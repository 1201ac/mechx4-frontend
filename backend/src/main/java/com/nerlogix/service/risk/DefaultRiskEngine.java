package com.nerlogix.service.risk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nerlogix.dto.RiskFactorDto;
import com.nerlogix.entity.*;
import com.nerlogix.model.enums.AlertSeverity;
import com.nerlogix.model.enums.AlertType;
import com.nerlogix.model.enums.IncidentStatus;
import com.nerlogix.model.enums.IncidentType;
import com.nerlogix.model.enums.SegmentStatus;
import com.nerlogix.model.enums.WeatherCondition;
import com.nerlogix.repository.*;
import com.nerlogix.service.AlertService;
import com.nerlogix.util.GeoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DefaultRiskEngine implements RiskEngine {

    private static final Logger log = LoggerFactory.getLogger(DefaultRiskEngine.class);

    private final RoadSegmentRepository roadSegmentRepository;
    private final WeatherLogRepository weatherLogRepository;
    private final IncidentRepository incidentRepository;
    private final DistrictRepository districtRepository;
    private final AlertService alertService;
    private final ObjectMapper objectMapper;

    public DefaultRiskEngine(
            RoadSegmentRepository roadSegmentRepository,
            WeatherLogRepository weatherLogRepository,
            IncidentRepository incidentRepository,
            DistrictRepository districtRepository,
            AlertService alertService,
            ObjectMapper objectMapper) {
        this.roadSegmentRepository = roadSegmentRepository;
        this.weatherLogRepository = weatherLogRepository;
        this.incidentRepository = incidentRepository;
        this.districtRepository = districtRepository;
        this.alertService = alertService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public RiskCalculationResult computeSegmentRisk(RoadSegment segment) {
        List<RiskFactorDto> factors = new ArrayList<>();
        double totalScore = 0.0;

        // Status Override Check
        if (segment.getStatus() == SegmentStatus.BLOCKED) {
            factors.add(new RiskFactorDto("Status: BLOCKED override", 100));
            saveSegmentRisk(segment, 100.0, factors);
            return new RiskCalculationResult(100.0, factors);
        } else if (segment.getStatus() == SegmentStatus.RESTRICTED) {
            factors.add(new RiskFactorDto("Status: RESTRICTED override", 15));
            totalScore += 15.0;
        }

        // 1. Weather / Rainfall
        District district = segment.getFromNode() != null ? segment.getFromNode().getDistrict() : null;
        if (district == null && segment.getToNode() != null) {
            district = segment.getToNode().getDistrict();
        }

        WeatherCondition latestCond = WeatherCondition.NONE;
        Double latestRainMm = 0.0;

        if (district != null) {
            List<WeatherLog> logs = weatherLogRepository.findByDistrictIdOrderByLoggedAtDesc(district.getId());
            if (!logs.isEmpty()) {
                WeatherLog latestLog = logs.get(0);
                latestCond = latestLog.getCondition() != null ? latestLog.getCondition() : WeatherCondition.NONE;
                latestRainMm = latestLog.getRainMm() != null ? latestLog.getRainMm() : 0.0;
            }
        }

        int rainPoints = 0;
        if (latestRainMm >= 100.0 || latestCond == WeatherCondition.EXTREME) {
            rainPoints = 30;
            factors.add(new RiskFactorDto("Extreme rainfall / storm", 30));
        } else if (latestCond == WeatherCondition.HEAVY) {
            rainPoints = 22;
            factors.add(new RiskFactorDto("Heavy monsoon rainfall", 22));
        } else if (latestCond == WeatherCondition.MODERATE) {
            rainPoints = 12;
            factors.add(new RiskFactorDto("Moderate rainfall", 12));
        } else if (latestCond == WeatherCondition.LIGHT) {
            rainPoints = 5;
            factors.add(new RiskFactorDto("Light rainfall", 5));
        }
        totalScore += rainPoints;

        // 72h total rainfall bonus
        if (district != null) {
            LocalDateTime cutoff = LocalDateTime.now().minusHours(72);
            Double total72hRain = weatherLogRepository.findByDistrictIdOrderByLoggedAtDesc(district.getId()).stream()
                    .filter(w -> w.getLoggedAt() != null && w.getLoggedAt().isAfter(cutoff))
                    .mapToDouble(w -> w.getRainMm() != null ? w.getRainMm() : 0.0)
                    .sum();
            if (total72hRain >= 150.0) {
                factors.add(new RiskFactorDto("High 72-hour cumulative saturation (+150mm)", 5));
                totalScore += 5.0;
            }
        }

        // 2. Terrain & Prone Factors
        int terrainPoints = Math.min(15, (segment.getTerrainClass() != null ? segment.getTerrainClass() : 1) * 3);
        factors.add(new RiskFactorDto("Steep hill terrain class " + segment.getTerrainClass(), terrainPoints));
        totalScore += terrainPoints;

        if (Boolean.TRUE.equals(segment.getLandslideProne()) && latestCond != WeatherCondition.NONE) {
            factors.add(new RiskFactorDto("Landslide-prone corridor during rainfall", 8));
            totalScore += 8.0;
        }

        if (Boolean.TRUE.equals(segment.getFloodProne()) && (latestCond == WeatherCondition.MODERATE || latestCond == WeatherCondition.HEAVY || latestCond == WeatherCondition.EXTREME)) {
            factors.add(new RiskFactorDto("Flood-prone river basin during heavy rain", 8));
            totalScore += 8.0;
        }

        // 3. Nearby Incidents within 15km
        double midLat = (segment.getFromNode().getLat() + segment.getToNode().getLat()) / 2.0;
        double midLng = (segment.getFromNode().getLng() + segment.getToNode().getLng()) / 2.0;

        List<Incident> openIncidents = incidentRepository.findByStatus(IncidentStatus.VERIFIED);
        int incidentPoints = 0;
        boolean hasCongestion = false;

        for (Incident inc : openIncidents) {
            double dist = GeoUtils.haversineDistanceKm(midLat, midLng, inc.getLat(), inc.getLng());
            if (dist <= 15.0) {
                int pts = (inc.getSeverity() != null ? inc.getSeverity() : 1) * 4;
                incidentPoints += pts;
                factors.add(new RiskFactorDto("Active verified incident nearby: " + inc.getType() + " (" + Math.round(dist) + " km)", pts));
            }
            if (inc.getSegment() != null && inc.getSegment().getId().equals(segment.getId()) && inc.getType() == IncidentType.CONGESTION) {
                hasCongestion = true;
            }
        }
        incidentPoints = Math.min(25, incidentPoints);
        totalScore += incidentPoints;

        if (hasCongestion || (segment.getStatusReason() != null && segment.getStatusReason().toLowerCase().contains("congestion"))) {
            factors.add(new RiskFactorDto("Congestion bottleneck active", 10));
            totalScore += 10.0;
        }

        // Clamping to 0-100
        double finalScore = Math.min(100.0, Math.max(0.0, totalScore));
        saveSegmentRisk(segment, finalScore, factors);

        // Check if High Risk Corridor alert should be created
        if (finalScore >= 60.0 && segment.getStatus() != SegmentStatus.BLOCKED) {
            String openKey = "HIGH_RISK_CORRIDOR:" + segment.getId();
            alertService.createOrUpdateAlert(
                    AlertType.HIGH_RISK_CORRIDOR,
                    AlertSeverity.WARNING,
                    "ROAD_SEGMENT",
                    segment.getId(),
                    openKey,
                    Map.of(
                            "en", "High Risk Corridor Warning",
                            "hi", "उच्च जोखिम वाला गलियारा चेतावनी",
                            "as", "উচ্চ বিপদৰ কৰিডৰ সতৰ্কবাণী",
                            "bn", "উচ্চ ঝুঁকিপূর্ণ করিডোর সতর্কতা"
                    ),
                    Map.of(
                            "en", String.format("High risk score (%d/100) detected on corridor %s (%s).", Math.round(finalScore), segment.getName(), segment.getHighwayCode()),
                            "hi", String.format("गलियारे %s पर उच्च जोखिम अंक (%d/100) दर्ज हुआ।", segment.getName(), Math.round(finalScore)),
                            "as", String.format("করিডৰ %sত উচ্চ বিপদৰ স্কোৰ (%d/100) ধৰা পৰিছে।", segment.getName(), Math.round(finalScore)),
                            "bn", String.format("করিডোর %s এ উচ্চ ঝুঁকির স্কোর (%d/100) রেকর্ড করা হয়েছে।", segment.getName(), Math.round(finalScore))
                    )
            );
        } else if (finalScore < 60.0) {
            alertService.resolveAlertByOpenKey("HIGH_RISK_CORRIDOR:" + segment.getId());
        }

        return new RiskCalculationResult(finalScore, factors);
    }

    @Override
    @Transactional(readOnly = true)
    public double computeDistrictConnectivity(District district) {
        List<RoadSegment> accessSegments = roadSegmentRepository.findAll().stream()
                .filter(s -> (s.getFromNode() != null && s.getFromNode().getDistrict() != null && s.getFromNode().getDistrict().getId().equals(district.getId())) ||
                             (s.getToNode() != null && s.getToNode().getDistrict() != null && s.getToNode().getDistrict().getId().equals(district.getId())))
                .toList();

        if (accessSegments.isEmpty()) return 100.0;

        double weightedUsableShare = 0.0;
        double totalRiskSum = 0.0;

        for (RoadSegment s : accessSegments) {
            if (s.getStatus() == SegmentStatus.OPEN) {
                weightedUsableShare += 1.0;
            } else if (s.getStatus() == SegmentStatus.RESTRICTED) {
                weightedUsableShare += 0.5;
            } // BLOCKED = 0.0

            totalRiskSum += (s.getRiskScore() != null ? s.getRiskScore() : 0.0);
        }

        double baseUsability = (weightedUsableShare / accessSegments.size()) * 100.0;
        double avgRisk = totalRiskSum / accessSegments.size();

        double finalScore = Math.max(0.0, baseUsability - (avgRisk * 0.3));

        // If all access segments are BLOCKED, district is INACCESSIBLE
        boolean allBlocked = accessSegments.stream().allMatch(s -> s.getStatus() == SegmentStatus.BLOCKED);
        if (allBlocked) return 0.0;

        return finalScore;
    }

    @Override
    @Transactional
    public void recomputeAffectedSegmentsForDistrict(Long districtId) {
        List<RoadSegment> segments = roadSegmentRepository.findAll().stream()
                .filter(s -> (s.getFromNode() != null && s.getFromNode().getDistrict() != null && s.getFromNode().getDistrict().getId().equals(districtId)) ||
                             (s.getToNode() != null && s.getToNode().getDistrict() != null && s.getToNode().getDistrict().getId().equals(districtId)))
                .toList();

        for (RoadSegment s : segments) {
            computeSegmentRisk(s);
        }
    }

    @Override
    @Transactional
    public void recomputeAll() {
        List<RoadSegment> segments = roadSegmentRepository.findAll();
        for (RoadSegment s : segments) {
            computeSegmentRisk(s);
        }
    }

    private void saveSegmentRisk(RoadSegment segment, double score, List<RiskFactorDto> factors) {
        segment.setRiskScore(score);
        try {
            segment.setRiskFactors(objectMapper.writeValueAsString(factors));
        } catch (Exception e) {
            segment.setRiskFactors("[]");
        }
        segment.setUpdatedAt(LocalDateTime.now());
        roadSegmentRepository.save(segment);
    }
}
