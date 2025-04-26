"use client"
import Link from "next/link"
import {
  Menu,
  Moon,
  Sun,
  ShieldAlert,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useContext, useEffect, useRef } from "react"
import { ThemeContext } from "../app/ThemeProvider"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

export default function AdminHeader({ onToggleMenu }) {
  const { theme, setTheme } = useContext(ThemeContext)

  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = !theme
    setTheme(newTheme)
  }


  const handleToggleMenu = () => {
    onToggleMenu()
  }

  return (
    <header className="sticky p-1 border-b   bg-white dark:bg-zinc-900 top-0 z-50 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 gap-3">
          {/* Logo Group */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <ShieldAlert className=" scale-150 text-red-500 w-5 h-5" />
            </div>
            <div>
              <span className="text-3xl px-1 font-bold text-gray-800 dark:text-gray-100 transition-colors duration-200 group-hover:text-mainColor dark:group-hover:text-mainColor">
                Ecomark 
              </span>
              <span className="text-xs font-semibold text-red-500 ml-1">Dashboard</span>
            </div>
          </Link>

          {/* Control Group */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-2 rounded-full">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dark-mode"
                  checked={theme}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-mainColor"
                />
                <Label htmlFor="dark-mode" className="cursor-pointer text-gray-700 dark:text-gray-300">
                  {theme ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                </Label>
              </div>
            </div>

            {/* Sidebar Toggle Button (Mobile) */}
            <button
              onClick={handleToggleMenu}
              className="md:hidden flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

