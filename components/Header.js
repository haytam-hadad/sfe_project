"use client"
import Link from "next/link"
import {
  AlignJustify,
  Moon,
  Sun,
  LogOut,
  User,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/contexts/app-context"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AdminHeader({ onToggleMenu }) {
  const { theme, setTheme } = useApp()
  const { user, logout } = useAuth()

  const toggleTheme = () => {
    setTheme(!theme)
  }

  const getUserInitials = () => {
    if (!user || !user.username) return "U"
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="max-w-full mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between py-2.5">
         {/* Logo Section */}
          <Link href="/" className="flex items-center gap-1 lg:gap-2 group">
              <Image
                src="/images/logo.svg"
                alt="Logo"
                className="w-11 h-11"
                width={24}
                height={24}
              />
            <div className="flex flex-col">
              <span className="text-xl font-bold">
                Ecomark
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400" style={{marginTop: '-4px'}}>Dashboard</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
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

            <DropdownMenuSeparator className="h-5 m-0.5 w-px bg-zinc-300 dark:bg-zinc-600" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1">
                  <Avatar className="h-8 w-8 font-semibold border">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block p-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{(user?.username || "User").charAt(0).toUpperCase() + (user?.username || "").slice(1)}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs p-1 leading-none text-muted-foreground">{user?.email || "No email provided"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem >
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="mr-2 h-4 w-4 "/>
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 text-mainColor h-4 w-4" />
                  <span className="text-mainColor">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenuSeparator className=" md:hidden flex m-0.5 h-5 w-px bg-zinc-300 dark:bg-zinc-600" />

            <button
              onClick={onToggleMenu}
              className="md:hidden flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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

