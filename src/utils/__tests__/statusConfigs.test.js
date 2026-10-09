import { describe, it, expect, vi } from 'vitest';
import { getTicketStatusConfig, getServiceStatusConfig } from '../statusConfigs';

describe('statusConfigs.js', () => {
  it('getTicketStatusConfig zawiera zdefiniowane klucze i kolory', () => {
    const mockT = vi.fn().mockImplementation((key, defaultVal) => defaultVal);
    const config = getTicketStatusConfig(mockT);

    expect(config[1]).toBeDefined();
    expect(config[1].hex).toBe('#f87171');
    expect(config[5].key).toBe('completed');
  });

  it('getServiceStatusConfig zawiera podstawowe statusy planowane', () => {
    const config = getServiceStatusConfig();

    expect(config['pending']).toBeDefined();
    expect(config['in_progress']).toBeDefined();
    expect(config['completed']).toBeDefined();
    
    expect(config['in_progress'].hex).toBe('#fbbf24');
  });
});
