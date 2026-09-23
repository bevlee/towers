import { useEffect, useRef } from 'react'

/** Open modals, innermost last — only the top one handles keys. */
const modalStack: object[] = []

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard behaviour for a modal dialog: moves focus into the dialog on open
 * (to the `[data-autofocus]` element, else the first focusable one), keeps Tab
 * inside it, closes on Escape when `onClose` is given, and restores focus to
 * whatever was focused before on close. Attach the returned ref to the dialog panel.
 */
export function useModal<T extends HTMLElement = HTMLDivElement>(onClose?: () => void) {
  const panelRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const panel = panelRef.current
    const token = {}
    modalStack.push(token)
    const previouslyFocused = document.activeElement as HTMLElement | null

    const initial = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    initial?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== token) return
      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!panel.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      modalStack.splice(modalStack.indexOf(token), 1)
      previouslyFocused?.focus?.()
    }
  }, [])

  return panelRef
}
