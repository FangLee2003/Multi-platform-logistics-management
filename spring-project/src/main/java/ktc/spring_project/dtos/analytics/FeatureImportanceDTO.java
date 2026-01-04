package ktc.spring_project.dtos.analytics;

import java.util.List;

public class FeatureImportanceDTO {
    private String featureName;
    private Double importance;
    private String description;
    private List<String> insights;

    public FeatureImportanceDTO() {}

    public FeatureImportanceDTO(String featureName, Double importance, String description, List<String> insights) {
        this.featureName = featureName;
        this.importance = importance;
        this.description = description;
        this.insights = insights;
    }

    public String getFeatureName() { return featureName; }
    public void setFeatureName(String featureName) { this.featureName = featureName; }
    
    public Double getImportance() { return importance; }
    public void setImportance(Double importance) { this.importance = importance; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<String> getInsights() { return insights; }
    public void setInsights(List<String> insights) { this.insights = insights; }
}
