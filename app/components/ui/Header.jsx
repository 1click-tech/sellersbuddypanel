"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosArrowForward, IoIosClose } from "react-icons/io";
import { MdDashboard, MdOutlineManageAccounts } from "react-icons/md";
import { FaUserCog, FaTools } from "react-icons/fa";
import { RiFileSettingsLine } from "react-icons/ri";
import { BsGraphUp } from "react-icons/bs";
import { TbSettingsCog } from "react-icons/tb";
import Image from "next/image";
import { Users } from "lucide-react";

export default function CRMHeader({ onModuleChange }) {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleLogoClick = () => {
    router.push("/board");
  };

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#e0f0fb] fixed top-0 left-0 w-full z-50 px-2 py-1 flex justify-between items-center shadow-sm">
        {/* LEFT: Arrow + Logo */}
        <div className="flex items-center gap-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1 bg-white/30 rounded-md"
          >
            <IoIosArrowForward
              className={`text-gray-600 cursor-pointer transition-transform duration-300 ${
                showSidebar ? "rotate-180" : ""
              }`}
              fontSize={22}
            />
          </button>

          <button
            onClick={() => {
              onModuleChange("board");
              router.push("/board");
            }}
          >
            <img
              src="/flatLogo.png"
              alt="logo"
              className="h-[35px] w-auto select-none cursor-pointer"
            />
          </button>
        </div>

        {/* RIGHT: Logout */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="bg-[#f56219] hover:bg-[#bd460a] text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-white flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <MdDashboard className="text-xl" />
            <span>Dashboard</span>
          </div>
          <IoIosClose
            className="text-2xl cursor-pointer hover:rotate-90 transition-transform"
            onClick={() => setShowSidebar(false)}
          />
        </div>

        {/* MENU ITEMS */}
        <ul className="mt-4 px-4 space-y-2 text-gray-700 font-medium">
          {/* Dashboard */}
          <li
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#f56219]/10 hover:text-[#ec5a11] transition-all"
            onClick={() => {
              onModuleChange("board");
              setShowSidebar(false);
            }}
          >
            <MdDashboard className="text-xl" />
            <span>Dashboard</span>
          </li>

          {/* Service Activation Panel */}
          <li
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#f56219]/10 hover:text-[#f56219] transition-all"
            onClick={() => {
              onModuleChange("service-management");
              setShowSidebar(false);
            }}
          >
            <FaUserCog className="text-xl" />
            <span>Service Management</span>
          </li>

          {/* Manage Users */}
          <li
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#f56219]/10 hover:text-[#f56219] transition-all"
            onClick={() => {
              onModuleChange("manage-users");
              setShowSidebar(false);
            }}
          >
            <Users className="text-xl" />
            <span>Manage Users</span>
          </li>
        </ul>

        {/* BOTTOM LOGO */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center">
          <img
            src="/flatLogo.png"
            alt="iClickDistributor Logo"
            className=" h-40px w-auto"
          />
        </div>
      </aside>
    </>
  );
}
