"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  // Currency conversion
  conversionRate: 0.007,
  setConversionRate: () => {},
  convertToUSD: () => {},
  formatCurrency: () => {},
  formatKES: () => {},
  formatAsUSD: () => {},
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

  // Initialize conversion rate from localStorage safely
  const [conversionRate, setConversionRate] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedRate = localStorage.getItem('currencyConversionRate');
      return storedRate ? parseFloat(storedRate) : 0.007;
    }
    return 0.007;
  });

  // Update conversion rate and save to localStorage
  const updateConversionRate = useCallback((newRate) => {
    setConversionRate(newRate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currencyConversionRate', newRate.toString());
    }
  }, []);

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

  // Function to convert KES to USD
  const convertToUSD = (kesAmount) => {
    if (!kesAmount || isNaN(kesAmount)) return 0
    const usdAmount = kesAmount * conversionRate
    return Number(usdAmount.toFixed(2))
  }

  // Function to format number as currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Function to format KES amount
  const formatKES = (amount) => {
    if (!amount || isNaN(amount)) return 'KES 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to convert and format KES to USD
  const formatAsUSD = (kesAmount) => {
    const usdAmount = convertToUSD(kesAmount);
    return formatCurrency(usdAmount);
  };

  // Theme toggle function
  const toggleTheme = () => {
    setTheme(theme => !theme)
  }

  const contextValue = {
    theme,
    setTheme,
    statusConfig,
    setStatusConfig,
    filters,
    updateFilter,
    resetFilters,
    // Currency conversion
    conversionRate,
    setConversionRate,
    convertToUSD,
    formatCurrency,
    formatKES,
    formatAsUSD,
    toggleTheme,
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
