import type { PersistStorage } from 'zustand/middleware'

let backupProgress: ((name: string, value: string | null) => void) | null = null
export function setProgressBackup(backup: (name: string, value: string | null) => void) { backupProgress = backup }

/** Transient movement must never cause synchronous disk writes on every frame. */
export function progressStorage<S extends object>(getStorage: () => Storage): PersistStorage<S> {
  let previous: S | undefined
  let previousVersion: number | undefined
  return {
    getItem(name) {
      try {
        const raw = getStorage().getItem(name)
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    },
    setItem(name, value) {
      const next = value.state
      const keys = Object.keys(next) as Array<keyof S>
      if (previous && previousVersion === value.version && keys.length === Object.keys(previous).length && keys.every((key) => Object.is(next[key], previous![key]))) return
      try {
        const serialized = JSON.stringify(value)
        getStorage().setItem(name, serialized)
        backupProgress?.(name, serialized)
        previous = next
        previousVersion = value.version
      } catch {
        // A full or disabled browser store must not crash the running garden.
      }
    },
    removeItem(name) {
      previous = undefined
      try { getStorage().removeItem(name); backupProgress?.(name, null) } catch { /* Storage can be disabled. */ }
    },
  }
}

export function acceptsGameInput(target: EventTarget | null, blocked: boolean) {
  if (blocked) return false
  return !(target instanceof Element && target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="slider"]'))
}

export function movementVector(x: number, z: number, speed: number) {
  const length = Math.hypot(x, z)
  const factor = length > 1 ? 1 / length : 1
  return { x: x * factor * speed, z: z * factor * speed }
}
