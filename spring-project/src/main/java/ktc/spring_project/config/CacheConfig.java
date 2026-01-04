package ktc.spring_project.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {
    
    // Cache names
    public static final String ANALYTICS_CACHE = "analytics";
    public static final String CORRELATION_CACHE = "correlation";
    public static final String FEATURE_IMPORTANCE_CACHE = "featureImportance";
    
    // Cache TTL: 20 minutes (balance between freshness and performance)
    private static final int CACHE_TTL_MINUTES = 20;
    
    // Max entries per cache
    private static final int MAX_CACHE_SIZE = 1000;
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            ANALYTICS_CACHE, 
            CORRELATION_CACHE, 
            FEATURE_IMPORTANCE_CACHE
        );
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(CACHE_TTL_MINUTES, TimeUnit.MINUTES)
            .maximumSize(MAX_CACHE_SIZE)
            .recordStats() // Enable statistics for monitoring
        );
        
        return cacheManager;
    }
}


