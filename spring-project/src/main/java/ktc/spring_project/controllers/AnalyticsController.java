package ktc.spring_project.controllers;

import ktc.spring_project.services.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(analyticsService.getOverviewStats());
    }

    @GetMapping("/correlation")
    public ResponseEntity<Map<String, Object>> getCorrelation() {
        return ResponseEntity.ok(analyticsService.getCorrelationData());
    }

    @GetMapping("/feature-importance")
    public ResponseEntity<List<Map<String, Object>>> getFeatureImportance() {
        return ResponseEntity.ok(analyticsService.getFeatureImportance());
    }
}

