export const getTicketStatusConfig = (t) => ({
  1: { id: 1, key: 'new', label: t ? t('tickets.statuses.status_1', 'Nowe') : 'Nowe', color: 'bg-red-100 text-red-800 border-red-200', hex: '#f87171' },
  2: { id: 2, key: 'in_progress', label: t ? t('tickets.statuses.status_2', 'Weryfikacja / W toku') : 'W toku', color: 'bg-orange-100 text-orange-800 border-orange-200', hex: '#fbbf24' },
  3: { id: 3, key: 'pending', label: t ? t('tickets.statuses.status_3', 'Oczekuj¹ce') : 'Oczekuj¹ce', color: 'bg-gray-100 text-gray-800 border-gray-200', hex: '#9ca3af' },
  4: { id: 4, key: 'rejected', label: t ? t('tickets.statuses.status_4', 'Odrzucone') : 'Odrzucone', color: 'bg-slate-100 text-slate-800 border-slate-200', hex: '#6b7280' },
  5: { id: 5, key: 'completed', label: t ? t('tickets.statuses.status_5', 'Zakoñczone') : 'Zakoñczone', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', hex: '#34d399' }
});

export const getServiceStatusConfig = (t) => ({
  'pending': { id: 'pending', label: t ? t('planned.status.pending', 'Oczekuj¹cy') : 'Oczekuj¹cy', color: 'bg-blue-100 text-blue-800', hex: '#3b82f6' },
  'in_progress': { id: 'in_progress', label: t ? t('planned.status.in_progress', 'W trakcie') : 'W trakcie', color: 'bg-orange-100 text-orange-800', hex: '#fbbf24' },
  'completed': { id: 'completed', label: t ? t('planned.status.completed', 'Zakoñczony') : 'Zakoñczony', color: 'bg-emerald-100 text-emerald-800', hex: '#10b981' }
});
