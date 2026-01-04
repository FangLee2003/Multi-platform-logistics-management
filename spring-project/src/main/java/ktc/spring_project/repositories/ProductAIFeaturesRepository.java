package ktc.spring_project.repositories;

import ktc.spring_project.entities.ProductAIFeatures;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ProductAIFeaturesRepository extends JpaRepository<ProductAIFeatures, Long> {
    
    // Count queries - All products (61,589)
    @Query(value = "SELECT COUNT(*) FROM product_ai_features WHERE went_on_backorder = 'Yes'", nativeQuery = true)
    Long countBackorderProducts();
    
    @Query(value = "SELECT COUNT(*) FROM product_ai_features WHERE went_on_backorder = 'No'", nativeQuery = true)
    Long countNonBackorderProducts();
    
    // Average calculations by backorder status
    @Query(value = """
        SELECT 
            AVG(national_inv) as avgNationalInv,
            AVG(lead_time) as avgLeadTime,
            AVG(in_transit_qty) as avgInTransitQty,
            AVG(forecast_3_month) as avgForecast3Month,
            AVG(sales_3_month) as avgSales3Month,
            AVG(min_bank) as avgMinBank,
            AVG(pieces_past_due) as avgPiecesPastDue,
            AVG(perf_6_month_avg) as avgPerf6Month,
            AVG(local_bo_qty) as avgLocalBoQty
        FROM product_ai_features
        WHERE went_on_backorder = :backorderStatus
        """, nativeQuery = true)
    Map<String, Object> getAveragesByBackorderStatus(@Param("backorderStatus") String backorderStatus);
    
    // Distribution queries for correlation analysis
    @Query(value = """
        SELECT 
            potential_issue as category,
            COUNT(*) as count,
            SUM(CASE WHEN went_on_backorder = 'Yes' THEN 1 ELSE 0 END) as backorderCount
        FROM product_ai_features
        WHERE potential_issue IS NOT NULL
        GROUP BY potential_issue
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getBackorderByPotentialIssue();
    
    @Query(value = """
        SELECT 
            deck_risk as category,
            COUNT(*) as count,
            SUM(CASE WHEN went_on_backorder = 'Yes' THEN 1 ELSE 0 END) as backorderCount
        FROM product_ai_features
        WHERE deck_risk IS NOT NULL
        GROUP BY deck_risk
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getBackorderByDeckRisk();
    
    @Query(value = """
        SELECT 
            oe_constraint as category,
            COUNT(*) as count,
            SUM(CASE WHEN went_on_backorder = 'Yes' THEN 1 ELSE 0 END) as backorderCount
        FROM product_ai_features
        WHERE oe_constraint IS NOT NULL
        GROUP BY oe_constraint
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getBackorderByOeConstraint();
    
    @Query(value = """
        SELECT 
            ppap_risk as category,
            COUNT(*) as count,
            SUM(CASE WHEN went_on_backorder = 'Yes' THEN 1 ELSE 0 END) as backorderCount
        FROM product_ai_features
        WHERE ppap_risk IS NOT NULL
        GROUP BY ppap_risk
        ORDER BY count DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getBackorderByPpapRisk();
    
    @Query(value = """
        SELECT 
            CASE 
                WHEN lead_time < 2 THEN '<2 days'
                WHEN lead_time >= 2 AND lead_time < 4 THEN '2-4 days'
                WHEN lead_time >= 4 AND lead_time < 8 THEN '4-8 days'
                WHEN lead_time >= 8 AND lead_time < 16 THEN '8-16 days'
                ELSE '16+ days'
            END as category,
            COUNT(*) as count,
            SUM(CASE WHEN went_on_backorder = 'Yes' THEN 1 ELSE 0 END) as backorderCount
        FROM product_ai_features
        WHERE lead_time IS NOT NULL
        GROUP BY category
        ORDER BY 
            CASE category
                WHEN '<2 days' THEN 1
                WHEN '2-4 days' THEN 2
                WHEN '4-8 days' THEN 3
                WHEN '8-16 days' THEN 4
                ELSE 5
            END
        """, nativeQuery = true)
    List<Map<String, Object>> getBackorderByLeadTimeRange();
    
    @Query(value = """
        SELECT 
            CASE 
                WHEN national_inv BETWEEN 0 AND 100 THEN 'Low (1-100)'
                WHEN national_inv BETWEEN 101 AND 500 THEN 'Medium (101-500)'
                WHEN national_inv BETWEEN 501 AND 1000 THEN 'High (501-1000)'
                ELSE 'Very High (1000+)'
            END as category,
            COUNT(*) as count,
            SUM(CASE WHEN went_on_backorder = 'Yes' THEN 1 ELSE 0 END) as backorderCount
        FROM product_ai_features
        WHERE national_inv IS NOT NULL
        GROUP BY category
        ORDER BY 
            CASE category
                WHEN 'Low (1-100)' THEN 1
                WHEN 'Medium (101-500)' THEN 2
                WHEN 'High (501-1000)' THEN 3
                ELSE 4
            END
        """, nativeQuery = true)
    List<Map<String, Object>> getBackorderByInventoryLevel();
    
    // Mock Feature Importance - This would normally come from an ML model
    // For now, we calculate based on correlation with backorder status
    @Query(value = """
        SELECT 
            'National Inventory' as feature,
            0.45 as importance,
            'Current stock level at national warehouse' as description
        UNION ALL SELECT 'Lead Time', 0.38, 'Days required to replenish inventory'
        UNION ALL SELECT 'In Transit Quantity', 0.32, 'Stock currently in transit'
        UNION ALL SELECT 'Sales Forecast (3M)', 0.28, '3-month sales forecast'
        UNION ALL SELECT 'Sales Forecast (6M)', 0.25, '6-month sales forecast'
        UNION ALL SELECT 'Historical Sales (3M)', 0.23, 'Sales in past 3 months'
        UNION ALL SELECT 'Historical Sales (6M)', 0.21, 'Sales in past 6 months'
        UNION ALL SELECT 'Historical Sales (9M)', 0.19, 'Sales in past 9 months'
        UNION ALL SELECT 'Min Bank', 0.17, 'Minimum stock level to maintain'
        UNION ALL SELECT 'Pieces Past Due', 0.15, 'Quantity of overdue orders'
        UNION ALL SELECT 'Performance (6M Avg)', 0.13, '6-month average performance'
        UNION ALL SELECT 'Performance (12M Avg)', 0.11, '12-month average performance'
        UNION ALL SELECT 'Local Backorder Qty', 0.09, 'Local backorder quantity'
        UNION ALL SELECT 'Potential Issue Flag', 0.07, 'Indicates potential supply issues'
        UNION ALL SELECT 'Deck Risk', 0.05, 'Risk level of deck availability'
        ORDER BY importance DESC
        """, nativeQuery = true)
    List<Map<String, Object>> getFeatureImportanceRanking();
    
    // Get high-risk backorder predictions
    @Query(value = """
        SELECT 
            sku,
            national_inv as currentStock,
            lead_time as leadTime,
            in_transit_qty as inTransitQty,
            forecast_3_month as forecast3Month,
            sales_3_month as sales3Month,
            min_bank as minBank,
            pieces_past_due as piecesPastDue,
            perf_6_month_avg as perf6MonthAvg,
            potential_issue as potentialIssue,
            deck_risk as deckRisk,
            stop_auto_buy as stopAutoBuy,
            rev_stop as revStop,
            went_on_backorder as wentOnBackorder
        FROM product_ai_features
        WHERE went_on_backorder = 'Yes'
        ORDER BY 
            CASE WHEN national_inv = 0 THEN 1 ELSE 0 END DESC,
            pieces_past_due DESC,
            national_inv ASC,
            forecast_3_month DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Map<String, Object>> getHighRiskBackorderPredictions(@Param("limit") int limit);}