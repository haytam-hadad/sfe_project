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
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/images/i1.svg" />
      </head>
      <body className="bg-secondaryColor max-w-[100vw] min-h-screen w-full dark:bg-thirdColor">
        <ThemeProvider>
          <StatusConfigProvider>
            <div className="flex flex-col w-full min-h-screen">
              <AdminHeader onToggleMenu={() => setIsSideMenuOpen((prev) => !prev)} />

              <div className="flex flex-1">
                {/* Side Menu - Always visible on desktop */}
                <div className="hidden md:block md:w-[250px] md:min-w-[250px] md:shrink-0 md:h-[calc(100vh-64px)] z-40 md:top-16">
                  <AdminSideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />
                </div>

                {/* Mobile Side Menu */}
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

                {/* Main Content */}
                <main className="flex-1">
                  <div className="w-full mt-16  max-w-[100vw] md:mt-14">{children}</div>
                  <Toaster />
                </main>
              </div>
            </div>
          </StatusConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

