package ktc.spring_project.repositories;

import ktc.spring_project.entities.Delivery;
import ktc.spring_project.enums.ServiceType;
import ktc.spring_project.enums.TransportMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    
    List<Delivery> findByOrderId(Long orderId);
    
    boolean existsByOrderId(Long orderId);
    
    List<Delivery> findByVehicleId(Long vehicleId);
    
    List<Delivery> findByDriverId(Long driverId);
    
    
    List<Delivery> findByTransportMode(TransportMode transportMode);
    
    List<Delivery> findByServiceType(ServiceType serviceType);
    
    @Query("SELECT d FROM Delivery d WHERE d.scheduleDeliveryTime BETWEEN :startDate AND :endDate ORDER BY d.scheduleDeliveryTime")
    List<Delivery> findDeliveriesScheduledBetween(@Param("startDate") LocalDateTime startDate, 
                                                @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT d FROM Delivery d WHERE d.actualDeliveryTime IS NULL AND d.scheduleDeliveryTime < :currentTime")
    List<Delivery> findOverdueDeliveries(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT d FROM Delivery d WHERE d.lateDeliveryRisk = 1 AND d.actualDeliveryTime IS NULL")
    List<Delivery> findAtRiskDeliveries();
    
    @Query("SELECT d FROM Delivery d WHERE d.driver.id = :driverId AND d.actualDeliveryTime IS NULL")
    List<Delivery> findActiveDeliveriesByDriver(@Param("driverId") Long driverId);
    
    @Query("SELECT d FROM Delivery d WHERE d.vehicle.id = :vehicleId AND d.actualDeliveryTime IS NULL")
    List<Delivery> findActiveDeliveriesByVehicle(@Param("vehicleId") Long vehicleId);
      
    @Query("SELECT COUNT(d) FROM Delivery d WHERE DATE(d.actualDeliveryTime) = CURRENT_DATE")
    long countTodayDeliveries();
    
    @Query("SELECT d FROM Delivery d WHERE d.deliveryAttempts > :attempts")
    List<Delivery> findDeliveriesWithMultipleAttempts(@Param("attempts") Integer attempts);

    /**
     * Tìm tất cả delivery đã hoàn thành trong ngày cụ thể
     * @param date Ngày theo định dạng YYYY-MM-DD
     * @return Danh sách delivery đã hoàn thành
     */
    @Query("SELECT d FROM Delivery d WHERE DATE(d.actualDeliveryTime) = :date AND d.actualDeliveryTime IS NOT NULL")
    List<Delivery> findCompletedDeliveriesByDate(@Param("date") String date);

    /**
     * Đếm tổng số deliveries trong khoảng thời gian (tối ưu cho performance stats)
     */
    @Query("SELECT COUNT(d) FROM Delivery d WHERE DATE(d.createdAt) BETWEEN :startDate AND :endDate")
    long countDeliveriesByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate);

    /**
     * Đếm số deliveries đã hoàn thành trong khoảng thời gian (tối ưu cho performance stats)
     */
    @Query("SELECT COUNT(d) FROM Delivery d WHERE DATE(d.createdAt) BETWEEN :startDate AND :endDate AND d.actualDeliveryTime IS NOT NULL")
    long countCompletedDeliveriesByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate);

    /**
     * Lấy doanh thu theo tháng trong 12 tháng gần nhất
     */
    @Query(value = """
        SELECT 
            YEAR(d.actual_delivery_time) as year,
            MONTH(d.actual_delivery_time) as month,
            COALESCE(SUM(d.delivery_fee), 0) as revenue
        FROM deliveries d 
        WHERE d.actual_delivery_time IS NOT NULL 
            AND d.actual_delivery_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY YEAR(d.actual_delivery_time), MONTH(d.actual_delivery_time)
        ORDER BY year, month
        """, nativeQuery = true)
    List<Map<String, Object>> getMonthlyRevenueLast12Months();

}
