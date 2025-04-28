"use client"

import { createContext, useState, useEffect } from "react"

// Create context with default values to avoid undefined errors
export const ThemeContext = createContext({
  theme: false,
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(false)


  // Initialize theme based on user preference or system preference
  useEffect(() => {
    const initializeTheme = async () => {
      if (typeof window !== "undefined") {
        // Check for saved preference first
        const savedTheme = localStorage.getItem("theme")

        if (savedTheme !== null) {
          const isDark = savedTheme === "true"
          setThemeState(isDark)
          document.documentElement.classList.toggle("dark", isDark)
        } else {
          // If no saved preference, use system preference
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
          setThemeState(prefersDark)
          document.documentElement.classList.toggle("dark", prefersDark)
          localStorage.setItem("theme", prefersDark ? "true" : "false")
        }
      }
    }
    initializeTheme()
  }, [])


  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme ? "true" : "false")

    // Apply theme class to <html> dynamically
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", newTheme)
    }
  }



  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

