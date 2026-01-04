import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { OperationsMetricsService } from '../services/operationsMetricsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyRevenueData {
  year: number;
  month: number;
  revenue: number;
}

interface MonthlyRevenueChartProps {
  onRefreshAll?: () => Promise<void>;
}

export default function MonthlyRevenueChart({ onRefreshAll }: MonthlyRevenueChartProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRevenue, setAverageRevenue] = useState(0);
  const [growthPercent, setGrowthPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tạo labels cho 12 tháng gần nhất
  const generateLabels = () => {
    return ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
  };

  // Truyền dữ liệu chart theo VND gốc
  const processChartData = (data: MonthlyRevenueData[]) => {
    console.log('🔍 Processing chart data, input:', data);
    
    // Lấy 12 tháng gần nhất, không phụ thuộc vào năm cụ thể
    const chartData = [];
    for (let month = 1; month <= 12; month++) {
      // Tìm dữ liệu cho tháng này, ưu tiên năm gần nhất
      const found = data.find(item => item.month === month);
      const revenue = found ? Number(found.revenue) : 0;
      chartData.push(revenue);
      
      if (found) {
        console.log(`✅ Month ${month}: ${revenue} VND (year: ${found.year})`);
      }
    }
    
    console.log('📊 Processed chart data:', chartData);
    return chartData;
  };

  const fetchMonthlyRevenue = async () => {
    try {
      setLoading(true);
      const result = await OperationsMetricsService.getMonthlyRevenue();
      
      console.log('📊 Monthly Revenue Data:', result);
      console.log('📊 Monthly Revenue Array:', result.monthlyRevenue);
      
      setMonthlyData(result.monthlyRevenue);
      setTotalRevenue(result.totalRevenue);
      setAverageRevenue(result.averageRevenue);
      setGrowthPercent(result.growthPercent);
    } catch (error) {
      console.error('❌ Error fetching monthly revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm để refresh cả metrics và chart data
  const handleRefreshAll = async () => {
    setLoading(true);
    try {
      // Refresh chart data
      await fetchMonthlyRevenue();
      
      // Refresh metrics nếu có callback từ parent
      if (onRefreshAll) {
        await onRefreshAll();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    fetchMonthlyRevenue();
  }, []);

  const labels = generateLabels();
  const chartDataValues = processChartData(monthlyData);
  
  console.log('📈 Chart Data Values:', chartDataValues);
  console.log('📈 Chart Labels:', labels);

  // Format số để hiển thị (VND -> tỷ/triệu, có dấu phân tách)
  // Hiển thị đầy đủ số, có dấu, có đơn vị VND
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US') + ' VND';
  };

  const monthlyRevenueData = {
    labels,
    datasets: [
      {
        label: 'Revenue (million VND)',
        data: chartDataValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Chart configuration
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => `${"Month"} ${context[0].label}`,
          label: (context) => {
            // context.parsed.y là VND gốc
            return `Revenue: ${context.parsed.y.toLocaleString('en-US')} VND`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: 500
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
            weight: 500
          },
          callback: function(value) {
            // value là VND, chia triệu và format
            return (Number(value) / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'M';
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      },
      line: {
        borderWidth: 3
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{"Monthly Revenue"}</h3>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            onClick={handleRefreshAll}
            disabled={loading}
          >
{loading ? "" : ""}
          </button>
        </div>
      </div>
      
      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Line data={monthlyRevenueData} options={options} />
        )}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-sm text-gray-600">{"Total annual revenue"}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {growthPercent > 0 ? '+' : ''}{growthPercent.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">{"Growth compared to last month"}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(averageRevenue)}
          </div>
          <div className="text-sm text-gray-600">{"Monthly average"}</div>
        </div>
      </div>
    </div>
  );
}