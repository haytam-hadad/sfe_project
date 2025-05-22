"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { fetchMySheetData } from "@/lib/api-client"
import {
  DEFAULT_STATUS_CONFIG,
  DEFAULT_FILTERS,
  DEFAULT_CONVERSION_RATE,
  DEFAULT_CONVERSION_RATES,
} from "@/lib/constants"

// Create App Context
const AppContext = createContext({
  theme: false,
  setTheme: () => {},
  statusConfig: DEFAULT_STATUS_CONFIG,
  setStatusConfig: () => {},
  filters: DEFAULT_FILTERS,
  updateFilter: () => {},
  resetFilters: () => {},
  // Currency conversion
  conversionRate: DEFAULT_CONVERSION_RATE,
  setConversionRate: () => {},
  countryRates: DEFAULT_CONVERSION_RATES,
  updateCountryRate: () => {},
  getCountryRate: () => {},
  convertToUSD: () => {},
  formatCurrency: () => {},
  formatAmount: () => {},
  formatAsUSD: () => {},
  // Sheet data
  sheetData: [],
  loadingSheetData: false,
  errorSheetData: null,
  refreshSheetData: () => {},
})

// Main App Provider that combines all contexts
export function AppProvider({ children }) {
  // Theme state
  const [theme, setTheme] = useState(false)

  // Status Config state
  const [statusConfig, setStatusConfig] = useState(DEFAULT_STATUS_CONFIG)

  // Sheet data state
  const [sheetData, setSheetData] = useState([])
  const [loadingSheetData, setLoadingSheetData] = useState(false)
  const [errorSheetData, setErrorSheetData] = useState(null)

  // Global shared filters state
  const [filters, setFilters] = useState(() => {
    if (typeof window !== "undefined") {
      const savedFilters = localStorage.getItem("globalFilters")
      if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters)
          // Convert date strings back to Date objects if they exist
          if (parsedFilters.startDate) {
            parsedFilters.startDate = parsedFilters.startDate
          }
          if (parsedFilters.endDate) {
            parsedFilters.endDate = parsedFilters.endDate
          }
          return parsedFilters
        } catch (error) {
          console.error("Failed to parse saved filters:", error)
        }
      }
    }
    return DEFAULT_FILTERS
  })

  // Initialize conversion rate from localStorage safely
  const [conversionRate, setConversionRate] = useState(() => {
    if (typeof window !== "undefined") {
      const storedRate = localStorage.getItem("currencyConversionRate")
      return storedRate ? Number.parseFloat(storedRate) : DEFAULT_CONVERSION_RATE
    }
    return DEFAULT_CONVERSION_RATE
  })

  // Initialize country-specific conversion rates from localStorage
  const [countryRates, setCountryRates] = useState(() => {
    if (typeof window !== "undefined") {
      const storedRates = localStorage.getItem("countryConversionRates")
      return storedRates ? JSON.parse(storedRates) : DEFAULT_CONVERSION_RATES
    }
    return DEFAULT_CONVERSION_RATES
  })

  // Function to fetch sheet data
  const refreshSheetData = useCallback(async (token) => {
    if (!token) return

    setLoadingSheetData(true)
    setErrorSheetData(null)

    try {
      const result = await fetchMySheetData(token)

      if (!result || !Array.isArray(result)) {
        throw new Error("Invalid data format received")
      }

      // Process the data to ensure we capture all statuses
      const processedData = result.map((order) => {
        if (order["STATUS"] !== undefined) {
          order["STATUS"] = String(order["STATUS"]).trim()
        }
        return order
      })

      setSheetData(processedData)
    } catch (error) {
      console.error("Error fetching sheet data:", error)
      setErrorSheetData(error.message || "Failed to fetch data")
    } finally {
      setLoadingSheetData(false)
    }
  }, [])

  // Update conversion rate and save to localStorage
  const updateConversionRate = useCallback((newRate) => {
    setConversionRate(newRate)
    if (typeof window !== "undefined") {
      localStorage.setItem("currencyConversionRate", newRate.toString())
    }
  }, [])

  // Update country-specific conversion rate
  const updateCountryRate = useCallback((country, rate) => {
    setCountryRates((prev) => {
      const newRates = { ...prev, [country]: Number.parseFloat(rate) }

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("countryConversionRates", JSON.stringify(newRates))
      }

      return newRates
    })
  }, [])

  // Get country-specific conversion rate
  const getCountryRate = useCallback(
    (country) => {
      return countryRates[country] || conversionRate
    },
    [countryRates, conversionRate],
  )

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

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("globalFilters", JSON.stringify(filters))
    }
  }, [filters])

  // Update filter function - enhanced to handle shared filters
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: value,
      }

      // Save to localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("globalFilters", JSON.stringify(newFilters))
      }

      return newFilters
    })
  }, [])

  // Reset filters function - enhanced to properly reset all shared filters
  const resetFilters = useCallback(() => {
    // Reset to default filters
    setFilters(DEFAULT_FILTERS)

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("globalFilters", JSON.stringify(DEFAULT_FILTERS))

      // Also clear any page-specific filter storage
      localStorage.removeItem("localFilters")
      localStorage.removeItem("searchTerm")
      localStorage.removeItem("sortField")
      localStorage.removeItem("sortDirection")

      // Clear URL parameters if applicable
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete("startDate")
        url.searchParams.delete("endDate")
        url.searchParams.delete("product")
        url.searchParams.delete("city")
        url.searchParams.delete("country")
        url.searchParams.delete("status")
        url.searchParams.delete("search")
        window.history.pushState({}, "", url)
      } catch (e) {
        console.error("Error clearing URL parameters:", e)
      }
    }

    // Notify user if needed
    console.log("All filters have been reset")

    return DEFAULT_FILTERS
  }, [])

  // Function to convert amount to USD
  const convertToUSD = useCallback(
    (amount, country) => {
      if (!amount || isNaN(amount)) return 0
      const rate = getCountryRate(country)
      const usdAmount = amount * rate
      return Number(usdAmount.toFixed(2))
    },
    [getCountryRate],
  )

  // Function to format number as currency
  const formatCurrency = useCallback((amount, currency = "USD") => {
    if (!amount || isNaN(amount)) return "$0.00"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }, [])

  // Function to format amount
  const formatAmount = useCallback((amount) => {
    if (!amount || isNaN(amount)) return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  // Function to convert and format to USD
  const formatAsUSD = useCallback(
    (amount, country) => {
      const usdAmount = convertToUSD(amount, country)
      return formatCurrency(usdAmount)
    },
    [convertToUSD, formatCurrency],
  )

  // Theme toggle function
  const toggleTheme = () => {
    setTheme((theme) => !theme)
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
    countryRates,
    updateCountryRate,
    getCountryRate,
    convertToUSD,
    formatCurrency,
    formatAmount,
    formatAsUSD,
    toggleTheme,
    // Sheet data
    sheetData,
    loadingSheetData,
    errorSheetData,
    refreshSheetData,
    updateConversionRate,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
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

// Custom hook to use sheet data
export function useSheetData() {
  const { sheetData, loadingSheetData, errorSheetData, refreshSheetData } = useApp()
  return { sheetData, loadingSheetData, errorSheetData, refreshSheetData }
}
