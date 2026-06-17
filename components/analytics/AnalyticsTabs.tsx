'use client';
import { useState } from 'react';
import { BarChart3, MessageSquare } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { WAAnalytics } from './WAAnalytics';

const TABS = [
  { id: 'negocio',    label: 'Negocio',   icon: BarChart3,     component: AnalyticsDashboard },
  { id: 'whatsapp',   label: 'WhatsApp',  icon: MessageSquare, component: WAAnalytics },
];

export function AnalyticsTabs() {
  const [active, setActive] = useState('negocio');
  const Current = TABS.find(t => t.id === active)?.component ?? AnalyticsDashboard;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? 'rgba(106,0,255,0.15)' : 'transparent',
                color:      isActive ? '#AE68FF' : 'rgba(255,255,255,0.4)',
                border:     isActive ? '1px solid rgba(106,0,255,0.30)' : '1px solid transparent',
                boxShadow:  isActive ? '0 0 12px rgba(106,0,255,0.20)' : 'none',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Current />
    </div>
  );
}
