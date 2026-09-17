import { Layout, Video, Activity, Settings, Info } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'stream', label: 'Live Stream', icon: Video },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info },
]

export function NavigationBar({ activeTab, onTabChange }) {
  return (
    <nav className="w-16 h-full bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-2">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            activeTab === id
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
          }`}
          title={label}
        >
          <Icon size={20} />
        </button>
      ))}
    </nav>
  )
}