'use client';
import { useState } from 'react';
import type { AfiliadoFullDetail } from '@/types/afiliado';
import { AfiliadoInfoTab } from './AfiliadoInfoTab';
import { AfiliadoBillingTab } from './AfiliadoBillingTab';

const TABS = [
  { id: 'info',    label: 'Información' },
  { id: 'billing', label: 'Facturación' },
] as const;

type TabId = typeof TABS[number]['id'];

interface Props {
  detail: AfiliadoFullDetail;
}

export function AfiliadoDetailTabs({ detail: initialDetail }: Props) {
  const [detail, setDetail] = useState(initialDetail);
  const [active, setActive] = useState<TabId>('info');

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/8 pb-0 overflow-x-auto whitespace-nowrap scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.id === 'billing' && (
              <span className="ml-1.5 text-xs text-gray-600">({detail.billing_records.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === 'info' && (
          <AfiliadoInfoTab
            afiliado={detail}
            onUpdated={updated => setDetail(prev => ({ ...prev, ...updated }))}
          />
        )}
        {active === 'billing' && (
          <AfiliadoBillingTab
            afiliado={detail}
            initialRecords={detail.billing_records}
          />
        )}
      </div>
    </div>
  );
}
