"use client"

import { Loader } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

export default function Loading() {
  return (
    <div className="bg-white dark:bg-black min-h-screen flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader className="w-12 h-12 text-primary" />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

