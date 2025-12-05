import { useEffect, useState } from "react"
import { ThemeProviderContext } from "./theme-provider/theme-context.js"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for window availability to prevent SSR/hydration issues
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    const storedTheme = localStorage.getItem(storageKey);
    const validThemes: Theme[] = ['dark', 'light', 'system'];
    // Validate stored value before casting to Theme type
    return (storedTheme && validThemes.includes(storedTheme as Theme)) 
      ? (storedTheme as Theme) 
      : defaultTheme;
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      // Check for window availability before accessing localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, theme)
      }
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}



