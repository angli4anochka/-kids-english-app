// Утилиты для воспроизведения звуковых эффектов
// Используем Web Audio API для генерации простых звуков

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Создаём AudioContext только когда он понадобится
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API не поддерживается', e);
      }
    }
  }

  // Включить/выключить звуки
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Простой клик
  playClick() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Правильный ответ - весёлый звук
  playCorrect() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';

    // Мелодичная последовательность
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.15;

    notes.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * duration);
    });

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Неправильный ответ - мягкий звук (не пугающий)
  playIncorrect() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Завершение острова - праздничный звук
  playCelebration() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';

    // Восходящая мелодия
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
    const duration = 0.12;

    notes.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * duration);
    });

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.7);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.7);
  }
}

// Singleton instance
export const soundManager = new SoundManager();
