/**
 * Unit tests for sounds utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundManager } from './sounds';

// Mock Web Audio API
const mockOscillatorStop = vi.fn();
const mockOscillatorStart = vi.fn();
const mockSetValueAtTime = vi.fn();
const mockExponentialRampToValueAtTime = vi.fn();
const mockConnect = vi.fn();

const mockOscillator = {
  connect: mockConnect,
  start: mockOscillatorStart,
  stop: mockOscillatorStop,
  frequency: {
    value: 0,
    setValueAtTime: mockSetValueAtTime,
  },
  type: 'sine' as OscillatorType,
};

const mockGainNode = {
  connect: mockConnect,
  gain: {
    value: 0,
    setValueAtTime: mockSetValueAtTime,
    exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
  },
};

const mockAudioContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
};

describe('soundManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AudioContext in global window
    global.window = {
      AudioContext: vi.fn(() => mockAudioContext),
    } as any;

    // Reset audio context current time
    mockAudioContext.currentTime = 0;
  });

  describe('playClick', () => {
    it('should create oscillator and gain node', () => {
      // Create new instance to use mocked AudioContext
      const sm = new (soundManager.constructor as any)();

      sm.playClick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should connect oscillator to gain node and destination', () => {
      const sm = new (soundManager.constructor as any)();
      mockConnect.mockClear();

      sm.playClick();

      // Oscillator connects to gain node, gain node connects to destination
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should set frequency to 800Hz for click sound', () => {
      const sm = new (soundManager.constructor as any)();

      sm.playClick();

      expect(mockOscillator.frequency.value).toBe(800);
    });

    it('should set oscillator type to sine', () => {
      const sm = new (soundManager.constructor as any)();

      sm.playClick();

      expect(mockOscillator.type).toBe('sine');
    });

    it('should start and stop oscillator with correct timing', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.currentTime = 1.5;

      sm.playClick();

      expect(mockOscillatorStart).toHaveBeenCalledWith(1.5);
      expect(mockOscillatorStop).toHaveBeenCalledWith(1.6); // 1.5 + 0.1
    });

    it('should not play sound when disabled', () => {
      const sm = new (soundManager.constructor as any)();
      sm.setEnabled(false);
      mockAudioContext.createOscillator.mockClear();

      sm.playClick();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('playCorrect', () => {
    it('should create oscillator and gain node', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.createOscillator.mockClear();

      sm.playCorrect();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should set frequency for melodic sequence (C5, E5, G5)', () => {
      const sm = new (soundManager.constructor as any)();
      mockSetValueAtTime.mockClear();

      sm.playCorrect();

      // Should set frequency for each note in the sequence
      const calls = mockSetValueAtTime.mock.calls;
      const frequencyCalls = calls.filter((call: any) =>
        [523.25, 659.25, 783.99].includes(call[0])
      );

      expect(frequencyCalls.length).toBeGreaterThan(0);
    });

    it('should play for 0.5 seconds', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.currentTime = 2.0;

      sm.playCorrect();

      expect(mockOscillatorStart).toHaveBeenCalledWith(2.0);
      expect(mockOscillatorStop).toHaveBeenCalledWith(2.5); // 2.0 + 0.5
    });

    it('should not play sound when disabled', () => {
      const sm = new (soundManager.constructor as any)();
      sm.setEnabled(false);
      mockAudioContext.createOscillator.mockClear();

      sm.playCorrect();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('playIncorrect', () => {
    it('should create oscillator and gain node', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.createOscillator.mockClear();

      sm.playIncorrect();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should set frequency to 200Hz for incorrect sound', () => {
      const sm = new (soundManager.constructor as any)();

      sm.playIncorrect();

      expect(mockOscillator.frequency.value).toBe(200);
    });

    it('should play for 0.3 seconds', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.currentTime = 1.0;

      sm.playIncorrect();

      expect(mockOscillatorStart).toHaveBeenCalledWith(1.0);
      expect(mockOscillatorStop).toHaveBeenCalledWith(1.3); // 1.0 + 0.3
    });

    it('should not play sound when disabled', () => {
      const sm = new (soundManager.constructor as any)();
      sm.setEnabled(false);
      mockAudioContext.createOscillator.mockClear();

      sm.playIncorrect();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('playCelebration', () => {
    it('should create oscillator and gain node', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.createOscillator.mockClear();

      sm.playCelebration();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should set oscillator type to square', () => {
      const sm = new (soundManager.constructor as any)();

      sm.playCelebration();

      expect(mockOscillator.type).toBe('square');
    });

    it('should set frequency for ascending melody (C5, D5, E5, G5, A5)', () => {
      const sm = new (soundManager.constructor as any)();
      mockSetValueAtTime.mockClear();

      sm.playCelebration();

      // Should set frequency for each note in the celebration sequence
      const calls = mockSetValueAtTime.mock.calls;
      const frequencyCalls = calls.filter((call: any) =>
        [523.25, 587.33, 659.25, 783.99, 880.00].includes(call[0])
      );

      expect(frequencyCalls.length).toBeGreaterThan(0);
    });

    it('should play for 0.7 seconds', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.currentTime = 3.0;

      sm.playCelebration();

      expect(mockOscillatorStart).toHaveBeenCalledWith(3.0);
      expect(mockOscillatorStop).toHaveBeenCalledWith(3.7); // 3.0 + 0.7
    });

    it('should not play sound when disabled', () => {
      const sm = new (soundManager.constructor as any)();
      sm.setEnabled(false);
      mockAudioContext.createOscillator.mockClear();

      sm.playCelebration();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('setEnabled', () => {
    it('should enable sounds', () => {
      const sm = new (soundManager.constructor as any)();
      mockAudioContext.createOscillator.mockClear();

      sm.setEnabled(true);
      sm.playClick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should disable sounds', () => {
      const sm = new (soundManager.constructor as any)();

      sm.setEnabled(false);
      mockAudioContext.createOscillator.mockClear();
      sm.playClick();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('should allow re-enabling sounds', () => {
      const sm = new (soundManager.constructor as any)();

      sm.setEnabled(false);
      sm.setEnabled(true);
      mockAudioContext.createOscillator.mockClear();
      sm.playClick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('AudioContext initialization', () => {
    it('should handle missing AudioContext gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      global.window = {} as any;

      const sm = new (soundManager.constructor as any)();

      // Should not throw error
      expect(() => sm.playClick()).not.toThrow();

      consoleWarnSpy.mockRestore();
    });

    it('should handle webkitAudioContext fallback', () => {
      global.window = {
        webkitAudioContext: vi.fn(() => mockAudioContext),
      } as any;

      const sm = new (soundManager.constructor as any)();
      mockAudioContext.createOscillator.mockClear();

      sm.playClick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });
});
