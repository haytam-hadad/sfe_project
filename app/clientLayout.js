"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import AdminHeader from "@/components/admin-header"
import AdminSideMenu from "@/components/admin-side-menu"
import { AppProvider } from "@/contexts/app-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresence } from "framer-motion"

export default function ClientLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Close menu when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && window.innerWidth < 768) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isMenuOpen])

  // Prevent scrolling when menu is open on mobile
  useEffect(() => {
    if (isMenuOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isMenuOpen])

  // Don't render header and sidebar on login and signup pages
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppProvider>
            {!isAuthPage && <AdminHeader onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />}

            <div className="flex min-h-screen">
              {!isAuthPage && (
                <AnimatePresence>
                  {(isMenuOpen || window.innerWidth >= 768) && (
                    <AdminSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                  )}
                </AnimatePresence>
              )}

              <main
                className={`flex-1 ${!isAuthPage ? "pt-16 md:pl-[250px]" : ""} transition-all duration-300 ease-in-out`}
              >
                {children}
              </main>
            </div>

            <Toaster />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

