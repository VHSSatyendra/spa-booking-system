import { Bell } from "lucide-react";

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName }: NavbarProps) {
  const navLinks = ["Home", "Therapists", "Sales", "Clients", "Transactions", "Reports"];

  return (
    <nav
      className="flex items-center justify-between px-4 h-12 flex-shrink-0"
      style={{ backgroundColor: "#1F1E1D" }}
      data-testid="navbar"
    >
      <div className="flex items-center gap-1">
        <div
          className="text-white font-bold text-sm px-2 py-1 rounded"
          style={{ backgroundColor: "#D97706" }}
        >
          N
        </div>
        <span className="text-white font-semibold text-sm ml-1">Natureland</span>
      </div>

      <div className="flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link}
            href="#"
            className={`text-sm font-medium transition-colors ${
              link === "Home" ? "text-amber-400" : "text-gray-300 hover:text-white"
            }`}
          >
            {link}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Bell size={18} className="text-gray-300" />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ backgroundColor: "#D97706" }}
        >
          {userName ? userName[0].toUpperCase() : "U"}
        </div>
      </div>
    </nav>
  );
}
