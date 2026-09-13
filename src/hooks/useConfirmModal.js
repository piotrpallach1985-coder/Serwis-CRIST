import { useState, useCallback } from 'react';

export function useConfirmModal() {
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Tak' });

  const showConfirm = useCallback((title, message, onConfirm, confirmText = 'Tak') => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: async () => { await onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); }, confirmText });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { confirmConfig, showConfirm, hideConfirm, setConfirmConfig };
}
