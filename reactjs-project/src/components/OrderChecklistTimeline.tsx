import React from "react";
import type { TimelineStepDto } from "../types/Order";


interface Props {
  steps: TimelineStepDto[];
}

const statusColors: Record<string, string> = {
  Pending: "#bdbdbd",
  Processing: "#2196f3",
  Shipped: "#ff9800",
  Deliveried: "#4caf50",
  Completed: "#2e7d32",
};



const OrderChecklistTimeline: React.FC<Props> = ({ steps }) => {
  return (
  <div className="relative py-3 px-2">
 
  <div className="flex flex-col gap-0.5">
        {steps.map((step: TimelineStepDto, idx: number) => {
          const isCompleted = !!step.completedAt;
          const isLast = idx === steps.length - 1;
          return (
            <div className="flex flex-row items-start min-h-[40px] relative z-10" key={step.stepCode}>
              {/* Dot on timeline */}
              <div className="flex flex-col items-center w-8 relative">
                <span
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-200 mt-1.5 ${isCompleted ? "bg-red-500 border-red-500" : "bg-gray-300 border-gray-300"}`}
                  style={{ zIndex: 2 }}
                ></span>
                {idx > 0 && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5 border-l-2 border-dotted border-gray-400 z-0" />
                )}
              </div>
              {/* Content box */}
              <div className="flex-1 ml-0 pl-0 flex flex-col gap-1">
                <div className="font-semibold text-gray-900 text-base mb-0.5">{step.stepName}</div>
                <div className="flex gap-2 items-center text-sm text-gray-700 mt-0.5">
                  {isCompleted ? (
                    <span>{typeof step.completedAt === 'string' ? new Date(step.completedAt).toLocaleDateString() : new Date(step.completedAt!).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-gray-400">Chưa hoàn thành</span>
                  )}
                  {isCompleted && step.completedAt && (
                    <span className="text-gray-400 text-xs">{typeof step.completedAt === 'string' ? new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderChecklistTimeline;
