"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { defaultStatusConfig } from "@/lib/status-config"

// Create App Context
const AppContext = createContext({
  theme: false,
  setTheme: () => {},
  statusConfig: defaultStatusConfig,
  setStatusConfig: () => {},
  filters: {
    timeRange: "all",
    startDate: null,
    endDate: null,
    status: "",
    product: "",
    city: "",
    country: "",
  },
  updateFilter: () => {},
  resetFilters: () => {},
})

// Main App Provider that combines all contexts
export function AppProvider({ children }) {
  // Theme state
  const [theme, setTheme] = useState(false)

  // Status Config state
  const [statusConfig, setStatusConfig] = useState(defaultStatusConfig)

  // Filter states
  const [filters, setFilters] = useState({
    timeRange: "all",
    startDate: null,
    endDate: null,
    status: "",
    product: "",
    city: "",
    country: "",
  })

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

  // Load filters from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFilters = localStorage.getItem("filters")
      if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters)
          // Convert date strings back to Date objects
          if (parsedFilters.startDate) {
            parsedFilters.startDate = new Date(parsedFilters.startDate)
          }
          if (parsedFilters.endDate) {
            parsedFilters.endDate = new Date(parsedFilters.endDate)
          }
          setFilters(parsedFilters)
        } catch (error) {
          console.error("Failed to parse saved filters:", error)
        }
      }
    }
  }, [])

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("filters", JSON.stringify(filters))
    }
  }, [filters])

  // Update filter function
  const updateFilter = (key, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value
      }
      return newFilters
    })
  }

  // Reset filters function
  const resetFilters = () => {
    const defaultFilters = {
      timeRange: "all",
      startDate: null,
      endDate: null,
      status: "",
      product: "",
      city: "",
      country: "",
    }
    setFilters(defaultFilters)
  }

  const contextValue = {
    theme,
    setTheme,
    statusConfig,
    setStatusConfig,
    filters,
    updateFilter,
    resetFilters,
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the app context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Custom hook to use status config
export function useStatusConfig() {
  const { statusConfig, setStatusConfig } = useApp()
  return { statusConfig, setStatusConfig }
}

// Custom hook to use filters
export function useFilters() {
  const { filters, updateFilter, resetFilters } = useApp()
  return { filters, updateFilter, resetFilters }
}
