import { LayoutDashboard, Video, BarChart3, Settings, Info, Zap } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stream', label: 'Camera Feed', icon: Video },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'logs', label: 'System Logs', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function NavigationBar({ activeTab, onTabChange, className = '' }) {
  return (
    <nav className={`w-16 h-full bg-detecto-bgSecondary/80 backdrop-blur-xl flex flex-col items-center py-6 space-y-1 ${className}`}>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 sidebar-item ${
            activeTab === id ? 'sidebar-item--active' : ''
          }`}
          title={label}
        >
          <Icon size={22} />
        </button>
      ))}
      <div className="flex-1 flex flex-col items-center justify-end space-y-2 pb-6">
        <div className="w-px h-12 bg-detecto-border/50" />
        <button className="sidebar-item" title="About">
          <Info size={22} />
        </button>
      </div>
    </nav>
  )
}