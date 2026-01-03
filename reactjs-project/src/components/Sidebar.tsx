import { MdManageAccounts } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { AiOutlineSetting, AiOutlineSafetyCertificate } from "react-icons/ai";
import { FiActivity, FiBarChart2, FiHome, FiUsers } from "react-icons/fi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { BsFileEarmarkText } from "react-icons/bs";
import { BiData } from "react-icons/bi";
// Logo từ public folder



export type DispatcherTab = "orders" | "resources" | "assignment" | "completedOrders";
export type OperationsTab = "overview" | "performance" | "monitoring" | "staff" | "invoices" | "analytics";
export type AdminTab = "users" | "roles" | "settings" | "logs";
export type FleetTab = "vehicles" | "maintenance" | "schedule";
export type TabType = DispatcherTab | OperationsTab | AdminTab | FleetTab;

export type UserRole = "dispatcher" | "operations" | "admin" | "fleet";


interface SidebarProps<T extends TabType> {
  activeTab: T;
  onTabChange: (tab: T) => void;
  role: UserRole;
}

interface MenuItem<T extends TabType> {
  key: T;
  icon: React.ReactNode;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_MENUS: Record<UserRole, MenuItem<any>[]> = {
  dispatcher: [
    { key: "orders", icon: <MdManageAccounts /> },
    { key: "completedOrders", icon: <AiOutlineSafetyCertificate /> },
    { key: "resources", icon: <RiShieldKeyholeLine /> },
    { key: "assignment", icon: <AiOutlineSetting /> },
  ],
 operations : [
    { key: "overview", icon: <FiHome /> },
    { key: "performance", icon: <FiBarChart2 /> },
    { key: "monitoring", icon: <FiActivity /> },
    { key: "staff", icon: <FiUsers /> },
    { key: "invoices", icon: <BsFileEarmarkText /> },
    { key: "analytics", icon: <BiData /> },
  ],
  fleet: [
    { key: "vehicles", icon: <MdManageAccounts /> },
    { key: "maintenance", icon: <AiOutlineSetting /> },
    { key: "schedule", icon: <FiActivity /> },
  ],
  admin: [
    { key: "users", icon: <MdManageAccounts /> },
    { key: "roles", icon: <RiShieldKeyholeLine /> },
    { key: "settings", icon: <AiOutlineSetting /> },
    { key: "logs", icon: <FiActivity /> },
  ],
};

function getMenu<T extends TabType>(role: UserRole): MenuItem<T>[] {
  return ALL_MENUS[role] as MenuItem<T>[];
}


export default function Sidebar<T extends TabType>({
  activeTab,
  onTabChange,
  role,
}: SidebarProps<T>) {
  const MENU = getMenu<T>(role);

  // English labels mapping
  const ENGLISH_LABELS: Record<UserRole, Record<string, string>> = {
    dispatcher: {
      orders: "Orders",
      completedOrders: "Completed Orders",
      resources: "Resources",
      assignment: "Assignment"
    },
    operations: {
      overview: "Overview",
      performance: "Performance",
      monitoring: "Monitoring",
      staff: "Staff",
      invoices: "Invoices",
      analytics: "Data Analytics"
    },
    fleet: {
      vehicles: "Vehicles",
      maintenance: "Maintenance",
      schedule: "Schedule"
    },
    admin: {
      users: "Users",
      roles: "Roles",
      settings: "Settings",
      logs: "Logs"
    }
  };

  const getMenuLabel = (key: string) => {
    return ENGLISH_LABELS[role]?.[key] || key;
  };

  return (
    <aside className="group ml-3 flex-shrink-0 w-20 hover:w-64 transition-all duration-300 bg-white/20 backdrop-blur-lg border-r border-white/30 text-gray-800 flex flex-col py-6 px-4 overflow-hidden h-screen sticky top-0">
      <div className="mb-5 flex items-center -mt-3 -ml-4 gap-1">
        <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        <span
          className="hidden group-hover:inline-block font-bold text-lg tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden text-gray-700"
          style={{ maxWidth: "200px" }}
        >
          Fast Route
        </span>
      </div>
      <nav className="flex-1 flex flex-col gap-4">
        {MENU.map((item) => (
          <button
            key={item.key}
            className={`flex -ml-3 items-center gap-3 font-semibold transition-all duration-300 rounded-xl p-4 ${
              activeTab === item.key
                ? "text-blue-600 bg-white/40 backdrop-blur-sm border border-white/50 shadow-lg"
                : "hover:text-blue-600 hover:bg-white/20 backdrop-blur-sm"
            }`}
            onClick={() => onTabChange(item.key)}
          >
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <span
              className="hidden group-hover:inline transition-all duration-300 whitespace-nowrap overflow-hidden"
              style={{ maxWidth: "160px" }}
            >
              {getMenuLabel(item.key)}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
