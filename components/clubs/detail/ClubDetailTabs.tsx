'use client';
import { useState } from 'react';
import type { ClubFullDetail } from '@/types/club';
import type { AdminRole } from '@/types/admin';
import { OverviewTab } from './OverviewTab';
import { PlayersTab } from './PlayersTab';
import { PaymentsTab } from './PaymentsTab';
import { AuditTab } from './AuditTab';
import { NotesTab } from './NotesTab';
import { BillingTab } from './BillingTab';
import { ActivityTab } from './ActivityTab';

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'players',    label: 'Jugadores' },
  { id: 'payments',   label: 'Pagos' },
  { id: 'activity',   label: 'Actividad' },
  { id: 'billing',    label: 'Facturación' },
  { id: 'audit',      label: 'Auditoría' },
  { id: 'notes',      label: 'Notas' },
] as const;

type TabId = typeof TABS[number]['id'];

interface Props {
  detail: ClubFullDetail;
  role: AdminRole;
}

export function ClubDetailTabs({ detail, role }: Props) {
  const [active, setActive] = useState<TabId>('overview');

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
            {tab.id === 'players' && (
              <span className="ml-1.5 text-xs text-gray-600">({detail.player_count})</span>
            )}
            {tab.id === 'payments' && (
              <span className="ml-1.5 text-xs text-gray-600">({detail.pagos.length})</span>
            )}
            {tab.id === 'activity' && (
              <span className="ml-1.5 text-xs text-gray-600">({detail.activity_logs.length})</span>
            )}
            {tab.id === 'audit' && (
              <span className="ml-1.5 text-xs text-gray-600">({detail.audit_events.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {active === 'overview'  && <OverviewTab detail={detail} />}
        {active === 'players'   && <PlayersTab players={detail.players} />}
        {active === 'payments'  && <PaymentsTab pagos={detail.pagos} />}
        {active === 'billing'   && <BillingTab detail={detail} initialRecords={detail.billing_records} />}
        {active === 'activity'  && <ActivityTab logs={detail.activity_logs} />}
        {active === 'audit'     && <AuditTab events={detail.audit_events} />}
        {active === 'notes'     && <NotesTab slug={detail.slug} initialNotes={detail.admin_notes ?? ''} />}
      </div>
    </div>
  );
}
