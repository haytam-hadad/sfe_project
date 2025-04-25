"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleX } from "lucide-react" // Import error icon from lucide

const ErrorPage = ({ message }) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-thirdColor">
      <div className="flex items-center justify-center flex-col">
        <div className="flex items-center gap-2 justify-center">
          <h2 className="text-5xl font-bold text-primary">Error</h2>
          <CircleX className="h-10 w-10" /> {/* Add error icon from lucide */}
        </div>

        <p className="text-lg text-primary">{message}</p>
        <div className="mt-8">
          <Link href="/">
            <span className="text-mainColor font-bold border-2 p-2 px-4 rounded-full border-mainColor text-center hover:text-blue-700">
              Go back home
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage

