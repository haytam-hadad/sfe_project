"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useStatusConfig } from "@/contexts/app-context"
import { defaultStatusConfig } from "@/lib/status-config"
import { fetchMySheetData, updateConversionRate, getConversionRate } from "@/lib/api-client"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  SaveIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  Settings2,
  DollarSign,
} from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const { statusConfig, setStatusConfig } = useStatusConfig()
  const [conversionRate, setConversionRate] = useState(getConversionRate())

  // Status config state
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [localConfig, setLocalConfig] = useState({ ...statusConfig })
  const [saveStatus, setSaveStatus] = useState(null)
  const [newStatus, setNewStatus] = useState("")

  // Fetch data to get all possible statuses
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await fetchMySheetData()

        // Process the data to ensure we capture all statuses
        const processedOrders = result.map((order) => {
          // Ensure STATUS is a string and properly formatted
          if (order["STATUS"] !== undefined) {
            order["STATUS"] = String(order["STATUS"]).trim()
          }
          return order
        })

        setOrders(processedOrders)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get all unique statuses from orders
  const allStatuses = useMemo(() => {
    if (!orders.length) return []

    // Extract all unique statuses, ensuring we don't miss any
    const uniqueStatuses = [
      ...new Set(
        orders
          .map((order) => {
            // Ensure we're getting the exact status value, with proper case sensitivity
            return order["STATUS"] !== undefined ? String(order["STATUS"]).trim() : null
          })
          .filter(Boolean),
      ),
    ]

    return uniqueStatuses.sort()
  }, [orders])

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
    setLocalConfig({ ...defaultStatusConfig })
    setSaveStatus("unsaved")
  }

  // Load custom statuses from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("statusConfig")
      if (savedConfig) {
        try {
          setLocalConfig(JSON.parse(savedConfig))
        } catch (error) {
          console.error("Failed to parse saved status config:", error)
        }
      }

      // Load custom statuses if any were saved
      const savedCustomStatuses = localStorage.getItem("customStatuses")
      if (savedCustomStatuses) {
        try {
          const parsedStatuses = JSON.parse(savedCustomStatuses)
          // We'll use this when fetching orders to ensure we include custom statuses
        } catch (error) {
          console.error("Failed to parse saved custom statuses:", error)
        }
      }
    }
  }, [])

  // Handle conversion rate update
  const handleRateUpdate = (e) => {
    e.preventDefault()
    const newRate = parseFloat(conversionRate)
    
    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid conversion rate",
        variant: "destructive",
      })
      return
    }

    updateConversionRate(newRate)
    toast({
      title: "Rate updated",
      description: "Currency conversion rate has been updated successfully.",
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="w-full">
        {/* Status Configuration Section */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">Status Configuration</h2>
              <p className="text-muted-foreground">Configure how order statuses are categorized and calculated</p>
            </div>
            <div className="flex gap-2 md:gap-4">
              <Button className="flex-1 md:flex-none" variant="outline" onClick={resetToDefaults} disabled={loading}>
                <RefreshCwIcon className="mr-1 h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button className="flex-1 md:flex-none" onClick={saveConfig} disabled={saveStatus === "saved" || loading}>
                <SaveIcon className="mr-1 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

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

          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Loading status options...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[200px]">
                  <RefreshCwIcon className="animate-spin h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Confirmation Status Settings */}
                <Card>
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
                <Card>
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
                <Card>
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
                <Card>
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

              {/* Add Custom Status */}
              <Card className="col-span-1 md:col-span-2 mt-5">
                <CardHeader className="bg-gray-50 dark:bg-gray-900/30 border-b">
                  <CardTitle className="text-gray-700 dark:text-gray-400">Add Custom Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Add any missing status that doesn&quot;t appear in the lists above.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      placeholder="Enter new status name"
                      className="flex-1"
                    />
                    <Button onClick={addCustomStatus} disabled={!newStatus.trim()}>
                      Add Status
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 flex justify-end">
                <Button onClick={saveConfig} disabled={saveStatus === "saved" || loading} className="w-full sm:w-auto">
                  <SaveIcon className="mr-1 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Currency Conversion Section */}
        <div className="mt-1">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">Currency Conversion</h2>
              <p className="text-muted-foreground">Configure the KES to USD conversion rate</p>
            </div>
          </div>

          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-950/30 border-b">
              <CardTitle className="text-green-700 dark:text-green-400">Conversion Rate Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRateUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="conversionRate" className="text-sm font-medium">
                    KES to USD Conversion Rate
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="conversionRate"
                      type="number"
                      step="0.0001"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(e.target.value)}
                      placeholder="Enter conversion rate (e.g., 0.007)"
                      className="max-w-xs"
                    />
                    <Button type="submit" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Update Rate
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current rate: 1 KES = {conversionRate} USD
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

