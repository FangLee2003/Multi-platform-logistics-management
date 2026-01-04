package ktc.spring_project.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ktc.spring_project.dto.AnalyticsOverviewDTO;
import ktc.spring_project.dto.CorrelationAnalysisDTO;
import ktc.spring_project.dto.FeatureImportanceDTO;
import ktc.spring_project.services.DataAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Data Analytics", description = "AI/ML Analytics for Product Backorder Prediction")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "https://*"}, allowCredentials = "true")
public class DataAnalyticsController {

    @Autowired
    private DataAnalyticsService analyticsService;

    @GetMapping("/overview")
    @Operation(summary = "Get analytics overview", 
               description = "Returns overview statistics including backorder rates and averages")
    public ResponseEntity<AnalyticsOverviewDTO> getAnalyticsOverview() {
        try {
            AnalyticsOverviewDTO overview = analyticsService.getAnalyticsOverview();
            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/correlation")
    @Operation(summary = "Get correlation analysis", 
               description = "Returns correlation analysis between features and backorder status")
    public ResponseEntity<CorrelationAnalysisDTO> getCorrelationAnalysis() {
        try {
            CorrelationAnalysisDTO correlation = analyticsService.getCorrelationAnalysis();
            return ResponseEntity.ok(correlation);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/feature-importance")
    @Operation(summary = "Get feature importance", 
               description = "Returns ranked list of feature importance for backorder prediction")
    public ResponseEntity<List<FeatureImportanceDTO>> getFeatureImportance() {
        try {
            List<FeatureImportanceDTO> features = analyticsService.getFeatureImportance();
            return ResponseEntity.ok(features);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}
