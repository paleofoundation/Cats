let context: AudioContext | null = null

const audioContext = () => {
  if (typeof window === 'undefined') return null
  context ??= new window.AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

const tone = (frequency: number, duration: number, delay = 0, type: OscillatorType = 'sine', volume = 0.035) => {
  const ctx = audioContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const starts = ctx.currentTime + delay
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, starts)
  gain.gain.setValueAtTime(0.0001, starts)
  gain.gain.exponentialRampToValueAtTime(volume, starts + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, starts + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(starts)
  oscillator.stop(starts + duration + 0.02)
}

export const playCollect = () => {
  tone(520, 0.13, 0, 'sine', 0.04)
  tone(780, 0.18, 0.1, 'sine', 0.035)
}

export const playBuild = (final = false) => {
  tone(150, 0.09, 0, 'triangle', 0.045)
  tone(230, 0.12, 0.08, 'triangle', 0.04)
  if (final) {
    tone(440, 0.34, 0.2, 'sine', 0.035)
    tone(660, 0.4, 0.35, 'sine', 0.03)
  }
}

export const playPurr = () => {
  const ctx = audioContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(27, ctx.currentTime)
  oscillator.frequency.linearRampToValueAtTime(33, ctx.currentTime + 1.25)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.018, ctx.currentTime + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 1.55)
  tone(330, 0.18, 0.08, 'sine', 0.02)
}
