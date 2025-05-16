"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, SaveIcon } from "lucide-react"

export default function SheetSettingsPage() {
  const { user, updateSheetUrl } = useAuth()
  const [sheetUrl, setSheetUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with user's current sheet URL
  useEffect(() => {
    if (user?.sheetUrl) {
      setSheetUrl(user.sheetUrl)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      // Validate form
      if (!sheetUrl) {
        throw new Error("Google Sheet URL is required")
      }

      // Validate URL format
      try {
        new URL(sheetUrl)
      } catch (e) {
        throw new Error("Please enter a valid URL")
      }

      // Update sheet URL
      const result = await updateSheetUrl(sheetUrl)

      if (result.success) {
        setSuccess("Sheet URL updated successfully!")
      } else {
        setError(result.error || "Failed to update sheet URL")
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Sheet Settings</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google Sheet Configuration</CardTitle>
          <CardDescription>Configure the Google Sheet that will be used to fetch your data</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheetUrl">Google Sheet URL</Label>
              <Input
                id="sheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <p className="text-sm text-muted-foreground">
                The full URL to your Google Sheet that contains the data for your dashboard
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
