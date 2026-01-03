package ktc.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

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

