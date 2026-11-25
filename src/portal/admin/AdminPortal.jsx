import PortalFrame from "../PortalFrame";
import RequirePortal from "../RequirePortal";
import { SessionProvider } from "../SessionProvider";
import { PermissionCodes } from "../permissions";

/** Admin portal layout. Pages require the Admin role; the API limits accounts to Staff and Customer. */
const NAV = [
  { path: "", label: "Dashboard" },
  { path: "staff", label: "Staff", permission: PermissionCodes.UsersManageStaff },
  { path: "customers", label: "Customers", permission: PermissionCodes.UsersManageCustomers },
  { path: "profile", label: "Profile", permission: PermissionCodes.ProfileSelf },
];

export default function AdminPortal() {
  return (
    <SessionProvider>
      <RequirePortal requiredRole="Admin">
        <PortalFrame title="Admin" basePath="/portal/admin" items={NAV} />
      </RequirePortal>
    </SessionProvider>
  );
}
