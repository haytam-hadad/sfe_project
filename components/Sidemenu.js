"use client"

import {
  Home,
  Database,
  BarChartIcon as ChartBar,
  ChevronDown,
  Calculator,
  ChevronUp,
  MapPin,
  Package,
  Settings,
  PenIcon as UserPen,
  BarChart3,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

const links = [
  {
    text: "Overview",
    href: "/",
    icon: Home,
  },
  {
    text: "Orders",
    href: "/orders",
    icon: Database,
  },
]

const statisticsLinks = [
  {
    text: "Cities",
    href: "/city-stats",
    icon: MapPin,
  },
  {
    text: "Products",
    href: "/product-stats",
    icon: Package,
  },
  {
    text: "Advertisement Stats",
    href: "/ad-stats",
    icon: BarChart3,
  },
]

const settingsLinks = [
  {
    text: "Profile Settings",
    href: "/profile",
    icon: UserPen,
  },
  {
    text: "Calculating Params",
    href: "/calculating-params",
    icon: Calculator,
  },
]

// Admin-only links
const adminLinks = [
  {
    text: "Admin Dashboard",
    href: "/admin",
    icon: Shield,
  },
]

const AdminSideMenu = ({ onClose }) => {
  const activePath = usePathname()
  const [statisticsOpen, setStatisticsOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user } = useAuth()

  const isAdmin = user?.role === "admin"

  const handleLinkClick = () => {
    onClose()
  }

  return (
    <motion.div
      className="bg-zinc-950 border-r h-full fixed top-0 md:pt-16 overflow-y-auto left-0 w-[250px] dark:bg-white dark:border-zinc-800"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{ bottom: 0 }}
    >
      <div className="flex flex-col p-3 space-y-2">
        {/* Admin Section - Only visible to admin users - Moved to top */}
        {isAdmin && (
          <motion.div
            className="mt-1 space-y-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {adminLinks.map((subLink) => (
              <Link key={subLink.href} href={subLink.href} onClick={handleLinkClick}>
                <button
                  className={`flex border-2 items-center mt-1 w-full p-3 rounded-full transition-all duration-300 ${
                    activePath === subLink.href
                      ? "bg-red-600 border-red-500 text-white font-medium dark:bg-red-600 dark:border-red-500 dark:text-white"
                      : "border-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400 text-white dark:hover:bg-zinc-900 dark:hover:text-white dark:text-black dark:border-zinc-700"
                  }`}
                >
                  <subLink.icon size={20} className={`mr-3 ${activePath === subLink.href ? "text-white" : ""}`} />
                  <span className="text-sm font-medium">{subLink.text}</span>
                </button>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Add separator after admin section if admin */}
        {isAdmin && <div className="border-t border-zinc-700 mx-3 dark:border-zinc-600" />}

        {/* Regular Links - Available to all users */}
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={handleLinkClick}>
            <button
              className={`flex items-center w-full p-3 rounded-full transition-all duration-300 ${
                activePath === link.href
                  ? "bg-mainColor text-white font-medium dark:bg-mainColor dark:text-white"
                  : "hover:bg-zinc-100 hover:text-zinc-900 text-white dark:hover:bg-zinc-900 dark:hover:text-white dark:text-black"
              }`}
            >
              <link.icon size={20} className={`mr-3 ${activePath === link.href ? "text-white" : ""}`} />
              <span className="text-base font-medium">{link.text}</span>
            </button>
          </Link>
        ))}

        <div className="border-t border-zinc-700 mx-3 dark:border-zinc-600" />

        {/* Statistics Section - Available to all users */}
        <div>
          <button
            onClick={() => setStatisticsOpen((prev) => !prev)}
            className={`flex items-center w-full p-3 rounded-full transition-all duration-300 ${
              statisticsLinks.some((link) => activePath === link.href)
                ? "bg-black text-white font-medium dark:bg-white dark:text-black"
                : "hover:bg-zinc-100 hover:text-zinc-900 text-white dark:hover:bg-zinc-900 dark:hover:text-white dark:text-black"
            }`}
          >
            <ChartBar size={20} className="mr-3" />
            <span className="text-base font-medium">Statistics</span>
            {statisticsOpen ? (
              <ChevronUp size={20} className="ml-auto" />
            ) : (
              <ChevronDown size={20} className="ml-auto" />
            )}
          </button>
          <AnimatePresence>
            {statisticsOpen && (
              <motion.div
                className="mt-1 space-y-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {statisticsLinks.map((subLink) => (
                  <Link key={subLink.href} href={subLink.href} onClick={handleLinkClick}>
                    <button
                      className={`flex items-center mt-1 w-full p-3 rounded-full transition-all duration-300 ${
                        activePath === subLink.href
                          ? "bg-mainColor text-white font-medium dark:bg-mainColor dark:text-white"
                          : "hover:bg-zinc-100 hover:text-zinc-900 text-white dark:hover:bg-zinc-900 dark:hover:text-white dark:text-black"
                      }`}
                    >
                      <subLink.icon size={20} className={`mr-3 ${activePath === subLink.href ? "text-white" : ""}`} />
                      <span className="text-sm font-medium">{subLink.text}</span>
                    </button>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-zinc-700 mx-3 dark:border-zinc-600" />

        {/* Settings Section - Available to all users */}
        <div>
          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            className={`flex items-center w-full p-3 rounded-full transition-all duration-300 ${
              activePath.startsWith("/settings") || settingsLinks.some((link) => activePath === link.href)
                ? "bg-black text-white font-medium dark:bg-white dark:text-black"
                : "hover:bg-zinc-100 hover:text-zinc-900 text-white dark:hover:bg-zinc-900 dark:hover:text-white dark:text-black"
            }`}
          >
            <Settings size={20} className="mr-3" />
            <span className="text-base font-medium">Settings</span>
            {settingsOpen ? <ChevronUp size={20} className="ml-auto" /> : <ChevronDown size={20} className="ml-auto" />}
          </button>
          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                className="mt-1 space-y-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {settingsLinks.map((subLink) => (
                  <Link key={subLink.href} href={subLink.href} onClick={handleLinkClick}>
                    <button
                      className={`flex items-center mt-1 w-full p-3 rounded-full transition-all duration-300 ${
                        activePath === subLink.href
                          ? "bg-mainColor text-white font-medium dark:bg-mainColor dark:text-white"
                          : "hover:bg-zinc-100 hover:text-zinc-900 text-white dark:hover:bg-zinc-900 dark:hover:text-white dark:text-black"
                      }`}
                    >
                      <subLink.icon size={20} className={`mr-3 ${activePath === subLink.href ? "text-white" : ""}`} />
                      <span className="text-sm font-medium">{subLink.text}</span>
                    </button>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminSideMenu
