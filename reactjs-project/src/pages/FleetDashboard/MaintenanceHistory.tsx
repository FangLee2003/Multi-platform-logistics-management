import { useEffect, useState } from "react";
import { fetchVehicleMaintenanceHistory } from "../../services/VehicleMaintenanceAPI";
import type { VehicleMaintenance } from "../../services/VehicleMaintenanceAPI";

// Mapping status name sang màu sắc
const statusMap: Record<string, { label: string; color: string }> = {
  "Completed": { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "Đang thực hiện", color: "bg-yellow-100 text-yellow-700" },
  // Thêm các trạng thái khác nếu có
};

// TODO: Map vehicleId sang biển số xe nếu cần (cần API hoặc dữ liệu xe)

export default function MaintenanceHistory() {
  const [data, setData] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchVehicleMaintenanceHistory()
      .then(setData)
      .catch(() => setError("Không thể tải dữ liệu bảo trì."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
      <div className="text-xl font-bold mb-2">Lịch sử bảo trì</div>
      {loading && <div>Đang tải dữ liệu...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex flex-col gap-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold flex items-center gap-2">
                {item.vehicle?.licensePlate || `Xe #${item.vehicle?.id}`}
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${statusMap[item.status?.name]?.color || "bg-gray-100 text-gray-700"}`}
                >
                  {statusMap[item.status?.name]?.label || item.status?.name || "Không rõ"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <span className="font-semibold">Loại:</span> {item.maintenanceType}
                  <div><span className="font-semibold">Mô tả:</span> {item.description}</div>
                </div>
                <div>
                  <span className="font-semibold">Chi phí:</span>
                  <div className="font-bold">{item.cost?.toLocaleString()} VNĐ</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="font-semibold">Thời gian bảo trì:</span> {item.maintenanceDate?.slice(0, 10)}
                  </div>
                  <div>
                    <span className="font-semibold">Lịch bảo trì sắp tới:</span> {item.nextDueDate?.slice(0, 10)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
