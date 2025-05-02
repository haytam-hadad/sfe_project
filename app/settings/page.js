"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useStatusConfig } from "@/contexts/status-config-context"
import { defaultStatusConfig } from "@/lib/status-config"
import { SaveIcon, RefreshCwIcon, AlertTriangleIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const { toast } = useToast()
  const { statusConfig, setStatusConfig } = useStatusConfig()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [localConfig, setLocalConfig] = useState({ ...statusConfig })
  const [saveStatus, setSaveStatus] = useState(null)

  // Fetch data to get all possible statuses
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/sheet")
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`)
        }
        const result = await response.json()
        setOrders(result)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get all unique statuses from orders
  const allStatuses = useMemo(() => {
    if (!orders.length) return []
    const uniqueStatuses = [...new Set(orders.map((order) => order["STATUS"]).filter(Boolean))]
    return uniqueStatuses.sort()
  }, [orders])

  // Handle checkbox changes
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

  // Save configuration
  const saveConfig = () => {
    setStatusConfig(localConfig)
    setSaveStatus("saved")
    toast({
      title: "Settings saved",
      description: "Your status configuration has been updated.",
      duration: 3000,
    })
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setLocalConfig({ ...defaultStatusConfig })
    setSaveStatus("unsaved")
  }

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
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
      </div>
    )
  }

  return (
    <div className="container mx-auto p-2 md:p-6 py-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 md:gap-6">
        <div className="sm:flex-1">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure how order statuses are categorized and calculated</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={loading}
            className="sm:order-2 w-full sm:w-auto"
          >
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={saveConfig}
            disabled={saveStatus === "saved" || loading}
            className="sm:order-1 w-full sm:w-auto"
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {saveStatus === "unsaved" && (
        <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Unsaved changes</AlertTitle>
          <AlertDescription>You have unsaved changes. Click "Save Changes" to apply them.</AlertDescription>
        </Alert>
      )}

      {saveStatus === "saved" && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Settings saved</AlertTitle>
          <AlertDescription>Your status configuration has been updated successfully.</AlertDescription>
        </Alert>
      )}

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

      <div className="mt-6 flex justify-end">
        <Button onClick={saveConfig} disabled={saveStatus === "saved" || loading} className="w-full sm:w-auto">
          <SaveIcon className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
