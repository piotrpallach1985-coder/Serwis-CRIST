export const getTicketStatusConfig = (t) => ({
  1: { id: 1, key: 'new', label: t ? t('tickets.statuses.status_1', 'Zgłoszone') : 'Zgłoszone', color: 'bg-red-100 text-red-800 border-red-200', hex: '#f87171' },
  2: { id: 2, key: 'in_progress', label: t ? t('tickets.statuses.status_2', 'Weryfikacja UT') : 'Weryfikacja UT', color: 'bg-orange-100 text-orange-800 border-orange-200', hex: '#fbbf24' },
  3: { id: 3, key: 'pending', label: t ? t('tickets.statuses.status_3', 'Oczek. na naprawę') : 'Oczek. na naprawę', color: 'bg-blue-100 text-blue-800 border-blue-200', hex: '#60a5fa' },
  4: { id: 4, key: 'repairing', label: t ? t('tickets.statuses.status_4', 'Naprawa w trakcie') : 'Naprawa w trakcie', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', hex: '#6366f1' },
  5: { id: 5, key: 'completed', label: t ? t('tickets.statuses.status_5', 'Zakończone') : 'Zakończone', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', hex: '#34d399' }
});

export const getServiceStatusConfig = (t) => ({
  'pending': { id: 'pending', label: t ? t('planned.status.pending', 'Oczekujący') : 'Oczekujący', color: 'bg-blue-100 text-blue-800', hex: '#3b82f6' },
  'in_progress': { id: 'in_progress', label: t ? t('planned.status.in_progress', 'W trakcie') : 'W trakcie', color: 'bg-orange-100 text-orange-800', hex: '#fbbf24' },
  'completed': { id: 'completed', label: t ? t('planned.status.completed', 'Zakończony') : 'Zakończony', color: 'bg-emerald-100 text-emerald-800', hex: '#10b981' }
});
