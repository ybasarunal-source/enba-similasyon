import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface ModulesOverviewProps {
  navigate: (view: string) => void;
  menuItems: any[];
}

export const ModulesOverview: React.FC<ModulesOverviewProps> = ({ navigate, menuItems }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Exclude the 'modules' item itself from the grid
  const filteredItems = menuItems.filter(item => 
    item.id !== 'modules' && 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in bg-[var(--enba-bg)] min-h-full space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Ana Sayfa</h1>
          <p className="text-xs font-medium text-gray-400">Platformdaki tüm uygulama ve araçlara hızlı erişim sağlayın.</p>
        </div>
        <div className="text-[9px] text-gray-300 font-bold mb-1 tracking-widest opacity-50">VER 1.4</div>
      </div>

      {/* Search Bar */}
      <div className="relative" style={{ maxWidth: '360px' }}>
        <input 
          type="text" 
          placeholder="Modül ara..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ height: '42px', paddingLeft: '42px' }}
          className="w-full bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-[var(--enba-orange)]/10 focus:border-[var(--enba-orange)]/30 transition-all outline-none text-sm font-medium text-gray-700 placeholder-gray-400"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={16} strokeWidth={2.5} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[var(--enba-orange)]/5 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 text-left overflow-hidden"
          >
            <div 
              style={{ width: '36px', height: '36px' }}
              className="bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[var(--enba-orange)] group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0"
            >
              {item.icon ? <item.icon size={18} strokeWidth={2.5} /> : null}
            </div>
            
            <div className="relative z-10 flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[var(--enba-orange)] transition-colors duration-300 truncate">{item.label}</h3>
              <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-all">Giriş Yap</p>
            </div>

            <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0">
              <ArrowRight size={14} className="text-[var(--enba-orange)]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
