import { MdManageAccounts } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { AiOutlineSetting, AiOutlineSafetyCertificate } from "react-icons/ai";
import { FiActivity, FiBarChart2, FiHome, FiUsers } from "react-icons/fi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { useTranslation } from 'react-i18next';
// Logo từ public folder



export type DispatcherTab = "orders" | "resources" | "assignment";
export type OperationsTab = "overview" | "performance" | "monitoring" | "staff";
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
  label: string;
  icon: React.ReactNode;
}



function getMenu<T extends TabType>(role: UserRole, t: any): MenuItem<T>[] {
  const MENUS: Record<UserRole, MenuItem<any>[]> = {
    dispatcher: [
      { key: "orders", label: t('dispatcher.tabs.orders', 'Orders'), icon: <MdManageAccounts /> },
      { key: "resources", label: t('dispatcher.tabs.resources', 'Resources'), icon: <RiShieldKeyholeLine /> },
      { key: "assignment", label: t('dispatcher.tabs.assignment', 'Assignment'), icon: <AiOutlineSetting /> },
    ],
    operations: [
      { key: "overview", label: t('operations.tabs.overview', 'Overview'), icon: <FiHome /> },
      { key: "performance", label: t('operations.tabs.performance', 'Performance'), icon: <FiBarChart2 /> },
      { key: "monitoring", label: t('operations.tabs.monitoring', 'Monitoring'), icon: <FiActivity /> },
      { key: "staff", label: t('operations.tabs.staff', 'Staff Management'), icon: <FiUsers /> },
    ],
    fleet: [
      { key: "vehicles", label: t('fleet.tabs.vehicles', 'Vehicle Management'), icon: <MdManageAccounts /> },
      { key: "maintenance", label: t('fleet.tabs.maintenance', 'Vehicle Maintenance'), icon: <AiOutlineSetting /> },
      { key: "schedule", label: t('fleet.tabs.schedule', 'Maintenance Schedule'), icon: <FiActivity /> },
    ],
    admin: [
      { key: "users", label: t('admin.tabs.users', 'Users'), icon: <MdManageAccounts /> },
      { key: "roles", label: t('admin.tabs.roles', 'Roles'), icon: <RiShieldKeyholeLine /> },
      { key: "settings", label: t('admin.tabs.settings', 'Settings'), icon: <AiOutlineSetting /> },
      { key: "logs", label: t('admin.tabs.logs', 'Logs'), icon: <FiActivity /> },
    ],
  };
  return MENUS[role] as MenuItem<T>[];
}


export default function Sidebar<T extends TabType>({
  activeTab,
  onTabChange,
  role,
}: SidebarProps<T>) {
  const { t } = useTranslation();
  const MENU = getMenu<T>(role, t);

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
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
