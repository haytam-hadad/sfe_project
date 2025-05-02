"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { defaultStatusConfig } from "@/lib/status-config"

// Create context for status configurations
export const StatusConfigContext = createContext({
  statusConfig: defaultStatusConfig,
  setStatusConfig: () => {},
})

export function StatusConfigProvider({ children }) {
  // Initialize with default config
  const [statusConfig, setStatusConfig] = useState(defaultStatusConfig)

  // Load saved config from localStorage on client side
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

  // Save config to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("statusConfig", JSON.stringify(statusConfig))
    }
  }, [statusConfig])

  return (
    <StatusConfigContext.Provider value={{ statusConfig, setStatusConfig }}>{children}</StatusConfigContext.Provider>
  )
}

// Custom hook to use the status config
export const useStatusConfig = () => {
  const context = useContext(StatusConfigContext)
  if (!context) {
    throw new Error("useStatusConfig must be used within a StatusConfigProvider")
  }
  return context
}
