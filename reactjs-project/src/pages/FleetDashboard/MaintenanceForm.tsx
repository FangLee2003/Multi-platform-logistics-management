import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { fetchVehiclesRaw, updateVehicleStatus } from "../../services/VehicleListAPI";
import { createVehicleMaintenance } from "../../services/VehicleMaintenanceAPI";
import type { Vehicle } from "../../types/Operations";


interface ScheduleForm {
  vehicle: string;
  type: string;
  description: string;
  date: string;
  cost: string;
  nextMaintenance: string;
  statusId: string;
  notes: string;
}



const typeOptions = [
  { value: "", label: "Chọn loại" },
  { value: "Bảo dưỡng định kỳ", label: "Bảo dưỡng định kỳ" },
  { value: "Sửa chữa", label: "Sửa chữa" },
];

interface MaintenanceFormProps {
  onAddMaintenance?: (data: ScheduleForm) => void;
  onMaintenanceCreated?: () => void; // Add callback to refresh data
}

export default function MaintenanceForm({ onAddMaintenance, onMaintenanceCreated }: MaintenanceFormProps) {
  const [form, setForm] = useState<ScheduleForm>({
    vehicle: "",
    type: "",
    description: "",
    date: "",
    cost: "0",
    nextMaintenance: "",
    statusId: "19", // Mặc định là "Đang bảo trì"
    notes: "",
  });
// const statusOptions = [
//   { value: "1", label: "Chờ xử lý" },
//   { value: "2", label: "Đang thực hiện" },
// ];
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string }[]>([
    { value: "", label: "Chọn phương tiện" }
  ]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingVehicles(true);
    fetchVehiclesRaw(1, 200)
      .then(({ data }) => {
        setVehicleOptions([
          { value: "", label: "Chọn phương tiện" },
          ...data.map(v => ({
            value: v.id?.toString() || '',
            label: (v.licensePlate ? v.licensePlate : (v.name || `Xe ${v.id}`)) + ` (ID: ${v.id})`
          }))
        ]);
        setLoadingVehicles(false);
      })
      .catch(() => {
        setVehicleError("Không thể tải danh sách xe");
        setLoadingVehicles(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Gửi dữ liệu lên API để lưu vào database
      // Chuyển đổi ngày sang định dạng yyyy-MM-ddTHH:mm:ss
      const toDateTime = (date: string) => date ? `${date}T00:00:00` : '';
      await createVehicleMaintenance({
        vehicle: { id: Number(form.vehicle) },
        maintenanceDate: toDateTime(form.date),
        nextDueDate: toDateTime(form.nextMaintenance),
        maintenanceType: form.type,
        description: form.description,
        cost: form.cost ? Number(form.cost) : undefined,
        notes: form.notes,
        status: { id: 19 }, // gửi status object thay vì statusId
      });

      // Cập nhật trạng thái xe thành MAINTENANCE sau khi tạo lịch bảo trì thành công
      await updateVehicleStatus(form.vehicle, 'MAINTENANCE');

      // Cập nhật local state vehicles nếu hàm setVehicles được truyền qua props (nếu không thì rely vào refresh)
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        // Gửi custom event để các component khác có thể lắng nghe và cập nhật nếu muốn
        window.dispatchEvent(new CustomEvent('vehicleStatusChanged', { detail: { vehicleId: Number(form.vehicle), status: 'MAINTENANCE' } }));
      }

      if (onAddMaintenance) {
        onAddMaintenance(form);
      }

      // Gọi callback để refresh danh sách xe
      if (onMaintenanceCreated) {
        onMaintenanceCreated();
      }

      alert("Đã lên lịch bảo trì thành công!");
    } catch (err) {
      alert("Lỗi khi lưu lịch bảo trì!");
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
      <div className="text-xl font-bold mb-2">Lên lịch bảo trì</div>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">Chọn phương tiện <span className='text-red-500'>*</span></label>
          <select
            name="vehicle"
            value={form.vehicle}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            required
            disabled={loadingVehicles}
          >
            {vehicleOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {loadingVehicles && <div className="text-xs text-gray-500 mt-1">Đang tải danh sách xe...</div>}
          {vehicleError && <div className="text-xs text-red-500 mt-1">{vehicleError}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Loại bảo trì <span className='text-red-500'>*</span></label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            required
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
  {/* Ẩn trường trạng thái, chỉ gửi mặc định khi submit */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Mô tả công việc</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Mô tả chi tiết công việc cần thực hiện"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Nhập ghi chú (nếu có)"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày thực hiện <span className='text-red-500'>*</span></label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chi phí dự kiến (VNĐ)</label>
          <input
            name="cost"
            type="number"
            min="0"
            value={form.cost}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Bảo trì sắp tới</label>
          <input
            name="nextMaintenance"
            type="date"
            value={form.nextMaintenance}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
            placeholder="Ngày bảo trì tiếp theo"
          />
        </div>
        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg text-base transition"
          >
            <Calendar size={20} /> Lên lịch bảo trì
          </button>
        </div>
      </form>
    </div>
  );
}
