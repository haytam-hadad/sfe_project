"use client"

import { Loader } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

export default function Loading() {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
  )
}

