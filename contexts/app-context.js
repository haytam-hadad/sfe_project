"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { defaultStatusConfig } from "@/lib/status-config"

// Create Theme Context
const AppContext = createContext({
  theme: false,
  setTheme: () => {},
})

// Create Status Config Context
const StatusConfigContext = createContext({
  statusConfig: defaultStatusConfig,
  setStatusConfig: () => {},
})

// Main App Provider that combines all contexts
export function AppProvider({ children }) {
  // Theme state
  const [theme, setTheme] = useState(false)

  // Status Config state
  const [statusConfig, setStatusConfig] = useState(defaultStatusConfig)

  // Load theme from localStorage
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

  // Load status config from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("statusConfig")
      if (savedConfig) {
        try {
          setStatusConfig(JSON.parse(savedConfig))
        } catch (error) {
          console.error("Failed to parse saved status config:", error)
        }
      }
    }
  }, [])

  // Save status config to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("statusConfig", JSON.stringify(statusConfig))
    }
  }, [statusConfig])

  return (
    <AppContext.Provider value={{ theme, setTheme }}>
      <StatusConfigContext.Provider value={{ statusConfig, setStatusConfig }}>{children}</StatusConfigContext.Provider>
    </AppContext.Provider>
  )
}

// Custom hooks to use the contexts
export const useTheme = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useTheme must be used within an AppProvider")
  }
  return context
}

export const useStatusConfig = () => {
  const context = useContext(StatusConfigContext)
  if (!context) {
    throw new Error("useStatusConfig must be used within an AppProvider")
  }
  return context
}
