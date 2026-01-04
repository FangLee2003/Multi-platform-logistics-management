package ktc.spring_project.dtos.analytics;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CorrelationAnalysisDTO {
    private List<CorrelationPoint> correlations;
    private List<Map<String, Object>> potentialIssueDistribution;
    private List<Map<String, Object>> deckRiskDistribution;
    private List<Map<String, Object>> oeConstraintDistribution;
    private List<Map<String, Object>> ppapRiskDistribution;
    private List<Map<String, Object>> leadTimeDistribution;
    private List<Map<String, Object>> inventoryLevelDistribution;

    public CorrelationAnalysisDTO() {
        this.correlations = new ArrayList<>();
    }

    public CorrelationAnalysisDTO(List<Map<String, Object>> potentialIssueDistribution,
                                  List<Map<String, Object>> deckRiskDistribution,
                                  List<Map<String, Object>> oeConstraintDistribution,
                                  List<Map<String, Object>> ppapRiskDistribution,
                                  List<Map<String, Object>> leadTimeDistribution,
                                  List<Map<String, Object>> inventoryLevelDistribution) {
        this.potentialIssueDistribution = potentialIssueDistribution;
        this.deckRiskDistribution = deckRiskDistribution;
        this.oeConstraintDistribution = oeConstraintDistribution;
        this.ppapRiskDistribution = ppapRiskDistribution;
        this.leadTimeDistribution = leadTimeDistribution;
        this.inventoryLevelDistribution = inventoryLevelDistribution;
        this.correlations = new ArrayList<>();
    }

    // Inner class for correlation points
    public static class CorrelationPoint {
        private String x;
        private String y;
        private Double value;

        public CorrelationPoint() {}

        public CorrelationPoint(String x, String y, Double value) {
            this.x = x;
            this.y = y;
            this.value = value;
        }

        public String getX() { return x; }
        public void setX(String x) { this.x = x; }
        public String getY() { return y; }
        public void setY(String y) { this.y = y; }
        public Double getValue() { return value; }
        public void setValue(Double value) { this.value = value; }
    }

    // Getters and Setters
    public List<CorrelationPoint> getCorrelations() {
        return correlations;
    }

    public void setCorrelations(List<CorrelationPoint> correlations) {
        this.correlations = correlations;
    }

    public List<Map<String, Object>> getPotentialIssueDistribution() {
        return potentialIssueDistribution;
    }

    public void setPotentialIssueDistribution(List<Map<String, Object>> potentialIssueDistribution) {
        this.potentialIssueDistribution = potentialIssueDistribution;
    }

    public List<Map<String, Object>> getDeckRiskDistribution() {
        return deckRiskDistribution;
    }

    public void setDeckRiskDistribution(List<Map<String, Object>> deckRiskDistribution) {
        this.deckRiskDistribution = deckRiskDistribution;
    }

    public List<Map<String, Object>> getOeConstraintDistribution() {
        return oeConstraintDistribution;
    }

    public void setOeConstraintDistribution(List<Map<String, Object>> oeConstraintDistribution) {
        this.oeConstraintDistribution = oeConstraintDistribution;
    }

    public List<Map<String, Object>> getPpapRiskDistribution() {
        return ppapRiskDistribution;
    }

    public void setPpapRiskDistribution(List<Map<String, Object>> ppapRiskDistribution) {
        this.ppapRiskDistribution = ppapRiskDistribution;
    }

    public List<Map<String, Object>> getLeadTimeDistribution() {
        return leadTimeDistribution;
    }

    public void setLeadTimeDistribution(List<Map<String, Object>> leadTimeDistribution) {
        this.leadTimeDistribution = leadTimeDistribution;
    }

    public List<Map<String, Object>> getInventoryLevelDistribution() {
        return inventoryLevelDistribution;
    }

    public void setInventoryLevelDistribution(List<Map<String, Object>> inventoryLevelDistribution) {
        this.inventoryLevelDistribution = inventoryLevelDistribution;
    }
}
