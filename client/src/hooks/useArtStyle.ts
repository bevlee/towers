import { useSyncExternalStore } from 'react'

export type ArtStyle = 'monoline' | 'arcane'

const KEY = 'towers-art-style'
const listeners = new Set<() => void>()

function read(): ArtStyle {
  try {
    return localStorage.getItem(KEY) === 'arcane' ? 'arcane' : 'monoline'
  } catch {
    return 'monoline'
  }
}

let current = read()

export function setArtStyle(style: ArtStyle) {
  current = style
  try {
    localStorage.setItem(KEY, style)
  } catch {
    // private browsing etc — style still applies for this session
  }
  listeners.forEach((fn) => fn())
}

export function useArtStyle(): ArtStyle {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => current,
  )
}
