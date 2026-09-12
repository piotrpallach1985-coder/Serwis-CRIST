import { useState, useCallback } from 'react';

export function useToast() {
  const [toastConfig, setToastConfig] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    let text = message;
    if (message instanceof Error) {
      text = message.message;
    } else if (typeof message === 'object' && message !== null) {
      text = JSON.stringify(message);
    }
    setToastConfig({ show: true, message: text, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prev => ({ ...prev, show: false }));
  }, []);

  return { toastConfig, showToast, hideToast };
}
