package ktc.spring_project.dtos.analytics;

import java.util.Map;

public class AnalyticsOverviewDTO {
    private Long totalProducts;
    private Long backorderProducts;
    private Long nonBackorderProducts;
    private Double backorderRate;
    private Map<String, Object> backorderAverages;
    private Map<String, Object> nonBackorderAverages;

    public AnalyticsOverviewDTO() {}

    public AnalyticsOverviewDTO(Long totalProducts, Long backorderProducts, Long nonBackorderProducts, 
                                Double backorderRate, Map<String, Object> backorderAverages, 
                                Map<String, Object> nonBackorderAverages) {
        this.totalProducts = totalProducts;
        this.backorderProducts = backorderProducts;
        this.nonBackorderProducts = nonBackorderProducts;
        this.backorderRate = backorderRate;
        this.backorderAverages = backorderAverages;
        this.nonBackorderAverages = nonBackorderAverages;
    }

    public Long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(Long totalProducts) { this.totalProducts = totalProducts; }
    
    public Long getBackorderProducts() { return backorderProducts; }
    public void setBackorderProducts(Long backorderProducts) { this.backorderProducts = backorderProducts; }
    
    public Long getNonBackorderProducts() { return nonBackorderProducts; }
    public void setNonBackorderProducts(Long nonBackorderProducts) { this.nonBackorderProducts = nonBackorderProducts; }
    
    public Double getBackorderRate() { return backorderRate; }
    public void setBackorderRate(Double backorderRate) { this.backorderRate = backorderRate; }
    
    public Map<String, Object> getBackorderAverages() { return backorderAverages; }
    public void setBackorderAverages(Map<String, Object> backorderAverages) { this.backorderAverages = backorderAverages; }
    
    public Map<String, Object> getNonBackorderAverages() { return nonBackorderAverages; }
    public void setNonBackorderAverages(Map<String, Object> nonBackorderAverages) { this.nonBackorderAverages = nonBackorderAverages; }
}
