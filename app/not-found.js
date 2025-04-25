import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark">
      <h1 className="text-7xl font-bold">404</h1>
      <p className="text-xl mt-4">Page Not Found</p>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
        The page you are looking for does not exist.
      </p>

      <Link
        href="/"
        className="mt-6 font-bold px-6 py-3 bg-mainColor dark:bg-primary-dark text-primary-foreground dark:text-primary-foreground-dark rounded-lg hover:bg-primary-dark dark:hover:bg-primary"
      >
        Go Home
      </Link>
    </div>
  )
}

