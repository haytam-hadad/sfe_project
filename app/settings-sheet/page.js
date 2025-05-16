"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAuth } from "@/contexts/auth-context"
import { validateSheetUrl, updateSheetUrl } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function SheetSettings() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sheetUrl, setSheetUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (user.sheetUrl && initialLoad) {
        setSheetUrl(user.sheetUrl)
        setInitialLoad(false)
      }
    }
  }, [user, authLoading, router, initialLoad])

  const handleValidate = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Please enter a Google Sheet URL")
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const result = await validateSheetUrl(sheetUrl)

      if (result.error) {
        setValidationResult({ valid: false, message: result.error })
        toast.error(result.error)
      } else {
        setValidationResult(result)
        if (result.valid) {
          toast.success("Sheet URL is valid!")
        } else {
          toast.error(result.message || "Invalid sheet URL")
        }
      }
    } catch (error) {
      console.error("Validation error:", error)
      setValidationResult({ valid: false, message: error.message || "Error validating sheet URL" })
      toast.error(error.message || "Error validating sheet URL")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!sheetUrl.trim()) {
      toast.error("Please enter a Google Sheet URL")
      return
    }

    setIsSubmitting(true)

    try {
      // Validate first if not already validated
      if (!validationResult || validationResult.sheetUrl !== sheetUrl) {
        const validationResult = await validateSheetUrl(sheetUrl)
        if (validationResult.error || !validationResult.valid) {
          toast.error(validationResult.error || validationResult.message || "Invalid sheet URL")
          setIsSubmitting(false)
          return
        }
      }

      // Update the sheet URL
      const result = await updateSheetUrl(sheetUrl)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Sheet URL updated successfully!")
        // Force refresh user data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error.message || "Error updating sheet URL")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Sheet Settings</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google Sheet Configuration</CardTitle>
          <CardDescription>
            Enter the URL of your Google Sheet. Make sure the sheet is publicly accessible or shared with the
            appropriate permissions.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
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
    </div>
  )
}
