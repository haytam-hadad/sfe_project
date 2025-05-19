"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { validateSheetUrl, updateSheetUrl, fetchMySheetData } from "@/lib/api-client"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  SaveIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  FileSpreadsheet,
  Settings2,
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const { statusConfig, setStatusConfig } = useStatusConfig()

  // Sheet URL state
  const [sheetUrl, setSheetUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  // Status config state
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [localConfig, setLocalConfig] = useState({ ...statusConfig })
  const [saveStatus, setSaveStatus] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [activeTab, setActiveTab] = useState("sheet")

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

  // Sheet URL validation
  const handleValidate = async () => {
    if (!sheetUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Google Sheet URL",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const result = await validateSheetUrl(sheetUrl)

      if (result.error) {
        setValidationResult({ valid: false, message: result.error })
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        setValidationResult(result)
        if (result.valid) {
          toast({
            title: "Success",
            description: "Sheet URL is valid!",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Invalid sheet URL",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Validation error:", error)
      setValidationResult({ valid: false, message: error.message || "Error validating sheet URL" })
      toast({
        title: "Error",
        description: error.message || "Error validating sheet URL",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  // Sheet URL submission
  const handleSheetSubmit = async (e) => {
    e.preventDefault()

    if (!sheetUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Google Sheet URL",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Validate first if not already validated
      if (!validationResult || validationResult.sheetUrl !== sheetUrl) {
        const validationResult = await validateSheetUrl(sheetUrl)
        if (validationResult.error || !validationResult.valid) {
          toast({
            title: "Error",
            description: validationResult.error || validationResult.message || "Invalid sheet URL",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Update the sheet URL
      const result = await updateSheetUrl(sheetUrl)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Sheet URL updated successfully!",
        })
        // Force refresh user data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: error.message || "Error updating sheet URL",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sheet Settings</h1>
          <p className="text-muted-foreground">Configure your Sheet&apos;s settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sheet" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Google Sheet</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span>Status Configuration</span>
          </TabsTrigger>
        </TabsList>

        {/* Google Sheet Configuration Tab */}
        <TabsContent value="sheet">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheet Configuration</CardTitle>
              <CardDescription>
                Enter the URL of your Google Sheet. Ensure the sheet is a table with these columns: Order date, Order
                ID, Cod Amount, Quantity, sku number, City, Phone, STATUS, Receiver Country*. Make sure the sheet is
                publicly accessible or shared with the appropriate permissions.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSheetSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheetUrl">Google Sheet URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sheetUrl"
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidate}
                      disabled={isValidating || !sheetUrl.trim()}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validating
                        </>
                      ) : (
                        "Validate"
                      )}
                    </Button>
                  </div>

                  {validationResult && (
                    <div
                      className={`flex items-center mt-2 text-sm ${validationResult.valid ? "text-green-600" : "text-red-600"}`}
                    >
                      {validationResult.valid ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Valid sheet URL</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>{validationResult.message || "Invalid sheet URL"}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Create or open a Google Sheet</li>
                    <li>Make sure the sheet is publicly accessible (File &gt; Share &gt; Anyone with the link)</li>
                    <li>
                      Ensure the sheet is a table with these columns: Order date, Order ID, Cod Amount, Quantity, sku
                      number, City, Phone, STATUS, Receiver Country*
                    </li>
                    <li>Copy the URL from your browser&apos;s address bar</li>
                    <li>Paste the URL in the field above</li>
                    <li>Click Validate to check if the sheet is accessible</li>
                    <li>Click Save to update your sheet configuration</li>
                  </ol>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Status Configuration Tab */}
        <TabsContent value="status">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
