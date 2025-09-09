import React, { useState, useEffect } from "react";
import { Plus, X, AlertCircle, CheckCircle, Truck, Save } from "lucide-react";
import { addVehicle } from "../../services/VehicleListAPI";
import type { Vehicle } from "./VehicleTable";

interface VehicleFormData {
  licensePlate: string;
  type: string;
  capacityWeightKg: string;
  capacityVolumeM3: string;
  notes: string;
}

interface FormErrors {
  licensePlate?: string;
  type?: string;
  capacityWeightKg?: string;
  capacityVolumeM3?: string;
  notes?: string;
}

type AddVehicleFormProps = {
  onSuccess?: (data: Pick<Vehicle, "licensePlate" | "type" | "capacityWeightKg" | "capacityVolumeM3">) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<VehicleFormData>;
  mode?: "add" | "edit";
  editingVehicle?: Vehicle;
  onUpdate?: (vehicleId: number, data: Partial<Vehicle>) => Promise<void>;
};

const VEHICLE_TYPES = [
  { value: "TRUCK", label: "Xe tải" },
  { value: "VAN", label: "Xe van" },
  { value: "MOTORCYCLE", label: "Xe máy" },
  { value: "CAR", label: "Xe con" },
] as const;

export default function AddVehicleForm({ 
  onSuccess, 
  onCancel, 
  initialValues,
  mode = "add",
  editingVehicle,
  onUpdate
}: AddVehicleFormProps) {
  const isEditMode = mode === "edit" && editingVehicle;

  const [form, setForm] = useState<VehicleFormData>({
    licensePlate: initialValues?.licensePlate || (isEditMode ? editingVehicle.licensePlate : ""),
    type: initialValues?.type || (isEditMode ? editingVehicle.type : ""),
    capacityWeightKg: initialValues?.capacityWeightKg || (isEditMode ? editingVehicle.capacityWeightKg?.toString() || "" : ""),
    capacityVolumeM3: initialValues?.capacityVolumeM3 || (isEditMode ? editingVehicle.capacityVolumeM3?.toString() || "" : ""),
    notes: initialValues?.notes || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof VehicleFormData, boolean>>({
    licensePlate: false,
    type: false,
    capacityWeightKg: false,
    capacityVolumeM3: false,
    notes: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Reset form when editing vehicle changes
  useEffect(() => {
    if (isEditMode) {
      setForm({
        licensePlate: editingVehicle.licensePlate || "",
        type: editingVehicle.type || "",
        capacityWeightKg: editingVehicle.capacityWeightKg?.toString() || "",
        capacityVolumeM3: editingVehicle.capacityVolumeM3?.toString() || "",
        notes: "",
      });
      setErrors({});
      setTouched({
        licensePlate: false,
        type: false,
        capacityWeightKg: false,
        capacityVolumeM3: false,
        notes: false,
      });
    }
  }, [editingVehicle, isEditMode]);

  // -------- Validation ----------
  const validateLicensePlate = (plate: string): string | undefined => {
    if (!plate.trim()) return "Biển số xe là bắt buộc";
    const cleanPlate = plate.trim().toUpperCase();
    if (cleanPlate.length < 6) return "Biển số xe phải có ít nhất 6 ký tự";
    if (cleanPlate.length > 15) return "Biển số xe không được vượt quá 15 ký tự";

    const hasNumber = /\d/.test(cleanPlate);
    const hasLetter = /[A-Z]/.test(cleanPlate);
    if (!hasNumber || !hasLetter) {
      return "Biển số xe phải có cả số và chữ (VD: 30A-12345)";
    }
    return undefined;
  };

  const validateRequired = (value: string, fieldName: string): string | undefined => {
    if (!value.trim()) return `${fieldName} là bắt buộc`;
    return undefined;
  };

  const validateNumber = (value: string, fieldName: string): string | undefined => {
    if (!value.trim()) return undefined;
    const num = parseFloat(value);
    if (isNaN(num)) return `${fieldName} phải là số`;
    if (num < 0) return `${fieldName} không được âm`;
    if (num > 999999) return `${fieldName} quá lớn`;
    return undefined;
  };

  const validateNotes = (notes: string): string | undefined => {
    if (notes.length > 500) return "Ghi chú không được vượt quá 500 ký tự";
    return undefined;
  };

  const handleChange = (field: keyof VehicleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitStatus === "success") {
      setSubmitStatus("idle");
    }
  };

  const handleFieldBlur = (field: keyof VehicleFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const currentValue = form[field];
    let error: string | undefined;
    switch (field) {
      case "licensePlate":
        error = validateLicensePlate(currentValue);
        break;
      case "type":
        error = validateRequired(currentValue, "Loại xe");
        break;
      case "capacityWeightKg":
        error = validateNumber(currentValue, "Tải trọng");
        break;
      case "capacityVolumeM3":
        error = validateNumber(currentValue, "Thể tích");
        break;
      case "notes":
        error = validateNotes(currentValue);
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      licensePlate: validateLicensePlate(form.licensePlate),
      type: validateRequired(form.type, "Loại xe"),
      capacityWeightKg: validateNumber(form.capacityWeightKg, "Tải trọng"),
      capacityVolumeM3: validateNumber(form.capacityVolumeM3, "Thể tích"),
      notes: validateNotes(form.notes),
    };
    setErrors(newErrors);
    setTouched({
      licensePlate: true,
      type: true,
      capacityWeightKg: true,
      capacityVolumeM3: true,
      notes: true,
    });
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const isValid = validateForm();
    if (!isValid) return;

    setIsLoading(true);
    setSubmitStatus("idle");
    try {
      if (isEditMode && onUpdate && editingVehicle) {
        // Edit mode
        const updatedData: Partial<Vehicle> = {
          licensePlate: form.licensePlate.trim().toUpperCase().replace(/\s+/g, ""),
          type: form.type,
          capacityWeightKg: form.capacityWeightKg ? parseFloat(form.capacityWeightKg) : undefined,
          capacityVolumeM3: form.capacityVolumeM3 ? parseFloat(form.capacityVolumeM3) : undefined,
        };
        await onUpdate(editingVehicle.id, updatedData);
        setSubmitStatus("success");
      } else {
        // Add mode
        const vehicleData = {
          licensePlate: form.licensePlate.trim().toUpperCase().replace(/\s+/g, ""),
          vehicleType: form.type,
          capacity: form.capacityWeightKg ? parseFloat(form.capacityWeightKg) : 0,
          capacityVolumeM3: form.capacityVolumeM3 ? parseFloat(form.capacityVolumeM3) : undefined,
          notes: form.notes.trim() || undefined,
          statusId: 1,
        };
        await addVehicle(vehicleData);
        setSubmitStatus("success");
        handleReset();
        
        // Call onSuccess with proper data format
        const successData = {
          licensePlate: form.licensePlate.trim().toUpperCase().replace(/\s+/g, ""),
          type: form.type,
          capacityWeightKg: form.capacityWeightKg ? parseFloat(form.capacityWeightKg) : undefined,
          capacityVolumeM3: form.capacityVolumeM3 ? parseFloat(form.capacityVolumeM3) : undefined,
        };
        onSuccess?.(successData);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} vehicle:`, error);
      setSubmitStatus("error");
      setErrors((prev) => ({
        ...prev,
        licensePlate: `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'thêm'} xe. Vui lòng thử lại.`,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      licensePlate: "",
      type: "",
      capacityWeightKg: "",
      capacityVolumeM3: "",
      notes: "",
    });
    setErrors({});
    setTouched({
      licensePlate: false,
      type: false,
      capacityWeightKg: false,
      capacityVolumeM3: false,
      notes: false,
    });
    setSubmitStatus("idle");
  };

  const isFormValid =
    !Object.values(errors).some((error) => error !== undefined) &&
    form.licensePlate.trim() !== "" &&
    form.type !== "";

  // ---- UI ----
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Truck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? "Chỉnh sửa phương tiện" : "Thêm phương tiện mới"}
          </h2>
          <p className="text-sm text-gray-600">
            {isEditMode 
              ? `Cập nhật thông tin phương tiện ${editingVehicle?.licensePlate}` 
              : "Nhập thông tin phương tiện vào hệ thống"
            }
          </p>
        </div>
      </div>

      {submitStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <span className="font-medium">
              {isEditMode ? "Cập nhật phương tiện thành công!" : "Thêm phương tiện thành công!"}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* License Plate */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Biển số xe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="51A-12345"
              value={form.licensePlate}
              onChange={(e) => handleChange("licensePlate", e.target.value)}
              onBlur={() => handleFieldBlur("licensePlate")}
              disabled={isLoading}
              maxLength={15}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                touched.licensePlate && errors.licensePlate
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
            />
            {touched.licensePlate && errors.licensePlate && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle size={14} />
                <span>{errors.licensePlate}</span>
              </div>
            )}
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Loại xe <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              onBlur={() => handleFieldBlur("type")}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                touched.type && errors.type
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">-- Chọn loại xe --</option>
              {VEHICLE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {touched.type && errors.type && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle size={14} />
                <span>{errors.type}</span>
              </div>
            )}
          </div>

          {/* Capacity Weight */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tải trọng (kg)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="1500"
              value={form.capacityWeightKg}
              onChange={(e) => handleChange("capacityWeightKg", e.target.value)}
              onBlur={() => handleFieldBlur("capacityWeightKg")}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                touched.capacityWeightKg && errors.capacityWeightKg
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
            />
            {touched.capacityWeightKg && errors.capacityWeightKg && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle size={14} />
                <span>{errors.capacityWeightKg}</span>
              </div>
            )}
          </div>

          {/* Capacity Volume */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Thể tích (m³)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="15.5"
              value={form.capacityVolumeM3}
              onChange={(e) => handleChange("capacityVolumeM3", e.target.value)}
              onBlur={() => handleFieldBlur("capacityVolumeM3")}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                touched.capacityVolumeM3 && errors.capacityVolumeM3
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
            />
            {touched.capacityVolumeM3 && errors.capacityVolumeM3 && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle size={14} />
                <span>{errors.capacityVolumeM3}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
          <textarea
            rows={3}
            placeholder="Nhập thông tin bổ sung về xe..."
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleFieldBlur("notes")}
            disabled={isLoading}
            maxLength={500}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              touched.notes && errors.notes
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300"
            }`}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {form.notes.length}/500 ký tự
          </div>
          {touched.notes && errors.notes && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle size={14} />
              <span>{errors.notes}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isFormValid && !isLoading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isEditMode ? "Đang cập nhật..." : "Đang thêm..."}</span>
              </>
            ) : (
              <>
                {isEditMode ? <Save size={18} /> : <Plus size={18} />}
                <span>{isEditMode ? "Cập nhật" : "Thêm phương tiện"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X size={18} />
            <span>Đặt lại</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-600 hover:text-gray-800"
            >
              Hủy bỏ
            </button>
          )}
        </div>

        {isFormValid && submitStatus === "idle" && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} />
            <span>Form hợp lệ - sẵn sàng {isEditMode ? "cập nhật" : "thêm"} phương tiện</span>
          </div>
        )}
      </form>
    </div>
  );
}
