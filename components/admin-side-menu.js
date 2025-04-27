import { Home, Database, ChartBar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

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
  {
    text: "Analytics",
    href: "/analytics",
    icon: ChartBar,
  },
];

const AdminSideMenu = () => {
  const activePath = usePathname();

  return (
    <motion.div
      className="bg-mainColor h-full fixed top-0 md:pt-16 overflow-y-auto left-0 w-[250px] transition-all duration-50"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      style={{ bottom: 0 }}
    >
      <div className="flex flex-col p-3 space-y-3">
        {/* Navigation Links */}
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <button
              className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${
                activePath === link.href
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "hover:bg-white hover:text-gray-900 text-white"
              }`}
            >
              <link.icon size={20} className="mr-3" />
              <span className="text-base font-medium">{link.text}</span>
            </button>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminSideMenu;

