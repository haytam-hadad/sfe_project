"use client"

import { createContext, useContext, useEffect, useState } from "react"

// Create context for theme
export const ThemeContext = createContext({
  theme: false,
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  // Initialize with default theme
  const [theme, setTheme] = useState(false)

  // Load saved theme from localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") === "true"
      setTheme(savedTheme)

      // Apply theme to document
      if (savedTheme) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme ? "true" : "false")

      // Apply theme to document
      if (theme) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

// Custom hook to use the theme
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

