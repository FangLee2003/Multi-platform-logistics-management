package ktc.spring_project.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_ai_features")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductAIFeatures {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sku", unique = true, nullable = false)
    private String sku;
    
    @Column(name = "national_inv")
    private Double nationalInv;
    
    @Column(name = "lead_time")
    private Double leadTime;
    
    @Column(name = "in_transit_qty")
    private Double inTransitQty;
    
    @Column(name = "forecast_3_month")
    private Double forecast3Month;
    
    @Column(name = "forecast_6_month")
    private Double forecast6Month;
    
    @Column(name = "forecast_9_month")
    private Double forecast9Month;
    
    @Column(name = "sales_1_month")
    private Double sales1Month;
    
    @Column(name = "sales_3_month")
    private Double sales3Month;
    
    @Column(name = "sales_6_month")
    private Double sales6Month;
    
    @Column(name = "sales_9_month")
    private Double sales9Month;
    
    @Column(name = "min_bank")
    private Double minBank;
    
    @Column(name = "potential_issue", length = 10)
    private String potentialIssue;
    
    @Column(name = "pieces_past_due")
    private Double piecesPastDue;
    
    @Column(name = "perf_6_month_avg")
    private Double perf6MonthAvg;
    
    @Column(name = "perf_12_month_avg")
    private Double perf12MonthAvg;
    
    @Column(name = "local_bo_qty")
    private Double localBoQty;
    
    @Column(name = "deck_risk", length = 10)
    private String deckRisk;
    
    @Column(name = "oe_constraint", length = 10)
    private String oeConstraint;
    
    @Column(name = "ppap_risk", length = 10)
    private String ppapRisk;
    
    @Column(name = "stop_auto_buy", length = 10)
    private String stopAutoBuy;
    
    @Column(name = "rev_stop", length = 10)
    private String revStop;
    
    @Column(name = "went_on_backorder", length = 10)
    private String wentOnBackorder;
}



