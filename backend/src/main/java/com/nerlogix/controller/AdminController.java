package com.nerlogix.controller;

import com.nerlogix.dto.DemoRainRequest;
import com.nerlogix.dto.DistrictWeatherDto;
import com.nerlogix.service.WeatherService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final WeatherService weatherService;

    public AdminController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/audit")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/demo/rain")
    public ResponseEntity<DistrictWeatherDto> triggerDemoRain(@Valid @RequestBody DemoRainRequest request) {
        DistrictWeatherDto dto = weatherService.triggerDemoRain(request.districtId(), request.condition());
        return ResponseEntity.ok(dto);
    }
}
