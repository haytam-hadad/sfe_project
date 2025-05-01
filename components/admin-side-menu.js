import { Home, Database, ChartBar, ChevronDown, ChevronUp, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  {
    text: "Overview",
    href: "/",
    icon: Home,
  },
  {
    text: "Orders",
    href: "/orders",
    icon: Database,
  },
];

const statisticsLinks = [
  {
    text: "Cities",
    href: "/city-stats",
    icon: MapPin,
  },
  {
    text: "Products",
    href: "/product-stats",
    icon: Package,
  },
];

const AdminSideMenu = () => {
  const activePath = usePathname();
  const [statisticsOpen, setStatisticsOpen] = useState(true); // State to toggle the accordion

  return (
    <motion.div
      className="bg-zinc-950 border-r h-full fixed top-0 md:pt-16 overflow-y-auto left-0 w-[250px]"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{ bottom: 0 }}
    >
      <div className="flex flex-col p-3 space-y-3">
        {/* Navigation Links */}
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <button
              className={`flex items-center w-full p-3 rounded-full transition-all duration-300 ${
                activePath === link.href
                  ? "bg-white text-gray-900 font-medium"
                  : "hover:bg-gray-100 hover:text-gray-900 text-white"
              }`}
            >
              <link.icon size={20} className={`mr-3 ${activePath === link.href ? "text-mainColor" : ""}`} />
              <span className="text-base font-medium">{link.text}</span>
            </button>
          </Link>
        ))}
        <div className="border-t border-gray-700 mx-3" />
        {/* Statistics Accordion */}
        <div>
          <button
            onClick={() => setStatisticsOpen((prev) => !prev)}
            className={`flex items-center w-full p-3 rounded-full transition-all duration-300 ${
              activePath.startsWith("/statistics")
                ? "bg-white text-gray-900 font-medium"
                : "hover:bg-gray-100 hover:text-gray-900 text-white"
            }`}
          >
            <ChartBar size={20} className="mr-3" />
            <span className="text-base font-medium">Statistics</span>
            {statisticsOpen ? (
              <ChevronUp size={20} className="ml-auto" />
            ) : (
              <ChevronDown size={20} className="ml-auto" />
            )}
          </button>
          {statisticsOpen && (
            <div className="mt-2 space-y-2">
              {statisticsLinks.map((subLink) => (
                <Link key={subLink.href} href={subLink.href} className="block">
                  <button
                    className={`flex items-center w-full p-2.5 rounded-full transition-all duration-300 ${
                      activePath === subLink.href
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "hover:bg-gray-200 hover:text-gray-900 text-white"
                    }`}
                  >
                    <subLink.icon size={20} className={`mr-3 ${activePath === subLink.href ? "text-mainColor" : ""}`} />
                    <span className="text-sm font-medium">{subLink.text}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSideMenu;
