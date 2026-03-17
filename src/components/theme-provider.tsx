"use client"

import * as React from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(
  undefined
)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "harvey-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [mounted, setMounted] = React.useState(false)

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null
    if (stored) {
      setTheme(stored)
    }
    setMounted(true)
  }, [storageKey])

  // Apply theme class to document
  React.useEffect(() => {
    if (!mounted) return
    
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey, mounted])

  const toggleTheme = React.useCallback(() => {
    const switchTheme = () => {
      setTheme((prev) => (prev === "light" ? "dark" : "light"))
    }

    // Use View Transitions API if available for smooth animation
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.startViewTransition(switchTheme)
    } else {
      // Fallback for browsers that don't support View Transitions
      switchTheme()
    }
  }, [])

  // Keyboard shortcut: press 't' to toggle theme
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (event.key === 't' || event.key === 'T') {
        toggleTheme()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleTheme])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

