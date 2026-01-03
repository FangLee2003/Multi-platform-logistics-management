import { useEffect, useState } from "react";
import { fetchVehicleMaintenanceHistory } from "../../services/VehicleMaintenanceAPI";
import type { VehicleMaintenance } from "../../services/VehicleMaintenanceAPI";

// Mapping status name sang màu sắc (sẽ được moved vào component)

// TODO: Map vehicleId sang biển số xe nếu cần (cần API hoặc dữ liệu xe)


export default function MaintenanceHistory() {
  const [data, setData] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // Status mapping with translation
  const getStatusMap = (status: string) => {
    switch (status) {
      case "Completed":
        return { label: 'Completed', color: "bg-green-100 text-green-700" };
      case "In Progress":
        return { label: 'In Progress', color: "bg-yellow-100 text-yellow-700" };
      case "Pending":
        return { label: 'Pending', color: "bg-orange-100 text-orange-700" };
      default:
        return { label: status || 'Unknown Status', color: "bg-gray-100 text-gray-700" };
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchVehicleMaintenanceHistory()
      .then(setData)
      .catch(() => setError('Cannot load maintenance data.'))
      .finally(() => setLoading(false));
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
      <div className="text-xl font-bold mb-2">{'Maintenance History'}</div>
      {loading && <div>{'Loading'}</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex flex-col gap-4">
        {paginatedData.map((item) => (
          <div
            key={item.id}
            className="bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold flex items-center gap-2">
                {item.vehicle?.licensePlate || `Xe #${item.vehicle?.id}`}
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusMap(item.status?.name).color}`}
                >
                  {getStatusMap(item.status?.name).label}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 text-sm">
                <div>
                  <span className="font-semibold">{'Type'}:</span> {item.maintenanceType}
                  <div><span className="font-semibold">{'Maintenance Content'}:</span> {item.description}</div>
                </div>
                <div>
                  <span className="font-semibold">{'Cost'}:</span>
                  <div className="font-bold">{item.cost?.toLocaleString()} VNĐ</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="font-semibold">{'Maintenance Date'}:</span> {item.maintenanceDate?.slice(0, 10)}
                  </div>
                  <div>
                    <span className="font-semibold">{'Next Maintenance Date'}:</span> {item.nextDueDate?.slice(0, 10)}
                  </div>
                </div>
                <div>
                  <span className="font-semibold">{'Notes'}: </span>
                  <div>{item.notes || <span className="italic text-gray-400">{'No notes'}</span>}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {'Previous'}
          </button>
          <span className="mx-2">
            {'Page'} {currentPage} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
