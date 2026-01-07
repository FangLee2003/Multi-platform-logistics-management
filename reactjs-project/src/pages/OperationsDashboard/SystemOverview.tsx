import GlassCard from '../../components/GlassCard';
import StatCard from '../../components/StatCard';
import GlassButton from '../../components/GlassButton';

export default function SystemOverview() {

  const systemStats = [
    { title: 'System Uptime', value: '99.8%', icon: '🟢', trend: { value: 0.2, isPositive: true } },
    { title: 'CPU Load', value: '23%', icon: '💻', subtitle: 'Normal' },
    { title: 'Memory Used', value: '67%', icon: '🧠', subtitle: '8.2GB/12GB' },
    { title: 'DB Connection', value: '145ms', icon: '🗄️', trend: { value: 12, isPositive: false } },
  ];

  const alerts = [
    { 
      id: 1, 
      level: 'warning', 
      message: 'Truck VT-003 needs scheduled maintenance', 
      time: '10 minutes ago',
      source: 'Maintenance System'
    },
    { 
      id: 2, 
      level: 'info', 
      message: 'Software update v2.1.3 available', 
      time: '2 hours ago',
      source: 'System'
    },
    { 
      id: 3, 
      level: 'error', 
      message: 'GPS connection error for vehicle VT-007', 
      time: '5 hours ago',
      source: 'GPS Tracking'
    },
    { 
      id: 4, 
      level: 'success', 
      message: 'Data backup completed', 
      time: '1 day ago',
      source: 'Backup System'
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'info': return 'text-blue-400 bg-blue-500/20';
      case 'success': return 'text-green-400 bg-green-500/20';
      default: return 'text-white bg-white/20';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📝';
    }
  };

  return (
    <GlassCard className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">System Overview</h2>
        <div className="flex gap-2">
          <GlassButton size="sm" variant="green">
            📊 Report
          </GlassButton>
          <GlassButton size="sm" variant="primary">
            ⚙️ Settings
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">System Status</h3>
          <div className="space-y-3">
            {[
              { service: 'API Gateway', status: 'Active', uptime: '99.9%' },
              { service: 'Database', status: 'Active', uptime: '99.8%' },
              { service: 'GPS Service', status: 'Warning', uptime: '98.2%' },
              { service: 'Notification', status: 'Active', uptime: '99.7%' },
            ].map((service, index) => (
              <div 
                key={index}
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'Active' ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-white font-medium">{service.service}</span>
                </div>
                <div className="text-right">
                  <div className="text-white/80 text-sm">{service.uptime}</div>
                  <div className={`text-xs ${
                    service.status === 'Active' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {service.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Recent Alerts</h3>
            <GlassButton size="sm" variant="secondary">
              View all
            </GlassButton>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getLevelIcon(alert.level)}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(alert.level)}`}>
                        {alert.level.toUpperCase()}
                      </span>
                      <span className="text-white/60 text-xs">{alert.time}</span>
                      <span className="text-white/60 text-xs">• {alert.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Backup now', icon: '💾', variant: 'primary' as const },
            { label: 'Restart services', icon: '🔄', variant: 'secondary' as const },
            { label: 'View logs', icon: '📋', variant: 'secondary' as const },
            { label: 'Maintenance mode', icon: '🛠️', variant: 'danger' as const },
          ].map((action, index) => (
            <GlassButton
              key={index}
              variant={action.variant}
              className="flex items-center justify-center gap-2 h-16"
            >
              <span className="text-xl">{action.icon}</span>
              <span>{action.label}</span>
            </GlassButton>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
