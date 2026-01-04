package ktc.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDTO {
    private Long totalProducts;
    private Long backorderProducts;
    private Long nonBackorderProducts;
    private Double backorderRate;
    private Map<String, Object> backorderAverages;
    private Map<String, Object> nonBackorderAverages;
    
    // Legacy constructor for backward compatibility
    public AnalyticsOverviewDTO(Long totalProducts, Long backorderProducts, 
                                Long nonBackorderProducts, Double backorderRate) {
        this.totalProducts = totalProducts;
        this.backorderProducts = backorderProducts;
        this.nonBackorderProducts = nonBackorderProducts;
        this.backorderRate = backorderRate;
    }
}



