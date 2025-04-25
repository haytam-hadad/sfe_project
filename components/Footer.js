import Image from "next/image"

export default function Footer() {
  return (
    <footer className="w-full py-6 border-t-8 bg-black text-white dark:text-black dark:bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 group">
            <Image
              src="/images/i1.svg"
              width={40}
              height={40}
              className="w-10 h-10 filter dark:filter-none invert transition-transform duration-300 group-hover:scale-110"
              alt="Newsify  Logo"
            />
            <span className="text-xl font-bold font-sans tracking-wide transition-colors duration-300 group-hover:text-opacity-80">
            Newsify 
            </span>
          </div>

          <p className="text-sm md:text-base text-center scale-90">
            Copyright &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

