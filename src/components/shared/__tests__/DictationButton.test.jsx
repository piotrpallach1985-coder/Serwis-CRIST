import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DictationButton from '../DictationButton';

// Mock Zustand
vi.mock('../../../store/managerStore', () => ({
  useManagerStore: vi.fn((selector) => {
    const state = { groqModel: 'whisper-large-v3', geminiModel: 'gemini-2.5-flash' };
    return selector(state);
  })
}));

// Mock Firebase functions
const mockTranscribe = vi.fn(() => Promise.resolve({ data: { text: "Przykładowa transkrypcja testowa." } }));
const mockLogUsage = vi.fn(() => Promise.resolve({ data: { success: true } }));

vi.mock('../../../firebase', () => ({
  functions: {},
  app: {}
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn((fns, name) => {
    if (name === 'transcribeAudio') return mockTranscribe;
    if (name === 'logAIUsage') return mockLogUsage;
    return vi.fn();
  }),
  getFunctions: vi.fn()
}));

// Mock VertexAI
vi.mock('@firebase/vertexai-preview', () => ({
  getVertexAI: vi.fn(),
  getGenerativeModel: vi.fn(() => ({
    generateContent: vi.fn(() => Promise.resolve({
      response: {
        text: () => "Sformatowana transkrypcja",
        usageMetadata: { totalTokenCount: 150 }
      }
    }))
  }))
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'pl' } })
}));

// Mock tenantHelper
vi.mock('../../../utils/tenantHelper', () => ({
  getCurrentTenant: vi.fn(() => 'test-tenant')
}));

// Mock browser APIs
global.fetch = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    }))
  },
  configurable: true
});

class MockMediaRecorder {
  constructor() {
    this.state = 'inactive';
    this.mimeType = 'audio/webm';
  }
  start() {
    this.state = 'recording';
    // Simulate some data available
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['dummy audio data'], { type: 'audio/webm' }) });
    }
  }
  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }
}
global.MediaRecorder = MockMediaRecorder;

describe('DictationButton Security & AI Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('securely calls Firebase Cloud Function instead of exposing Groq API key via fetch', async () => {
    const onResultMock = vi.fn();
    
    render(<DictationButton mode="text" onResult={onResultMock} />);
    
    // Find the button (by title or role depending on how it's rendered, it's a button type="button")
    const button = screen.getByRole('button');
    
    // 1. Click to start recording
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // 2. Click to stop recording and trigger processing
    fireEvent.click(button);

    // Wait for the mock transcribing function to be called
    await waitFor(() => {
      expect(mockTranscribe).toHaveBeenCalled();
    });

    // Verify it securely passed the blob to our Cloud Function
    const transcribeCallArgs = mockTranscribe.mock.calls[0][0];
    expect(transcribeCallArgs).toHaveProperty('audioBase64');
    expect(transcribeCallArgs).toHaveProperty('model', 'whisper-large-v3');
    expect(transcribeCallArgs).toHaveProperty('tenantId', 'test-tenant');

    // Verify that NO direct fetch call was made to Groq API
    const groqFetchCalls = mockFetchCallsTo('api.groq.com');
    expect(groqFetchCalls).toBe(0);

    // Verify it called onResult with the processed text
    await waitFor(() => {
      expect(onResultMock).toHaveBeenCalledWith('Sformatowana transkrypcja');
    });

    // Verify billing/usage was logged
    expect(mockLogUsage).toHaveBeenCalled();
    const logUsageArgs = mockLogUsage.mock.calls[0][0];
    expect(logUsageArgs).toHaveProperty('geminiTokens');
  });

  // Helper function to check if fetch was called with a specific URL
  function mockFetchCallsTo(urlSubstring) {
    return global.fetch.mock.calls.filter(call => call[0].includes(urlSubstring)).length;
  }
});
