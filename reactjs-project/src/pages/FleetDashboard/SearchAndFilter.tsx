import { memo } from "react";
import { Search, Filter, Plus, RefreshCw } from "lucide-react";

type VehicleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "MAINTENANCE_PENDING";

interface SearchAndFilterProps {
  searchTerm: string;
  statusFilter: VehicleStatus | "all";
  onSearch: (term: string) => void;
  onStatusFilter: (status: VehicleStatus | "all") => void;
  onToggleAddForm: () => void;
  showAddForm: boolean;
  resultsCount: number;
  totalCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const SearchAndFilter = memo<SearchAndFilterProps>(({
  searchTerm,
  statusFilter,
  onSearch,
  onStatusFilter,
  onToggleAddForm,
  showAddForm,
  resultsCount,
  totalCount,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Vehicle Management</h3>
          <p className="text-gray-600 text-sm mt-1">Search and filter vehicle list</p>
        </div>
        <div className="flex gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-white/60 backdrop-blur-md hover:bg-white/80 border border-white/60 text-violet-700 px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          )}
          <button
            onClick={onToggleAddForm}
            className="bg-gradient-to-r from-violet-500/80 to-indigo-500/80 backdrop-blur-md hover:from-violet-600/90 hover:to-indigo-600/90 border border-white/40 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{showAddForm ? 'Hide' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={'Search by license plate, brand, model, driver...'}
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all bg-white"
          />
          <Search size={20} className="absolute left-3 top-3.5 text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value as VehicleStatus | "all")}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
          >
            <option value="all">{'All Status'}</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="MAINTENANCE_PENDING">Need Maintenance</option>
          </select>
          <Filter size={20} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>      
    </div>
  );
});

SearchAndFilter.displayName = "SearchAndFilter";

export default SearchAndFilter;