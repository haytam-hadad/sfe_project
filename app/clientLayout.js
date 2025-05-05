"use client"

import { ThemeProvider } from "../components/theme-provider"
import "./globals.css"
import { useState } from "react"
import AdminHeader from "@/components/admin-header"
import AdminSideMenu from "@/components/admin-side-menu"
import { AnimatePresence } from "framer-motion"
import { Toaster } from "@/components/ui/toaster"
import { StatusConfigProvider } from "@/contexts/status-config-context"

export default function ClientLayout({ children }) {
  const [sideMenuVisible, setSideMenuVisible] = useState(false)

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/i1.svg" />
      </head>
      <body className="bg-secondaryColor dark:bg-thirdColor">
        <ThemeProvider>
          <StatusConfigProvider>
            <div className="flex flex-col min-h-screen">
              <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-thirdColor">
                <AdminHeader onToggleMenu={() => setSideMenuVisible(!sideMenuVisible)} />

                <div className="flex flex-1">
                  {/* Side Menu - Always visible on desktop */}
                  <div className="hidden md:block md:w-[250px] md:min-w-[250px] md:shrink-0 md:h-[calc(100vh-64px)] md:sticky md:top-16">
                    <AdminSideMenu setVisible={setSideMenuVisible} />
                  </div>

                  {/* Mobile Side Menu */}
                  <AnimatePresence>
                    {sideMenuVisible && (
                      <div className="md:hidden fixed inset-0 z-50">
                        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSideMenuVisible(false)}></div>
                        <div className="relative z-50 h-full w-[260px]">
                          <AdminSideMenu setVisible={setSideMenuVisible} />
                        </div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Main Content */}
                  <main className="flex-1">
                    <div className="max-w-full">{children}</div>
                    <Toaster />
                  </main>
                </div>
              </div>
            </div>
          </StatusConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
