import "./globals.css"
import ClientLayout from "./clientLayout"

export default function RootLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>
}
