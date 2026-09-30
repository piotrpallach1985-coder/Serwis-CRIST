import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useConfirmModal() {
  const { t } = useTranslation();
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: t('common.yes', 'Tak') });

  const showConfirm = useCallback((title, message, onConfirm, confirmText = t('common.yes', 'Tak')) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm: async () => { await onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); }, confirmText });
  }, [t]);

  const hideConfirm = useCallback(() => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { confirmConfig, showConfirm, hideConfirm, setConfirmConfig };
}
