"use client";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useContext } from "react";
import { ThemeContext } from "./theme-provider";
import Image from "next/image";

export default function AdminHeader({ onToggleMenu }) {
  const { theme, setTheme } = useContext(ThemeContext);

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme(!theme);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-full mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2">
            <Image src="/images/logo.svg" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8" width={40} height={40} />
            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              Ecomark
            </span>
          </Link>

          {/* Welcome Admin */}
          <p className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
            Welcome, Admin !
          </p>

          {/* Control Group */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <div title="Toggle Dark Mode" className="flex items-center max-md:scale-90 sm:gap-1">
              <Switch
                id="dark-mode"
                checked={theme}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-mainColor"
              />
              <span className="hidden sm:block">
                {theme ? (
                  <Sun className="w-5 h-5 text-yellow-400 dark:text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                )}
              </span>
            </div>

            {/* Sidebar Toggle Button (Mobile) */}
            <button
              onClick={onToggleMenu}
              className="md:hidden flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

