import "./globals.css"
import ClientLayout from "./clientLayout"

export const metadata = {
  manifest: "/manifest.json",
  title: "Ecomark Dashboard",
  description:
    "Ecomark Dashboard is a modern, intuitive, and fully responsive admin pwa built with Next.js and Tailwind CSS. It's designed to be a starting point for your next web application.",
  keywords:
    "admin dashboard, next.js, tailwind css, react, modern, responsive, ecomark, pwa, web application",
  author: "haytam hadad",
  favicon: "/images/i1.svg",
};


export default function RootLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>
}
