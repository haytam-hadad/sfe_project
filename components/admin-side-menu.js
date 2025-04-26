import { useEffect } from "react";
import { Home, Database, ChartBar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

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

const AdminSideMenu = ({ setVisible }) => {
  const activePath = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof setVisible === "function") {
        setVisible(false);
      }
    };

    router.events?.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events?.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, setVisible]);

  return (
    <motion.div
      className="bg-zinc-900 border border-r-2 border-r-mainColor dark:bg-white border-gray-800 w-[260px] h-full fixed top-0 md:pt-16 overflow-y-auto left-0"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ bottom: 0 }}
    >
      <div className="flex flex-col p-3 mt-2 space-y-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <button
              onClick={() => setVisible(false)}
              className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${
                activePath === link.href
                  ? "bg-mainColor text-white dark:bg-mainColor dark:text-white font-medium shadow-sm"
                  : "text-gray-200 dark:text-zinc-700 hover:bg-zinc-800/70 dark:hover:bg-gray-50 dark:hover:text-gray-900"
              }`}
            >
              {link.icon && (
                <link.icon
                  size={20}
                  className={`mr-3`}
                />
              )}
              <span className="text-base font-medium">{link.text}</span>
            </button>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminSideMenu;

