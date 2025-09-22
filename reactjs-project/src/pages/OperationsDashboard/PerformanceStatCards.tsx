import StatCard from '../../components/StatCard';

interface StatCardData {
  metric: string;
  current: number;
  target: number;
  trend: number;
}

interface PerformanceStatCardsProps {
  performanceData: StatCardData[];
}

// Function to format minutes to "x giờ y phút" or "x phút"
function formatMinutesToTime(minutes: number): string {
  if (minutes <= 0) return "0 phút";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours > 0) {
    if (remainingMinutes > 0) {
      return `${hours} giờ ${remainingMinutes} phút`;
    } else {
      return `${hours} giờ`;
    }
  } else {
    return `${remainingMinutes} phút`;
  }
}

export default function PerformanceStatCards({ performanceData }: PerformanceStatCardsProps) {
  // Debug log to check metric names and values
  console.log('PerformanceStatCards data:', performanceData);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {performanceData.map((data, index) => {
        // Debug individual metric
        console.log(`Metric: ${data.metric}, Current: ${data.current}, Target: ${data.target}`);
        console.log(`Contains 'thời gian': ${data.metric.includes('thời gian')}`);
        
        return (
        <StatCard
          key={index}
          title={
            data.metric.includes('Chi phí')
              ? 'Chi phí vận chuyển trung bình/km'
              : data.metric
          }
          value={
            data.metric.includes('Chi phí')
              ? `${Math.round(data.current).toLocaleString()}đ`
              : (data.metric.includes('thời gian') || data.metric.includes('Thời gian'))
              ? formatMinutesToTime(data.current)
              : data.metric.includes('km đã vận chuyển')
              ? `${Math.round(data.current).toLocaleString()} km`
              : `${data.current.toFixed(1)}%`
          }
          subtitle={
            data.metric.includes('Chi phí')
              ? ''
              : (data.metric.includes('thời gian') || data.metric.includes('Thời gian'))
              ? ''
              : data.metric.includes('km đã vận chuyển')
              ? ''
              : `Mục tiêu: ${data.target.toFixed(1)}%`
          }
          trend={
            (data.metric.includes('thời gian') || data.metric.includes('Thời gian') || data.metric.includes('Chi phí') || data.metric.includes('km đã vận chuyển'))
              ? undefined // Ẩn trend cho thời gian, chi phí và tổng km
              : {
                  value: Math.abs(data.trend),
                  isPositive: data.trend > 0,
                }
          }
          icon={index === 0 ? '📦' : index === 1 ? '⏱️' : index === 2 ? '💰' : '🛣️'}
        />
        );
      })}
    </div>
  );
}
