import { LayoutGrid, LayoutPanelLeft } from "lucide-react";

interface LayoutToggleProps {
  layout: 'sidebar' | 'topbar';
  onLayoutChange: (layout: 'sidebar' | 'topbar') => void;
}

export function LayoutToggle({ layout, onLayoutChange }: LayoutToggleProps) {
  return (
    <div 
      className="inline-flex rounded-2xl p-1 gap-1"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <button
        onClick={() => onLayoutChange('topbar')}
        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
          layout === 'topbar' ? 'text-white' : 'text-white/50'
        }`}
        style={{
          background: layout === 'topbar' 
            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)'
            : 'transparent',
          border: layout === 'topbar'
            ? '1px solid rgba(56, 189, 248, 0.4)'
            : '1px solid transparent',
          boxShadow: layout === 'topbar' 
            ? '0 0 20px rgba(56, 189, 248, 0.2)'
            : 'none'
        }}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm">Top Bar</span>
      </button>
      
      <button
        onClick={() => onLayoutChange('sidebar')}
        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
          layout === 'sidebar' ? 'text-white' : 'text-white/50'
        }`}
        style={{
          background: layout === 'sidebar' 
            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)'
            : 'transparent',
          border: layout === 'sidebar'
            ? '1px solid rgba(56, 189, 248, 0.4)'
            : '1px solid transparent',
          boxShadow: layout === 'sidebar' 
            ? '0 0 20px rgba(56, 189, 248, 0.2)'
            : 'none'
        }}
      >
        <LayoutPanelLeft className="w-4 h-4" />
        <span className="text-sm">Sidebar</span>
      </button>
    </div>
  );
}