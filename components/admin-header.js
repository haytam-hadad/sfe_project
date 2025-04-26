"use client";
import Link from "next/link";
import { Menu, Moon, Sun, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useContext } from "react";
import { ThemeContext } from "../app/ThemeProvider";

export default function AdminHeader({ onToggleMenu }) {
  const { theme, setTheme } = useContext(ThemeContext);

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme(!theme);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-6 h-6" />
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Ecomark
            </span>
          </Link>

          {/* Control Group */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center">
              <Switch
                id="dark-mode"
                checked={theme}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-mainColor"
              />
              <span className="ml-2">
                {theme ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-400" />
                )}
              </span>
            </div>

            {/* Sidebar Toggle Button (Mobile) */}
            <button
              onClick={onToggleMenu}
              className="md:hidden flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
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

