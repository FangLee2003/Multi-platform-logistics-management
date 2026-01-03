package ktc.spring_project.controllers;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cache")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@Slf4j
public class CacheManagementController {
    
    @Autowired
    private CacheManager cacheManager;
    
    /**
     * Get cache statistics for monitoring
     * GET /api/cache/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        log.info("📊 Fetching cache statistics...");
        
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> statsMap = new HashMap<>();
        
        try {
            cacheManager.getCacheNames().forEach(cacheName -> {
                org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                if (cache instanceof CaffeineCache) {
                    CaffeineCache caffeineCache = (CaffeineCache) cache;
                    Cache<Object, Object> nativeCache = caffeineCache.getNativeCache();
                    CacheStats stats = nativeCache.stats();
                    
                    Map<String, Object> cacheStats = new HashMap<>();
                    cacheStats.put("hitCount", stats.hitCount());
                    cacheStats.put("missCount", stats.missCount());
                    cacheStats.put("hitRate", String.format("%.2f%%", stats.hitRate() * 100));
                    cacheStats.put("missRate", String.format("%.2f%%", stats.missRate() * 100));
                    cacheStats.put("evictionCount", stats.evictionCount());
                    cacheStats.put("estimatedSize", nativeCache.estimatedSize());
                    
                    statsMap.put(cacheName, cacheStats);
                }
            });
            
            response.put("success", true);
            response.put("data", statsMap);
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("✅ Cache statistics retrieved successfully");
        } catch (Exception e) {
            log.error("❌ Error retrieving cache statistics", e);
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Clear a specific cache
     * DELETE /api/cache/clear/{cacheName}
     */
    @DeleteMapping("/clear/{cacheName}")
    public ResponseEntity<Map<String, Object>> clearCache(@PathVariable String cacheName) {
        log.info("🗑️ Clearing cache: {}", cacheName);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                response.put("success", true);
                response.put("message", "Cache '" + cacheName + "' cleared successfully");
                log.info("✅ Cache '{}' cleared", cacheName);
            } else {
                response.put("success", false);
                response.put("message", "Cache '" + cacheName + "' not found");
                log.warn("⚠️ Cache '{}' not found", cacheName);
            }
        } catch (Exception e) {
            log.error("❌ Error clearing cache '{}'", cacheName, e);
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Clear all caches
     * DELETE /api/cache/clear-all
     */
    @DeleteMapping("/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllCaches() {
        log.info("🗑️ Clearing all caches...");
        
        Map<String, Object> response = new HashMap<>();
        int clearedCount = 0;
        
        try {
            for (String cacheName : cacheManager.getCacheNames()) {
                org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                    clearedCount++;
                    log.info("✅ Cache '{}' cleared", cacheName);
                }
            }
            
            response.put("success", true);
            response.put("message", "All caches cleared successfully");
            response.put("cachesCleared", clearedCount);
            log.info("✅ All {} caches cleared", clearedCount);
        } catch (Exception e) {
            log.error("❌ Error clearing all caches", e);
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get list of all cache names
     * GET /api/cache/names
     */
    @GetMapping("/names")
    public ResponseEntity<Map<String, Object>> getCacheNames() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("caches", cacheManager.getCacheNames());
        return ResponseEntity.ok(response);
    }
}

