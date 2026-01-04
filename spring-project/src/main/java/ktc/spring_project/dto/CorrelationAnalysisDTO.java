package ktc.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CorrelationAnalysisDTO {
    private List<CorrelationPoint> correlations;
    private List<CategoryDistribution> potentialIssueDistribution;
    private List<CategoryDistribution> deckRiskDistribution;
    private List<CategoryDistribution> oeConstraintDistribution;
    private List<CategoryDistribution> ppapRiskDistribution;
    private List<CategoryDistribution> leadTimeDistribution;
    private List<CategoryDistribution> inventoryLevelDistribution;
    
    // Constructor to convert from List<Map<String, Object>> (from repository)
    public CorrelationAnalysisDTO(List<Map<String, Object>> potentialIssue,
                                  List<Map<String, Object>> deckRisk,
                                  List<Map<String, Object>> oeConstraint,
                                  List<Map<String, Object>> ppapRisk,
                                  List<Map<String, Object>> leadTime,
                                  List<Map<String, Object>> inventoryLevel) {
        this.correlations = List.of(); // Empty by default
        this.potentialIssueDistribution = convertMapsToCategoryDistribution(potentialIssue);
        this.deckRiskDistribution = convertMapsToCategoryDistribution(deckRisk);
        this.oeConstraintDistribution = convertMapsToCategoryDistribution(oeConstraint);
        this.ppapRiskDistribution = convertMapsToCategoryDistribution(ppapRisk);
        this.leadTimeDistribution = convertMapsToCategoryDistribution(leadTime);
        this.inventoryLevelDistribution = convertMapsToCategoryDistribution(inventoryLevel);
    }
    
    // Helper method to convert List<Map> to List<CategoryDistribution>
    private static List<CategoryDistribution> convertMapsToCategoryDistribution(List<Map<String, Object>> maps) {
        if (maps == null) {
            return List.of();
        }
        return maps.stream()
            .map(map -> new CategoryDistribution(
                (String) map.get("category"),
                ((Number) map.getOrDefault("count", 0L)).longValue(),
                ((Number) map.getOrDefault("backorderCount", 0L)).longValue()
            ))
            .collect(Collectors.toList());
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CorrelationPoint {
        private String x;
        private String y;
        private Double value;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDistribution {
        private String category;
        private Long count;
        private Long backorderCount;
    }
}



