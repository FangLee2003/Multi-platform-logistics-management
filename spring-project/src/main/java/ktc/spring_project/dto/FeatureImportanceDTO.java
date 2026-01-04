package ktc.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeatureImportanceDTO {
    private String feature;
    private String featureName; // Alias for frontend compatibility
    private Double importance;
    private String description;
    private List<String> insights;
    
    // Constructor matching the new package signature
    public FeatureImportanceDTO(String featureName, Double importance, String description, List<String> insights) {
        this.feature = featureName;
        this.featureName = featureName;
        this.importance = importance;
        this.description = description;
        this.insights = insights;
    }
    
    // Legacy constructor
    public FeatureImportanceDTO(String feature, Double importance, String description) {
        this.feature = feature;
        this.featureName = feature;
        this.importance = importance;
        this.description = description;
        this.insights = List.of();
    }
}



