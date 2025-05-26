"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Key, FileSpreadsheet, Eye, EyeOff, AlertCircle, CheckCircle2, LoaderCircle, Camera } from "lucide-react"

export default function ProfilePage() {
  const { user, updateProfile, changePassword, updateSheetUrl } = useAuth()
  const { toast } = useToast()

  // Profile update states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password change states
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Sheet URL update states
  const [sheetUrl, setSheetUrl] = useState(user?.sheetUrl || "")
  const [isEditingSheet, setIsEditingSheet] = useState(false)
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false)
  const [sheetUrlError, setSheetUrlError] = useState("")

  // Initialize form values when user data is available
  useEffect(() => {
    if (user) {
      setSheetUrl(user.sheetUrl || "")
    }
  }, [user])

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.username) return "U"
    return user.username[0].toUpperCase()
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
      case "sub-admin":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  // Validate sheet URL format
  const isValidSheetUrl = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === "docs.google.com" && urlObj.pathname.includes("/spreadsheets/d/")
    } catch {
      return false
    }
  }

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number"
    }
    return ""
  }

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Current password is required",
        variant: "destructive",
      })
      return
    }

    // Check if any fields have changed
    if (!newEmail && !newUsername) {
      toast({
        title: "No changes",
        description: "No changes were made to your profile",
      })
      return
    }

    setIsUpdatingProfile(true)
    try {
      const result = await updateProfile(currentPassword, newEmail || undefined, newUsername || undefined)

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        setCurrentPassword("")
        setNewEmail("")
        setNewUsername("")
        setIsEditingProfile(false)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError("")

    if (!passwordCurrentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setPasswordError(validationError)
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changePassword(passwordCurrentPassword, newPassword)
      if (result.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        })
        setPasswordCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setShowNewPassword(false)
        setShowConfirmPassword(false)
        setShowCurrentPassword(false)
      } else {
        setPasswordError(result.error)
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle sheet URL update
  const handleSheetUrlUpdate = async (e) => {
    e.preventDefault()
    setSheetUrlError("")

    if (!sheetUrl) {
      setSheetUrlError("Sheet URL is required")
      return
    }

    if (!isValidSheetUrl(sheetUrl)) {
      setSheetUrlError("Please enter a valid Google Sheets URL")
      return
    }

    setIsUpdatingSheet(true)
    try {
      const result = await updateSheetUrl(sheetUrl)
      if (result.success) {
        toast({
          title: "Success",
          description: "Sheet URL updated successfully",
        })
        setIsEditingSheet(false)
      } else {
        setSheetUrlError(result.error)
      }
    } finally {
      setIsUpdatingSheet(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Profile Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 text-xl font-semibold w-12 border">
            <AvatarImage src="/placeholder.svg?height=48&width=48" alt={user?.username || "User"} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.username || "User"}</p>
            <Badge variant="outline" className={getRoleBadgeColor(user?.role)}>
              {user?.role || "User"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-b-mainColor"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-b-mainColor"
          >
            <Key className="h-4 w-4" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger
            value="sheet"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-b-mainColor"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Sheet URL</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details and personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-1">
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user?.email || "No email set"}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-sm text-muted-foreground">Username</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user?.username || "No username set"}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setIsEditingProfile(true)} className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">
                      Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showCurrentPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Required to verify your identity</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email</Label>
                      <div className="relative">
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder={user?.email}
                          className="pl-9"
                        />
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-username">New Username</Label>
                      <div className="relative">
                        <Input
                          id="new-username"
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder={user?.username}
                          className="pl-9"
                        />
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditingProfile(false)
                        setCurrentPassword("")
                        setNewEmail("")
                        setNewUsername("")
                        setShowCurrentPassword(false)
                      }}
                      disabled={isUpdatingProfile}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current-password-pw">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password-pw"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordCurrentPassword}
                      onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showCurrentPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showNewPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters and include uppercase, lowercase, and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto mt-2" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sheet">
          <Card>
            <CardHeader>
              <CardTitle>Sheet URL Settings</CardTitle>
              <CardDescription>Configure the Google Sheet URL for your data source</CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditingSheet ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Current Sheet URL</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium break-all">{user?.sheetUrl || "No sheet URL set"}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Sheet Requirements
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc pl-5">
                      <li>Must be a Google Sheet with public access or shared with appropriate permissions</li>
                      <li>
                        Should contain columns: Order date, Order ID, Cod Amount, Quantity, sku number, City, STATUS, Country
                      </li>
                      <li>First row should be column headers</li>
                    </ul>
                  </div>

                  <Button onClick={() => setIsEditingSheet(true)} variant="outline" className="w-full sm:w-auto">
                    Update Sheet URL
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSheetUrlUpdate} className="space-y-4">
                  {sheetUrlError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="ml-2">{sheetUrlError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="sheet-url">
                      Google Sheet URL <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="sheet-url"
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        required
                        className="pl-9"
                      />
                      <FileSpreadsheet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter a valid Google Sheets URL that contains your data
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditingSheet(false)
                        setSheetUrl(user?.sheetUrl || "")
                        setSheetUrlError("")
                      }}
                      disabled={isUpdatingSheet}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isUpdatingSheet}>
                      {isUpdatingSheet ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Sheet URL"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
