import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  onMessage: vi.fn(),
  getToken: vi.fn()
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultVal) => (typeof defaultVal === 'string' ? defaultVal : key),
    i18n: {
      language: 'pl',
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));
