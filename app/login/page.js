"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, LoaderCircle, AlertCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  // Load rememberMe and email from localStorage on mount
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true"
    setRememberMe(remembered)
    if (remembered) {
      const savedEmail = localStorage.getItem("rememberedEmail") || ""
      setEmail(savedEmail)
    }
  }, [])

  // Save rememberMe and email to localStorage when changed
  useEffect(() => {
    localStorage.setItem("rememberMe", rememberMe)
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email)
    } else {
      localStorage.removeItem("rememberedEmail")
    }
  }, [rememberMe, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      // Attempt login
      const result = await login(email, password, rememberMe)

      if (result.success) {
        router.push("/")
      } else {
        setError(result.error || "Invalid email or password. Please try again.")
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-mainColor/10 via-white to-blue-50 dark:from-zinc-900 dark:to-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-xl border border-mainColor/20">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.svg"
                alt="Ecomark Logo"
                width={56}
                height={56}
                className="transition-transform hover:scale-105 drop-shadow-md"
                priority
              />
            </Link>
          </div>
          <CardTitle className="text-center text-3xl font-bold flex items-center justify-center gap-2">
            <Lock className="h-6 w-6 text-mainColor" />
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base text-muted-foreground">
            Sign in to access your{" "}
            <span className="font-semibold text-mainColor">Ecomark Dashboard</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link href="/forgot-password" className="hidden text-xs text-mainColor hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-muted-foreground"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
                disabled={isLoading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full bg-mainColor hover:bg-mainColor/90 text-white font-semibold text-base h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
