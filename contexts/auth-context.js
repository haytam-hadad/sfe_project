"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

// Create Auth Context
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  adminSignup: async () => {},
  updateSheetUrl: async () => {},
  changePassword: async () => {},
  updateUserRole: async () => {},
})

// API URL - replace with your actual backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
          setToken(storedToken)
          // Fetch user profile with the token
          const userData = await fetchUserProfile(storedToken)
          setUser(userData)
        }
      } catch (error) {
        console.error("Authentication initialization error:", error)
        // Clear invalid auth data
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Redirect to login if not authenticated and not on login page
  useEffect(() => {
    if (!isLoading && !token && pathname !== "/login" && pathname !== "/signup") {
      router.push("/login")
    }
  }, [isLoading, token, pathname, router])

  // Fetch user profile
  const fetchUserProfile = async (authToken) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user profile")
    }

    const data = await response.json()
    return data.user
    if (!data.user.sheetUrl) {
      router.push("/settings-sheet")
    }
  }

  // Login function
  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed")
      }

      const data = await response.json()

      // Save token to localStorage
      localStorage.setItem("token", data.token)

      // Update state
      setToken(data.token)
      setUser(data.user)

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    // Clear auth data
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)

    // Redirect to login
    router.push("/login")
  }

  // Admin Signup function (admin only)
  const adminSignup = async (userData) => {
    if (!token) {
      return { success: false, error: "Authentication required" }
    }

    try {
      const response = await fetch(`${API_URL}/auth/admin/signup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Signup failed")
      }

      const data = await response.json()
      return { success: true, user: data.user }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: error.message }
    }
  }

  // Update sheet URL
  const updateSheetUrl = async (sheetUrl) => {
    if (!token) {
      return { success: false, error: "Authentication required" }
    }

    try {
      const response = await fetch(`${API_URL}/auth/update-sheet`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update sheet URL")
      }

      const data = await response.json()
      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error("Update sheet URL error:", error)
      return { success: false, error: error.message }
    }
  }

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    if (!token) {
      return { success: false, error: "Authentication required" }
    }

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to change password")
      }

      return { success: true }
    } catch (error) {
      console.error("Change password error:", error)
      return { success: false, error: error.message }
    }
  }

  // Update user role (admin only)
  const updateUserRole = async (userId, role) => {
    if (!token || user?.role !== "admin") {
      return { success: false, error: "Admin privileges required" }
    }

    try {
      const response = await fetch(`${API_URL}/auth/update-role/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update user role")
      }

      const data = await response.json()
      return { success: true, user: data.user }
    } catch (error) {
      console.error("Update user role error:", error)
      return { success: false, error: error.message }
    }
  }

  // Auth context value
  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    adminSignup,
    updateSheetUrl,
    changePassword,
    updateUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
