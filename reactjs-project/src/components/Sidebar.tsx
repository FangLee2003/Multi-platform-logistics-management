import { MdManageAccounts } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { AiOutlineSetting, AiOutlineSafetyCertificate } from "react-icons/ai";
import { FiActivity, FiBarChart2, FiHome, FiUsers } from "react-icons/fi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { BsFileEarmarkText } from "react-icons/bs";
import { useTranslation } from 'react-i18next';
// Logo từ public folder



export type DispatcherTab = "orders" | "resources" | "assignment" | "completedOrders";
export type OperationsTab = "overview" | "performance" | "monitoring" | "staff" | "invoices";
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
  const { t } = useTranslation();
  const MENU = getMenu<T>(role);

  // Hàm để get label từ i18n
  const getMenuLabel = (key: string) => {
    switch(role) {
      case 'dispatcher':
        return t(`dashboard.dispatcher.tabs.${key}`, key);
      case 'operations':
        return t(`dashboard.operations.tabs.${key}`, key);
      case 'fleet':
        return t(`dashboard.fleet.tabs.${key}`, key);
      case 'admin':
        return t(`dashboard.admin.tabs.${key}`, key);
      default:
        return key;
    }
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
