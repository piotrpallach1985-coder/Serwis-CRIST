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

if (typeof window !== 'undefined' && typeof window.alert === 'function') {
  window.alert = vi.fn();
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    scale: vi.fn(),
    lineWidth: 2,
    lineCap: 'round',
    lineJoin: 'round',
    strokeStyle: '#0f172a',
  }));
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
}
