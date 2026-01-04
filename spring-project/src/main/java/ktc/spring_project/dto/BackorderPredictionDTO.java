package ktc.spring_project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BackorderPredictionDTO {
    private String sku;
    private String productName;
    private Double currentStock;
    private Double backorderProbability;
    private Integer recommendedQty;
    private String priority;
    private Double leadTime;
    private Double forecast3Month;
    private Double minBank;
    private Double inTransitQty;
    private Double piecesPastDue;
    private Double sales3Month;
    private Double perf6MonthAvg;
    private String stopAutoBuy;
    private String revStop;
}
