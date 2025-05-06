"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleX } from "lucide-react"

const ErrorPage = ({ message }) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="flex tras flex-col items-center justify-center min-h-screen bg-white dark:bg-thirdColor p-4">
      <div className="flex items-center justify-center flex-col max-w-lg w-full">
        <div className="flex items-center gap-3 justify-center mb-4">
          <h2 className="text-5xl font-bold">Error</h2>
          <CircleX className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <p className="text-base sm:text-lg text-center">{message}</p>
        <div className="mt-4">
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

