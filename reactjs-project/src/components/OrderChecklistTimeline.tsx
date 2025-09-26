import React, { useEffect, useState } from "react";
import type { TimelineStepDto } from "../types/Order";
import { fetchChecklistSteps, fetchOrderChecklistProgress } from "../services/ChecklistAPI";

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
    <div className="relative py-3 px-2">
      <div className="relative">
  {/* Timeline line: gray by default, blue up to last completed dot */}
  {(() => {
    const lastCompletedIdx = displaySteps.reduce((acc, step, idx) => step.completedAt ? idx : acc, -1);
    // Each dot has mb-6 (1.5rem) below, so blue line height = idx * (dot height + margin)
    const dotHeight = 0.75; // w-3 = 12px = 0.75rem
    const gapHeight = 1.5; // mb-6 = 1.5rem
    const blueHeight = lastCompletedIdx > -1 ? (lastCompletedIdx * (dotHeight + gapHeight) + dotHeight / 2) : 0;
    return (
      <>
        {/* Gray line full height */}
        <div className="absolute left-1.5 top-4 bottom-8 w-0.5 bg-gray-300 z-0"></div>
        {/* Blue line overlays up to last completed dot */}
        {lastCompletedIdx > -1 && (
          <div className="absolute left-1.5 top-4 w-0.5 bg-blue-500 z-0" style={{ height: `${blueHeight}rem` }}></div>
        )}
      </>
    );
  })()}
        {/* Line segments between dots, color depends on completed status of previous dot */}
        {displaySteps.map((step, idx) => {
          if (idx === displaySteps.length - 1) return null;
          // Calculate top position for each segment
          const segmentTop = 4 + idx * 2.25; // top-4 + (dot+gap) * idx
          const color = step.completedAt ? 'bg-blue-500' : 'bg-gray-300';
          return (
            <div
              key={idx}
              className={`absolute left-1.5 w-0.5 z-0 ${color}`}
              style={{ top: `${segmentTop}rem`, height: '2.25rem' }}
            ></div>
          );
        })}
        <div className="flex flex-col gap-8">
          {displaySteps.map((step: TimelineStepDto, idx: number) => {
            const isCompleted = !!step.completedAt;
            return (
              <>
                <div className="flex flex-row items-center gap-3" key={step.stepCode + idx}>
                  {/* Dot overlays the line, line is centered */}
                  <div className="relative z-10">
                    <div className={`w-3 h-3 rounded-full border-2 bg-white ${isCompleted ? 'bg-blue-500 border-blue-500' : 'bg-gray-300 border-gray-300'} mb-6`}></div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="font-semibold text-gray-900 text-base mb-0.5">{step.stepName}</div>
                    <div className="flex gap-2 items-center text-sm text-gray-700 mt-0.5" style={{ minHeight: '22px' }}>
                      {step.completedAt ? (
                        <>
                          <span>{typeof step.completedAt === 'string' ? new Date(step.completedAt).toLocaleDateString() : new Date(step.completedAt!).toLocaleDateString()}</span>
                          <span className="text-gray-400 text-xs">{typeof step.completedAt === 'string' ? new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">{idx !== displaySteps.length - 1 ? 'Chưa hoàn thành' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
          
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderChecklistTimeline;
