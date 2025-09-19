import DataTable, { TableRow, TableCell } from '../../components/DataTable';
import GlassButton from '../../components/GlassButton';
import type { Order } from '../../types/dashboard';

interface RecentOrdersTableProps {
  orders: Order[];
  onRefresh: () => void;
  loading: boolean;
}

// Trả về class màu cho status tiếng Việt từ backend
function getStatusColor(status: string) {
  switch (status) {
    case 'Hoàn thành':
      return 'text-green-600';
    case 'Đã giao':
      return 'text-green-700';
    case 'Đang giao':
      return 'text-blue-600';
    case 'Chờ xử lý':
      return 'text-orange-500';
    case 'Đang xử lý':
      return 'text-purple-500';
    case 'Đã hủy':
      return 'text-red-600';
    case 'Chưa xác định':
      return 'text-gray-400';
    default:
      return 'text-gray-800';
  }
}

function getStatusText(status: string) {
  // Backend đã trả về status tiếng Việt, chỉ cần trả về như cũ
  return status;
}

function formatDateTime(dateString: string) {
  if (!dateString) {
    return {
      date: '--',
      time: '--'
    };
  }
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

export default function RecentOrdersTable({ orders, onRefresh, loading }: RecentOrdersTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Đơn hàng gần đây</h3>
        <GlassButton size="sm" variant="secondary" onClick={onRefresh} disabled={loading}>
          🔄 Làm mới
        </GlassButton>
      </div>
      <DataTable headers={['Mã đơn', 'Khách hàng', 'Tuyến đường', 'Thời gian tạo', 'Trạng thái']}>
        {orders.map((order) => {
          const createdTime = formatDateTime(order.createdAt);
          
          return (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">{order.id}</div>
                <div className="text-gray-600 text-xs">
                  {order.orderCode || `DH${order.id}`}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{order.customerName}</div>
                <div className="text-gray-600 text-xs">{order.customerPhone}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {order.pickupAddress} → {order.deliveryAddress}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium text-blue-900">{createdTime.date}</div>
                  <div className="text-blue-600 text-xs">{createdTime.time}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className={`font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </DataTable>
    </div>
  );
}
