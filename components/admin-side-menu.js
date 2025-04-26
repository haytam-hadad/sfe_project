"use client"

import { useEffect } from "react"
import {
  BarChartIcon as ChartBar,
  Database,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"


const AdminSideMenu = ({ setVisible }) => {
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
      <div className="flex flex-col p-4 space-y-3">

        {/* Dashboard Link */}
        <Link href="/" className="block">
          <button
            onClick={() => setVisible(false)}
            className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${
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
            className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${
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

