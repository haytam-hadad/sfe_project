"use client"

import { useState, useContext, useEffect } from "react"
import { ThemeContext } from "../app/ThemeProvider"
import {
  BarChartIcon as ChartBar,
  Database,
  Sun,
  Moon,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

const menuItems = [
  {
    name: "Sheets",
    path: "/sheets",
    icon: <Globe size={20} />,
  },
  {
    name: "Orders",
    path: "/orders",
    icon: <Database size={20} />,
  },
]

const AdminSideMenu = ({ setVisible }) => {
  const [expandedSections, setExpandedSections] = useState(["modules", "system"])
  const { theme, setTheme } = useContext(ThemeContext)
  const activePath = usePathname()
  const router = useRouter()

  // Close the mobile menu when navigating to a new page
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof setVisible === "function") {
        setVisible(false)
      }
    }

    // Listen for pathname changes
    return () => {
      handleRouteChange()
    }
  }, [activePath, setVisible])

  return (
    <motion.div
      className="bg-white z-20 dark:bg-zinc-900 border-r border-gray-100 dark:border-gray-800 w-[260px] h-full fixed top-0 pt-16 overflow-y-auto left-0"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ bottom: 0 }}
    >
      <div className="flex flex-col p-4 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(!theme)}
          className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/70 border border-gray-100 dark:border-gray-800 sm:hidden group"
          aria-label="Toggle Dark Mode"
        >
          <div className="flex items-center gap-3 font-medium">
            <Label className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              Theme
            </Label>
            {theme ? (
              <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
            )}
          </div>
        </button>

        {/* Dashboard Link */}
        <Link href="/" className="block">
          <button
            onClick={() => setVisible(false)}
            className={`flex items-center w-full p-3.5 rounded-xl transition-all duration-300 ${
              activePath === "/"
                ? "bg-red-600 text-white font-medium shadow-sm"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
            }`}
            aria-label="Dashboard"
          >
            <ChartBar size={20} className={`mr-3 ${activePath === "/" ? "" : "text-red-500"}`} />
            <span className="text-base font-medium">Overview</span>
          </button>
        </Link>

        {/* Orders Link */}
        <Link href="/orders" className="block">
          <button
            onClick={() => setVisible(false)}
            className={`flex items-center w-full p-3.5 rounded-xl transition-all duration-300 ${
              activePath === "/orders"
                ? "bg-red-600 text-white font-medium shadow-sm"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
            }`}
            aria-label="Orders"
          >
            <Database size={20} className={`mr-3 ${activePath === "/orders" ? "" : "text-red-500"}`} />
            <span className="text-base font-medium">Orders</span>
          </button>
        </Link>

      </div>
    </motion.div>
  )
}

export default AdminSideMenu

