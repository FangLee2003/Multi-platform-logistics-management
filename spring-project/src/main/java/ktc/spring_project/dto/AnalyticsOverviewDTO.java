package ktc.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDTO {
    private Long totalProducts;
    private Long backorderProducts;
    private Long nonBackorderProducts;
    private Double backorderRate;
}

