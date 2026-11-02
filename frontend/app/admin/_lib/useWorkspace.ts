"use client";

import { useSessionUser } from "@/lib/auth";

/**
 * Staff reach bookings and payments from /staff, admins from /admin, so the
 * "back to dashboard" link and the workspace label depend on the role.
 */
export function useWorkspace() {
  const user = useSessionUser();
  const isStaff = user?.role === "staff";

  return {
    dashboardHref: isStaff ? "/staff" : "/admin",
    label: isStaff ? "Staff Workspace" : "Admin Workspace",
  };
}
