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
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const pathname = usePathname()

  // Don't render header and sidebar on login and signup pages
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  return (
    <AuthProvider>
      <AppProvider>
        <div className="flex flex-col w-full min-h-screen">
          {!isAuthPage && <AdminHeader onToggleMenu={() => setIsSideMenuOpen((prev) => !prev)} />}

          <div className="flex flex-1">
            {/* Side Menu - Always visible on desktop */}
            {!isAuthPage && (
              <div className="hidden md:block md:w-[250px] md:min-w-[250px] md:shrink-0 md:h-[calc(100vh-64px)] z-40 md:top-16">
                <AdminSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
              </div>
            )}

            {/* Mobile Side Menu */}
            {!isAuthPage && (
              <AnimatePresence>
                {isSideMenuOpen && (
                  <div className="fixed inset-0 z-50">
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsSideMenuOpen(false)}></div>
                    <div className="relative z-50 h-full w-[260px]">
                      <AdminSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
                    </div>
                  </div>
                )}
              </AnimatePresence>
            )}

            {/* Main Content */}
            <main className="flex-1">
              <div className="w-full p-1 mt-16 max-w-[100vw] md:mt-14">{children}</div>
              <Toaster />
            </main>
          </div>
        </div>
      </AppProvider>
    </AuthProvider>
  )
}

