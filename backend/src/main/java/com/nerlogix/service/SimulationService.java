package com.nerlogix.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nerlogix.entity.*;
import com.nerlogix.model.enums.RoutePlanStatus;
import com.nerlogix.model.enums.ShipmentStatus;
import com.nerlogix.repository.*;
import com.nerlogix.util.GeoUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SimulationService {

    private final ShipmentRepository shipmentRepository;
    private final RoutePlanRepository routePlanRepository;
    private final VehicleRepository vehicleRepository;
    private final VehiclePositionRepository vehiclePositionRepository;
    private final SettingRepository settingRepository;
    private final SseService sseService;
    private final ObjectMapper objectMapper;

    private int tickCount = 0;

    public SimulationService(
            ShipmentRepository shipmentRepository,
            RoutePlanRepository routePlanRepository,
            VehicleRepository vehicleRepository,
            VehiclePositionRepository vehiclePositionRepository,
            SettingRepository settingRepository,
            SseService sseService,
            ObjectMapper objectMapper) {
        this.shipmentRepository = shipmentRepository;
        this.routePlanRepository = routePlanRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehiclePositionRepository = vehiclePositionRepository;
        this.settingRepository = settingRepository;
        this.sseService = sseService;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelayString = "${simulation.tick-ms:3000}")
    @Transactional
    public void runSimulationTick() {
        Optional<Setting> simSetting = settingRepository.findBySettingKey("simulation.enabled");
        if (simSetting.isPresent() && "false".equalsIgnoreCase(simSetting.get().getSettingValue())) {
            return;
        }

        tickCount++;
        List<Shipment> activeShipments = shipmentRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShipmentStatus.IN_TRANSIT || s.getStatus() == ShipmentStatus.DELAYED)
                .filter(s -> s.getVehicle() != null)
                .toList();

        for (Shipment s : activeShipments) {
            Vehicle v = s.getVehicle();
            if (v == null) continue;

            // If real driver GPS fix newer than 30s, skip simulation
            if (v.getLastSeen() != null && v.getLastSeen().isAfter(LocalDateTime.now().minusSeconds(30))) {
                continue;
            }

            Optional<RoutePlan> planOpt = routePlanRepository.findFirstByShipmentIdAndStatusOrderByIdDesc(s.getId(), RoutePlanStatus.ACTIVE);
            if (planOpt.isEmpty() || planOpt.get().getGeometry() == null || planOpt.get().getGeometry().isBlank()) {
                continue;
            }

            List<double[]> coords = parseGeometry(planOpt.get().getGeometry());
            if (coords.size() < 2) continue;

            double currentProgress = s.getProgressPct() != null ? s.getProgressPct() : 0.0;
            if (currentProgress >= 100.0) {
                // Reached destination, stay at last point
                double[] destPt = coords.get(coords.size() - 1);
                v.setLat(destPt[0]);
                v.setLng(destPt[1]);
                v.setSpeedKmph(0.0);
                v.setLastSeen(LocalDateTime.now());
                vehicleRepository.save(v);
                continue;
            }

            // Move forward by 3% per tick (or based on coords length)
            double newProgress = Math.min(100.0, currentProgress + 3.0);
            s.setProgressPct(newProgress);

            // Interpolate position along coords
            double targetIndex = (newProgress / 100.0) * (coords.size() - 1);
            int idx = (int) Math.floor(targetIndex);
            int nextIdx = Math.min(coords.size() - 1, idx + 1);
            double fraction = targetIndex - idx;

            double[] p1 = coords.get(idx);
            double[] p2 = coords.get(nextIdx);

            double lat = p1[0] + (p2[0] - p1[0]) * fraction;
            double lng = p1[1] + (p2[1] - p1[1]) * fraction;

            double heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
            double speed = 45.0 + (newProgress % 10.0);

            v.setLat(lat);
            v.setLng(lng);
            v.setHeading(heading);
            v.setSpeedKmph(speed);
            v.setLastSeen(LocalDateTime.now());
            vehicleRepository.save(v);

            // Store position history every 5th tick
            if (tickCount % 5 == 0) {
                VehiclePosition pos = new VehiclePosition(v, lat, lng, heading, speed);
                vehiclePositionRepository.save(pos);
            }

            // Update ETA and delay
            int totalEtaMin = planOpt.get().getEtaMin() != null ? planOpt.get().getEtaMin().intValue() : 180;
            int remainingMin = (int) (totalEtaMin * (1.0 - (newProgress / 100.0)));
            s.setCurrentEta(LocalDateTime.now().plusMinutes(remainingMin));

            if (s.getPlannedEta() != null && s.getCurrentEta().isAfter(s.getPlannedEta().plusMinutes(20))) {
                if (s.getStatus() == ShipmentStatus.IN_TRANSIT) {
                    s.setStatus(ShipmentStatus.DELAYED);
                    s.setDelayMin((int) java.time.Duration.between(s.getPlannedEta(), s.getCurrentEta()).toMinutes());
                    sseService.broadcast("shipment.updated", Map.of("id", s.getId(), "status", s.getStatus()));
                }
            }

            shipmentRepository.save(s);

            // Broadcast vehicle update
            sseService.broadcast("vehicle.update", Map.of(
                    "vehicleId", v.getId(),
                    "regNo", v.getRegNo(),
                    "lat", v.getLat(),
                    "lng", v.getLng(),
                    "heading", v.getHeading(),
                    "speedKmph", v.getSpeedKmph(),
                    "progressPct", s.getProgressPct()
            ));
        }
    }

    private List<double[]> parseGeometry(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<double[]>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private double calculateBearing(double lat1, double lon1, double lat2, double lon2) {
        double dLon = Math.toRadians(lon2 - lon1);
        double l1 = Math.toRadians(lat1);
        double l2 = Math.toRadians(lat2);
        double y = Math.sin(dLon) * Math.cos(l2);
        double x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dLon);
        double brng = Math.toDegrees(Math.atan2(y, x));
        return (brng + 360) % 360;
    }
}
