"use client";

import { useState, useEffect } from "react";
import { MdAccessTime, MdInventory, MdLocalShipping, MdCheckCircle, MdLocationOn } from "react-icons/md";
import { fetchChecklistSteps, fetchOrderChecklistProgress, type TimelineStepDto } from "../services/checklistService";

interface ChecklistStep {
  id: string;
  stepCode: string;
  stepName: string;
  completed: boolean;
  completedAt?: string;
  actor?: {
    userId: number;
    fullName: string;
    role: string;
    phone?: string;
  };
  details?: string;
  status?: string;
}

interface OrderChecklistProps {
  orderId: string;
  orderStatus?: string;
}

export default function OrderChecklist({ orderId, orderStatus }: OrderChecklistProps) {
  const [steps, setSteps] = useState<ChecklistStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Thử gọi API backend, nếu lỗi sẽ fallback
        let standardSteps: TimelineStepDto[] = [];
        let progressSteps: TimelineStepDto[] = [];
        
        try {
          // Sử dụng API giống dispatcher - gọi 2 API song song
          const [fetchedStandardSteps, fetchedProgressSteps] = await Promise.all([
            fetchChecklistSteps(),
            fetchOrderChecklistProgress(orderId)
          ]);
          standardSteps = fetchedStandardSteps;
          progressSteps = fetchedProgressSteps;
        } catch (apiError) {
          console.warn('API call failed, using fallback data:', apiError);
          // Nếu API lỗi, sử dụng dữ liệu fallback
          standardSteps = [];
          progressSteps = [];
        }

        console.log('🔍 [DEBUG] Standard steps:', standardSteps);
        console.log('🔍 [DEBUG] Progress steps:', progressSteps);

        // Định nghĩa thứ tự mong muốn
        const stepOrderMap = [
          'CUSTOMER_CREATE_ORDER',    // Order pending
          'DISPATCHER_ASSIGN_DRIVER', // Order processing
          'DRIVER_RECEIVE_ORDER',     // Shipping
          'DRIVER_COMPLETE_DELIVERY', // Delivery successful
          'COMPLETED'                 // Nếu có
        ];

        // Nếu API trả về dữ liệu, sử dụng logic giống dispatcher
        if (standardSteps.length > 0 && progressSteps.length > 0) {
          // Merge dữ liệu: lấy cấu trúc từ standardSteps, cập nhật completedAt từ progressSteps
          let merged = [];
          
          // Kiểm tra đơn hàng đã completed
          const hasCompletedDelivery = 
            progressSteps.some(p => 
              (p.stepCode === 'DRIVER_COMPLETE_DELIVERY' && p.completedAt && p.completed === true) ||
              (p.stepCode === 'COMPLETED' && p.completedAt && p.completed === true)
            ) ||
            (orderStatus && orderStatus.toLowerCase().includes('completed'));
          
          console.log('🔍 [DEBUG] orderStatus:', orderStatus);
          console.log('🔍 [DEBUG] hasCompletedDelivery:', hasCompletedDelivery);
          
          for (const standardStep of standardSteps) {
            const progressStep = progressSteps.find(p => p.stepCode === standardStep.stepCode);
            
            let stepName = standardStep.stepName;
            switch (standardStep.stepCode) {
              case 'CUSTOMER_CREATE_ORDER':
                stepName = 'Order pending';
                break;
              case 'DISPATCHER_ASSIGN_DRIVER':
                stepName = 'Order processing';
                break;
              case 'DRIVER_RECEIVE_ORDER':
                stepName = 'Shipping';
                break;
              case 'DRIVER_COMPLETE_DELIVERY':
              case 'COMPLETED':
                stepName = 'Delivery successful';
                break;
              default:
                break;
            }
            
            // Logic giống dispatcher: nếu đơn hàng đã completed thì tất cả bước đều completed
            let completed = false;
            let completedAt = undefined;
            
            if (hasCompletedDelivery) {
              // Đơn hàng đã hoàn thành -> tất cả bước completed
              completed = true;
              completedAt = progressStep?.completedAt || new Date().toISOString();
            } else {
              // Logic bình thường: chỉ completed khi thực sự có completedAt và completed = true
              completed = !!(progressStep?.completedAt && progressStep?.completed === true);
              completedAt = progressStep?.completedAt;
            }
            
            merged.push({
              id: (merged.length + 1).toString(),
              stepCode: standardStep.stepCode,
              stepName,
              completedAt,
              completed,
              actor: progressStep?.actor,
              details: progressStep?.details,
              status: progressStep?.status
            });
          }

          // Sắp xếp lại theo thứ tự mong muốn
          merged = merged
            .filter(step => stepOrderMap.includes(step.stepCode))
            .sort((a, b) => stepOrderMap.indexOf(a.stepCode) - stepOrderMap.indexOf(b.stepCode));

          console.log('🔍 [DEBUG] Final merged steps:', merged);
          setSteps(merged);
        } else {
          // Fallback: sử dụng mock data với tên tiếng Anh - logic chính xác
          const mockSteps = [
            {
              id: '1',
              stepCode: 'CUSTOMER_CREATE_ORDER',
              stepName: 'Order pending',
              completed: true,
              completedAt: new Date().toISOString()
            },
            {
              id: '2',
              stepCode: 'DISPATCHER_ASSIGN_DRIVER',
              stepName: 'Order processing',
              completed: orderStatus ? ['processing', 'shipping', 'delivered', 'completed'].includes(orderStatus.toLowerCase()) : false,
              completedAt: orderStatus && ['processing', 'shipping', 'delivered', 'completed'].includes(orderStatus.toLowerCase()) ? new Date().toISOString() : undefined
            },
            {
              id: '3',
              stepCode: 'DRIVER_RECEIVE_ORDER',
              stepName: 'Shipping',
              completed: orderStatus ? ['shipping', 'delivered', 'completed'].includes(orderStatus.toLowerCase()) : false,
              completedAt: orderStatus && ['shipping', 'delivered', 'completed'].includes(orderStatus.toLowerCase()) ? new Date().toISOString() : undefined
            },
            {
              id: '4',
              stepCode: 'DRIVER_COMPLETE_DELIVERY',
              stepName: 'Delivery successful',
              completed: orderStatus ? ['delivered', 'completed'].includes(orderStatus.toLowerCase()) : false,
              completedAt: orderStatus && ['delivered', 'completed'].includes(orderStatus.toLowerCase()) ? new Date().toISOString() : undefined
            }
          ];
          setSteps(mockSteps);
        }
        
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu checklist:', error);
        // Fallback to basic steps
        setSteps([
          {
            id: '1',
            stepCode: 'CUSTOMER_CREATE_ORDER',
            stepName: 'Order pending',
            completed: true,
            completedAt: new Date().toISOString()
          },
          {
            id: '2',
            stepCode: 'DISPATCHER_ASSIGN_DRIVER',
            stepName: 'Order processing', 
            completed: false
          },
          {
            id: '3',
            stepCode: 'DRIVER_RECEIVE_ORDER',
            stepName: 'Shipping',
            completed: false
          },
          {
            id: '4', 
            stepCode: 'DRIVER_COMPLETE_DELIVERY',
            stepName: 'Delivery successful',
            completed: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId, orderStatus]);

  const getStepIcon = (stepCode: string) => {
    switch (stepCode) {
      case 'CUSTOMER_CREATE_ORDER':
        return <MdAccessTime className="drop-shadow-sm" />;
      case 'DISPATCHER_ASSIGN_DRIVER':
        return <MdInventory className="drop-shadow-sm" />;
      case 'DRIVER_RECEIVE_ORDER':
        return <MdLocalShipping className="drop-shadow-sm" />;
      case 'DRIVER_COMPLETE_DELIVERY':
        return <MdCheckCircle className="drop-shadow-sm" />;
      default:
        return <MdLocationOn className="drop-shadow-sm" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 rounded-2xl border border-blue-100/50 p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Đang tải tiến trình...
          </div>
        </div>
      </div>
    );
  }

  const lastCompletedIdx = steps.reduce((acc, step, idx) => step.completed ? idx : acc, -1);
  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 rounded-2xl border border-blue-100/50 p-6">
      <div className="relative max-w-5xl w-full mx-auto">
        
        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Tiến trình giao hàng</h3>
          <div className="text-sm text-gray-600">Đơn hàng #{orderId}</div>
        </div>

        {/* Horizontal timeline container */}
        <div className="relative flex justify-center">
          {/* Continuous line behind all dots */}
          <div className="absolute top-8 left-16 right-16 h-2 bg-gray-200 rounded-full z-0 shadow-inner"></div>
          
          {/* Animated progress line overlay */}
          {lastCompletedIdx >= 0 && (
            <div 
              className="absolute top-8 left-16 h-2 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 rounded-full z-10 shadow-lg transition-all duration-1000 ease-out"
              style={{ 
                width: `calc((100% - 8rem) * ${(lastCompletedIdx / (steps.length - 1)) * 100 / 100})`,
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
              }}
            ></div>
          )}

          {/* Steps container */}
          <div className="flex items-start relative px-4 justify-between w-full max-w-4xl">
            {steps.map((step, idx) => {
              const isCompleted = step.completed;
              const isActive = !isCompleted && idx === lastCompletedIdx + 1;
              
              return (
                <div key={step.id} className="flex flex-col items-center relative flex-1 min-w-0">
                  {/* Dot with icon */}
                  <div className={`w-16 h-16 rounded-full border-4 z-20 flex items-center justify-center transition-all duration-300 shadow-lg transform hover:scale-105 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-emerald-400 to-green-600 border-white shadow-emerald-300/50' 
                      : isActive
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-white shadow-blue-300/50'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-200 shadow-gray-200/50'
                  }`}>
                    <div className="text-white text-2xl flex items-center justify-center">
                      {getStepIcon(step.stepCode)}
                    </div>
                  </div>
                  
                  {/* Step content below dot */}
                  <div className="flex flex-col items-center mt-4 px-2">
                    <div className={`font-bold text-center mb-3 leading-tight ${
                      isCompleted 
                        ? 'text-emerald-700 text-sm' 
                        : isActive 
                        ? 'text-blue-700 text-sm' 
                        : 'text-gray-600 text-sm'
                    }`}>
                      {step.stepName}
                    </div>
                    <div className="text-xs text-center">
                      {step.completedAt ? (
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/50 shadow-sm">
                          <div className="font-semibold text-emerald-800 flex items-center gap-1">
                            <MdCheckCircle className="text-emerald-500" />
                            {new Date(step.completedAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-emerald-600 mt-1 text-xs">
                            {new Date(step.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : isActive ? (
                        <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-3 border border-blue-200/50 shadow-sm">
                          <span className="text-blue-600 font-medium flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            Đang xử lý
                          </span>
                        </div>
                      ) : (
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 shadow-sm">
                          <span className="text-gray-500 font-medium">Chưa hoàn thành</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50 shadow-lg">
            <div className="text-sm font-semibold text-gray-700">
              Tiến trình: {completedCount}/{totalSteps} bước
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="text-sm font-bold text-emerald-600">
              {Math.round(progressPercent)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}