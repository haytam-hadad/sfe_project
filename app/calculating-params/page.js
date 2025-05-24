"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useStatusConfig, useSheetData, useApp } from "@/contexts/app-context"
import { DEFAULT_STATUS_CONFIG } from "@/lib/constants"
import {
  LoaderCircle,
  CheckCircle,
  AlertCircle,
  SaveIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  Globe,
  Search,
  BarChart3Icon,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, loading: authLoading, token } = useAuth()
  const { statusConfig, setStatusConfig, resetStatusConfig } = useStatusConfig()
  const { sheetData, loadingSheetData, errorSheetData, refreshSheetData } = useSheetData()
  const { countryRates, updateCountryRate } = useApp()

  const [localCountryRates, setLocalCountryRates] = useState({})
  const [saveRatesStatus, setSaveRatesStatus] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Status config state
  const [localConfig, setLocalConfig] = useState({ ...statusConfig })
  const [saveStatus, setSaveStatus] = useState(null)
  const [newStatus, setNewStatus] = useState("")

  // Update local config when statusConfig changes
  useEffect(() => {
    setLocalConfig({ ...statusConfig })
  }, [statusConfig])

  // Fetch data to get all possible statuses
  useEffect(() => {
    if (token && !sheetData.length) {
      refreshSheetData(token)
    }
  }, [token, sheetData.length, refreshSheetData])

  // Initialize local country rates from context
  useEffect(() => {
    setLocalCountryRates({ ...countryRates })
  }, [countryRates])

  // Get all unique statuses from orders
  const allStatuses = useMemo(() => {
    if (!sheetData.length) return []

    // Extract all unique statuses, ensuring we don't miss any
    const uniqueStatuses = [
      ...new Set(
        sheetData
          .map((order) => {
            // Ensure we're getting the exact status value, with proper case sensitivity
            return order["STATUS"] !== undefined ? String(order["STATUS"]).trim() : null
          })
          .filter(Boolean),
      ),
    ]

    return uniqueStatuses.sort()
  }, [sheetData])

  // Get all unique countries from orders
  const allCountries = useMemo(() => {
    if (!sheetData.length) return []

    // Extract all unique countries
    const uniqueCountries = [
      ...new Set(
        sheetData
          .map((order) => {
            return order["Receier Country"] !== undefined ? String(order["Receier Country"]).trim() : null
          })
          .filter(Boolean),
      ),
    ]

    return uniqueCountries.sort()
  }, [sheetData])

  // Always sync localCountryRates with countryRates when the page is loaded or when countryRates change
  useEffect(() => {
    setLocalCountryRates({ ...countryRates })
  }, [countryRates])

  // Remove the effect that tries to set missing countries to 1.0 in localCountryRates
  // Instead, ensure allCountries are present in countryRates with a default of 1.0
  useEffect(() => {
    if (allCountries.length > 0) {
      let updated = false
      const newRates = { ...countryRates }
      allCountries.forEach((country) => {
        if (newRates[country] === undefined) {
          newRates[country] = 1.0
          updated = true
        }
      })
      if (updated) {
        // Update context and local storage
        allCountries.forEach((country) => {
          if (countryRates[country] === undefined) {
            updateCountryRate(country, 1.0)
          }
        })
      }
    }
    // Only depend on allCountries and countryRates, not localCountryRates
  }, [allCountries, countryRates, updateCountryRate])

  // Add custom status
  const addCustomStatus = () => {
    if (!newStatus.trim()) return

    // Check if status already exists
    if (allStatuses.includes(newStatus.trim())) {
      toast({
        title: "Status already exists",
        description: `"${newStatus.trim()}" is already in the list.`,
        variant: "destructive",
      })
      return
    }

    // Add to allStatuses
    allStatuses.push(newStatus.trim())
    setNewStatus("")

    toast({
      title: "Status added",
      description: `"${newStatus.trim()}" has been added to the list.`,
    })
  }

  // Handle status checkbox changes
  const handleStatusChange = (category, status, checked) => {
    setLocalConfig((prev) => {
      const updatedCategory = checked ? [...prev[category], status] : prev[category].filter((s) => s !== status)

      return {
        ...prev,
        [category]: updatedCategory,
      }
    })
    setSaveStatus("unsaved")
  }

  // Save status configuration
  const saveConfig = () => {
    // Save the updated configuration
    setStatusConfig(localConfig)
    setSaveStatus("saved")
    toast({
      title: "Settings saved",
      description: "Your status configuration has been updated.",
    })

    // Also save the custom statuses if any were added
    if (typeof window !== "undefined") {
      localStorage.setItem("customStatuses", JSON.stringify(allStatuses))
    }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    // Use the resetStatusConfig function from context
    resetStatusConfig()
    // Update local state
    setLocalConfig({ ...DEFAULT_STATUS_CONFIG })
    setSaveStatus("saved")

    toast({
      title: "Settings reset",
      description: "Status configuration has been reset to defaults.",
    })
  }

  // Handle country-specific rate update
  const handleCountryRateUpdate = (country) => {
    const newRate = Number.parseFloat(localCountryRates[country])

    if (isNaN(newRate) || newRate < 0.000001) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid conversion rate greater than 0",
        variant: "destructive",
      })
      return
    }

    updateCountryRate(country, newRate)
    toast({
      title: "Rate updated",
      description: `Conversion rate for ${country} has been updated successfully.`,
    })
  }

  // Handle country rate input change
  const handleCountryRateChange = (country, value) => {
    setLocalCountryRates((prev) => ({
      ...prev,
      [country]: value,
    }))
    setSaveRatesStatus("unsaved")
  }

  // Save all country rates at once
  const saveAllCountryRates = () => {
    // Validate all rates
    const invalidCountries = []

    Object.entries(localCountryRates).forEach(([country, rate]) => {
      const parsedRate = Number.parseFloat(rate)
      if (isNaN(parsedRate) || parsedRate < 0.000001) {
        invalidCountries.push(country)
      } else {
        updateCountryRate(country, parsedRate)
      }
    })

    if (invalidCountries.length > 0) {
      toast({
        title: "Invalid rates",
        description: `Please enter valid rates for: ${invalidCountries.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setSaveRatesStatus("saved")
    toast({
      title: "Rates updated",
      description: "All country conversion rates have been updated successfully.",
    })
  }

  // Reset all country rates to default (1.0)
  const resetAllCountryRates = () => {
    const defaultRates = {}
    allCountries.forEach((country) => {
      defaultRates[country] = 1.0
    })

    setLocalCountryRates(defaultRates)

    // Update in context and localStorage
    allCountries.forEach((country) => {
      updateCountryRate(country, 1.0)
    })

    setSaveRatesStatus("saved")
    toast({
      title: "Rates reset",
      description: "All country conversion rates have been reset to 1.0.",
    })
  }

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return allCountries

    return allCountries.filter((country) => country.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [allCountries, searchQuery])

  if (authLoading || loadingSheetData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (errorSheetData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorSheetData}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Common Title */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3Icon className="h-7 w-7" />
          Calculating Parameters & Conversion Rates
        </h1>
      </div>
      <div className="mb-6" />

      <Tabs defaultValue="statuses" className="w-full">
        <TabsList className="mb-6 w-full flex">
          <TabsTrigger
            value="statuses"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-b-mainColor"
          >
            <BarChart3Icon className="h-5 w-5 mr-1" />
            Status Configuration
          </TabsTrigger>
          <TabsTrigger
            value="rates"
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-b-mainColor"
          >
            <Globe className="h-5 w-5 mr-1" />
            Country Conversion Rates
          </TabsTrigger>
        </TabsList>

        {/* Status Configuration Section */}
        <TabsContent value="statuses">
          {/* Subtitle outside the card */}
          <div className="mb-6">
            <p className="text-muted-foreground text-base">
              Configure how order statuses are calculated and categorized for metrics and statistics.
            </p>
          </div>
          <Card className="shadow-lg border border-mainColor/20">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5 text-mainColor" />
                    Status Configuration
                  </CardTitle>
                  <CardDescription>
                    Choose which statuses count as Confirmed, Delivered, Returned, or In Process.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetToDefaults}
                    disabled={loadingSheetData}
                    className="flex items-center"
                  >
                    <RefreshCwIcon className="mr-1 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={saveConfig}
                    disabled={saveStatus === "saved" || loadingSheetData}
                    className="flex items-center"
                  >
                    <SaveIcon className="mr-1 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {saveStatus === "unsaved" && (
                <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Unsaved changes</AlertTitle>
                  <AlertDescription>
                    You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
                  </AlertDescription>
                </Alert>
              )}

              {saveStatus === "saved" && (
                <Alert className="mb-6 bg-green-50 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Settings saved</AlertTitle>
                  <AlertDescription>Your status configuration has been updated successfully.</AlertDescription>
                </Alert>
              )}

              {loadingSheetData ? (
                <div className="flex items-center justify-center h-[200px]">
                  <RefreshCwIcon className="animate-spin h-10 w-10 text-primary" />
                </div>
              ) : allStatuses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No order statuses were found in the data. Please check your data source or try refreshing the page.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Confirmation Status Settings */}
                  <Card className="border-blue-200 dark:border-blue-900">
                    <CardHeader className="bg-blue-50 dark:bg-blue-950/30 border-b">
                      <CardTitle className="text-blue-700 dark:text-blue-400">Confirmation Statuses</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Select which order statuses should be counted as confirmed orders.
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {allStatuses.map((status) => (
                          <div key={`confirmation-${status}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`confirmation-${status}`}
                              checked={localConfig.confirmation.includes(status)}
                              onCheckedChange={(checked) => handleStatusChange("confirmation", status, checked)}
                            />
                            <Label
                              htmlFor={`confirmation-${status}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Status Settings */}
                  <Card className="border-green-200 dark:border-green-900">
                    <CardHeader className="bg-green-50 dark:bg-green-950/30 border-b">
                      <CardTitle className="text-green-700 dark:text-green-400">Delivery Statuses</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Select which order statuses should be counted as delivered orders.
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {allStatuses.map((status) => (
                          <div key={`delivery-${status}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`delivery-${status}`}
                              checked={localConfig.delivery.includes(status)}
                              onCheckedChange={(checked) => handleStatusChange("delivery", status, checked)}
                            />
                            <Label
                              htmlFor={`delivery-${status}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Returned Status Settings */}
                  <Card className="border-red-200 dark:border-red-900">
                    <CardHeader className="bg-red-50 dark:bg-red-950/30 border-b">
                      <CardTitle className="text-red-700 dark:text-red-400">Returned Statuses</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Select which order statuses should be counted as returned orders.
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {allStatuses.map((status) => (
                          <div key={`returned-${status}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`returned-${status}`}
                              checked={localConfig.returned.includes(status)}
                              onCheckedChange={(checked) => handleStatusChange("returned", status, checked)}
                            />
                            <Label
                              htmlFor={`returned-${status}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* In Process Status Settings */}
                  <Card className="border-purple-200 dark:border-purple-900">
                    <CardHeader className="bg-purple-50 dark:bg-purple-950/30 border-b">
                      <CardTitle className="text-purple-700 dark:text-purple-400">In Process Statuses</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Select which order statuses should be counted as in-process orders.
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {allStatuses.map((status) => (
                          <div key={`inProcess-${status}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`inProcess-${status}`}
                              checked={localConfig.inProcess.includes(status)}
                              onCheckedChange={(checked) => handleStatusChange("inProcess", status, checked)}
                            />
                            <Label
                              htmlFor={`inProcess-${status}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={saveConfig}
                  disabled={saveStatus === "saved" || loadingSheetData}
                  className="w-full sm:w-auto"
                >
                  <SaveIcon className="mr-1 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Country-specific Currency Conversion Section */}
        <TabsContent value="rates">
          {/* Subtitle outside the card */}
          <div className="mb-6">
            <p className="text-muted-foreground text-base">
              Set different conversion rates for each country in your data.
            </p>
          </div>
          <Card className="shadow-lg border border-mainColor/20">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-mainColor" />
                    Country-Specific Conversion Rates
                  </CardTitle>
                  <CardDescription>
                    Adjust the conversion rate for each country to reflect your business needs.
                  </CardDescription>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button variant="outline" onClick={resetAllCountryRates}>
                    <RefreshCwIcon className="mr-1 h-4 w-4" />
                    Reset All to 1.0
                  </Button>
                  <Button onClick={saveAllCountryRates} disabled={saveRatesStatus === "saved"}>
                    <SaveIcon className="mr-1 h-4 w-4" />
                    Save All Rates
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {saveRatesStatus === "unsaved" && (
                <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Unsaved changes</AlertTitle>
                  <AlertDescription>
                    You have unsaved changes to country rates. Click &quot;Save All Rates&quot; to apply them.
                  </AlertDescription>
                </Alert>
              )}

              {saveRatesStatus === "saved" && (
                <Alert className="mb-6 bg-green-50 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Rates saved</AlertTitle>
                  <AlertDescription>
                    Your country-specific conversion rates have been updated successfully.
                  </AlertDescription>
                </Alert>
              )}

              {allCountries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No countries found in your data.</p>
                </div>
              ) : (
                <>
                  {/* Search input */}
                  <div className="relative mb-6 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="border rounded-md overflow-x-auto">
                    <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50">
                      <div className="col-span-6">Country</div>
                      <div className="col-span-4">Conversion Rate</div>
                      <div className="col-span-2">Action</div>
                    </div>
                    <div className="divide-y max-h-[60vh] overflow-y-auto">
                      {filteredCountries.map((country) => (
                        <div key={country} className="grid grid-cols-12 gap-4 p-4 items-center">
                          <div className="col-span-6">{country}</div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              step="0.000001"
                              min="0.000001"
                              value={
                                localCountryRates[country] !== undefined
                                  ? localCountryRates[country]
                                  : countryRates[country] !== undefined
                                  ? countryRates[country]
                                  : ""
                              }
                              onChange={(e) => handleCountryRateChange(country, e.target.value)}
                              placeholder="Enter rate"
                            />
                          </div>
                          <div className="col-span-2">
                            <Button
                              size="sm"
                              onClick={() => handleCountryRateUpdate(country)}
                              disabled={
                                !localCountryRates[country] || isNaN(Number.parseFloat(localCountryRates[country]))
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
