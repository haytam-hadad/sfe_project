"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect if the current viewport is a mobile device
 * @param {number} breakpoint - The breakpoint in pixels to consider as mobile (default: 768)
 * @returns {boolean} - True if the viewport width is less than the breakpoint
 */
export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window === "undefined") {
      return
    }

    // Function to update state based on window width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [breakpoint])

  return isMobile
}
