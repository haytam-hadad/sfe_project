"use client"
import { ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"

export const GoUp = () => {
  const [show, setShow] = useState(false)
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShow(true)
    } else {
      setShow(false)
    }
  }
  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  return show ? (
    <button
      className="fixed z-50 bottom-4 right-3 rounded-full bg-mainColor p-2 text-white shadow-md transition-transform transform hover:scale-110"
      onClick={handleClick}
    >
      <ArrowUp />
    </button>
  ) : null
}


