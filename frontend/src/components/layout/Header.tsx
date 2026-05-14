import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/Badge";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors: Record<string, "default" | "info" | "success" | "warning" | "error"> = {
    admin: "error",
    engineer: "info",
    production: "success",
    accounting: "warning",
    viewer: "default",
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={20} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{user?.username}</span>
            {user?.role && (
              <Badge variant={roleColors[user.role] || "default"}>
                {user.role}
              </Badge>
            )}
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white border border-gray-200 shadow-lg z-20 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
