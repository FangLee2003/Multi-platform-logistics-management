import React, { useEffect, useState } from "react";
import type { TimelineStepDto } from "../types/Order";
import { fetchChecklistSteps, fetchOrderChecklistProgress } from "../services/ChecklistAPI";
import { MdAccessTime, MdInventory, MdLocalShipping, MdLocationOn, MdCheckCircle } from "react-icons/md";

interface Props {
  orderId: string | number;
  // currentStepCode có thể dùng để highlight bước hiện tại nếu cần
}

const OrderChecklistTimeline: React.FC<Props> = ({ orderId }) => {
  const [mergedSteps, setMergedSteps] = useState<TimelineStepDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi 2 API song song
        const [standardSteps, progressSteps] = await Promise.all([
          fetchChecklistSteps(),
          fetchOrderChecklistProgress(orderId)
        ]);

        // Merge dữ liệu: lấy cấu trúc từ standardSteps, cập nhật completedAt từ progressSteps
        const merged = standardSteps.map(standardStep => {
          const progressStep = progressSteps.find(p => p.stepCode === standardStep.stepCode);
          return {
            ...standardStep,
            completedAt: progressStep?.completedAt || undefined,
            completed: !!progressStep?.completedAt,
            actor: progressStep?.actor || undefined,
            details: progressStep?.details || undefined,
            status: progressStep?.status || undefined
          };
        });

        // Sắp xếp theo stepOrder
        merged.sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
        setMergedSteps(merged);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu checklist:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="relative py-3 px-2 flex justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  // Gộp 2 bước cuối nếu vừa giao vừa thanh toán luôn
  let displaySteps = [...mergedSteps];
  const lastIdx = mergedSteps.length - 1;
  if (
    mergedSteps.length >= 2 &&
    mergedSteps[lastIdx].stepCode === 'COMPLETED' &&
    mergedSteps[lastIdx].completedAt &&
    mergedSteps[lastIdx - 1].stepCode === 'ORDER_DELIVERED_PAYMENT_PENDING' &&
    !mergedSteps[lastIdx - 1].completedAt
  ) {
    // Gộp 2 bước cuối thành 1
    displaySteps = [
      ...mergedSteps.slice(0, lastIdx - 1),
      {
        ...mergedSteps[lastIdx],
        stepName: `${mergedSteps[lastIdx - 1].stepName} & ${mergedSteps[lastIdx].stepName}`,
      }
    ];
  }


  return (
    <div className="relative py-4 px-4 flex justify-center">
      <div className="relative max-w-4xl w-full">
        {/* Horizontal timeline container */}
        <div className="relative flex justify-center">
          {/* Continuous line behind all dots */}
          <div className="absolute top-6 left-12 right-12 h-1 bg-gray-300 z-0"></div>
          
          {/* Green progress line overlay */}
          {(() => {
            const lastCompletedIdx = displaySteps.reduce((acc, step, idx) => step.completedAt ? idx : acc, -1);
            if (lastCompletedIdx >= 0) {
              const progressPercent = (lastCompletedIdx / (displaySteps.length - 1)) * 100;
              return (
                <div 
                  className="absolute top-6 left-12 h-1 bg-green-500 z-0"
                  style={{ width: `calc((100% - 6rem) * ${progressPercent / 100})` }}
                ></div>
              );
            }
            return null;
          })()}

          {/* Steps container */}
          <div className="flex items-start relative px-2" style={{ justifyContent: 'space-evenly', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
            {displaySteps.map((step: TimelineStepDto, idx: number) => {
              const lastCompletedIdx = displaySteps.reduce((acc, step, idx) => step.completedAt ? idx : acc, -1);
              const isCompleted = idx <= lastCompletedIdx; // Dot sẽ xanh nếu <= vị trí hoàn thành cuối cùng
              
              return (
                <div key={step.stepCode + idx} className="flex flex-col items-center relative min-w-[130px]">
                  {/* Dot with icon */}
                  <div className={`w-12 h-12 rounded-full border-3 z-20 flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-gray-400 border-gray-400'
                  }`}>
                    {/* Icon based on step - force re-render with key */}
                    <div key={`${step.stepCode}-${idx}`} className="text-white text-xl flex items-center justify-center">
                      {step.stepCode === 'CUSTOMER_CREATE_ORDER' && <MdAccessTime />}
                      {step.stepCode === 'DISPATCHER_ASSIGN_DRIVER' && <MdInventory />}
                      {step.stepCode === 'DRIVER_RECEIVE_ORDER' && <MdLocalShipping />}
                      {step.stepCode === 'DRIVER_COMPLETE_DELIVERY' && <MdCheckCircle />}
                      {/* Fallback icon */}
                      {!['CUSTOMER_CREATE_ORDER', 'DISPATCHER_ASSIGN_DRIVER', 'DRIVER_RECEIVE_ORDER', 'DRIVER_COMPLETE_DELIVERY'].includes(step.stepCode) && <MdAccessTime />}
                    </div>
                  </div>
                  
                  {/* Step content below dot */}
                  <div className="flex flex-col items-center mt-3 min-w-[130px] max-w-[170px]">
                    <div className="font-semibold text-gray-900 text-sm text-center mb-2">{step.stepName}</div>
                    <div className="text-xs text-center text-gray-600">
                      {step.completedAt ? (
                        <div>
                          <div className="font-medium text-black">{typeof step.completedAt === 'string' ? new Date(step.completedAt).toLocaleDateString() : new Date(step.completedAt!).toLocaleDateString()}</div>
                          <div className="text-gray-500 mt-1">{typeof step.completedAt === 'string' ? new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Chưa hoàn thành</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderChecklistTimeline;
