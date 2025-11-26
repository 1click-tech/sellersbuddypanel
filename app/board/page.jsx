"use client";
import { useState } from "react";
import ProtectedRoute from "./ProtectedRoute";
import CRMHeader from "../components/ui/Header";
import DataTable from "../components/dashboard/DataTable";
import Service from "../components/servicemanagement/services";
import ManageUser from "../components/manageusers/manageUsers";

export default function DashboardPage() {
  const [module, setModule] = useState("board");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header gets the handler */}
        <CRMHeader onModuleChange={setModule} />

        <main className="pt-[45px]">
          {/* DEFAULT DASHBOARD CONTENT */}
          {module === "board" && <DataTable />}

          {/* SERVICE MANAGEMENT CONTENT */}
          {module === "service-management" && <Service />}

          {/* SERVICE MANAGEMENT CONTENT */}
          {module === "manage-users" && <ManageUser />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
