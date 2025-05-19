"use client"
import Link from "next/link"
import {
  AlignJustify,
  Moon,
  Sun,
  LogOut,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/contexts/app-context"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AdminHeader({ onToggleMenu }) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()

  const toggleTheme = () => {
    setTheme(!theme)
  }

  const getUserInitials = () => {
    if (!user || !user.username) return "U"
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-full mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-1">
            <Image src="/images/logo.svg" alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9" width={40} height={40} />
            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Ecomark</span>
          </Link>

          <div className="flex items-center gap-2">
            <div title="Toggle Dark Mode" className="flex items-center max-md:scale-90 sm:gap-1">
              <Switch
                id="dark-mode"
                checked={theme}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-mainColor"
              />
              <span className="hidden sm:block">
                {theme ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-600" />
                )}
              </span>
            </div>

            <DropdownMenuSeparator className="h-5 m-0.5 w-px bg-gray-300 dark:bg-gray-600" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1">
                  <Avatar className="h-8 w-8 font-semibold border ">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username || "User"}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "No email provided"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenuSeparator className=" md:hidden flex m-0.5 h-5 w-px bg-gray-300 dark:bg-gray-600" />

            <button
              onClick={onToggleMenu}
              className="md:hidden flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <AlignJustify className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

