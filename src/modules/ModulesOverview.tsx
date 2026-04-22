import React, { useState } from 'react';
import { Search } from 'lucide-react';

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
    <div className="p-8 animate-fade-in bg-[var(--enba-bg)] min-h-full">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[var(--enba-dark)] mb-2 uppercase tracking-tight">Ana Sayfa</h1>
          <p className="text-gray-500 font-medium">Platformdaki tüm uygulama ve araçlara hızlı erişim sağlayın.</p>
        </div>
        <div className="text-[10px] text-gray-300 font-bold mb-1">VER 1.3</div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-10" style={{ maxWidth: '400px' }}>
        <input 
          type="text" 
          placeholder="Modül ara..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ height: '48px', paddingLeft: '48px' }}
          className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-[var(--enba-orange)]/10 focus:border-[var(--enba-orange)]/30 transition-all outline-none text-base font-semibold text-[var(--enba-dark)]"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} strokeWidth={2.5} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[var(--enba-orange)]/5 hover:-translate-y-2 transition-all duration-500 flex flex-col items-start text-left gap-6 overflow-hidden"
          >
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-[var(--enba-orange)]/10 transition-colors duration-500" />
            
            <div 
              style={{ width: '44px', height: '44px' }}
              className="bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[var(--enba-orange)] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-[var(--enba-orange)]/30 group-hover:scale-110"
            >
              <item.icon size={20} strokeWidth={2.5} />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-[var(--enba-dark)] group-hover:text-[var(--enba-orange)] transition-colors duration-300">{item.label}</h3>
              <p className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-[2px] opacity-60 group-hover:opacity-100 group-hover:text-[var(--enba-orange)]/60 transition-all">Sisteme Giriş Yap</p>
            </div>

            {/* Corner arrow */}
            <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <div className="w-6 h-6 rounded-full bg-[var(--enba-orange)]/10 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--enba-orange)]"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
