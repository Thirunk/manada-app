import PortalFrame from "../PortalFrame";
import RequirePortal from "../RequirePortal";
import { SessionProvider } from "../SessionProvider";
import { PermissionCodes } from "../permissions";

/** Customer portal layout. Customers see only their own account and sessions. */
const NAV = [
  { path: "", label: "Dashboard", permission: PermissionCodes.CustomerSelf },
  { path: "profile", label: "Profile", permission: PermissionCodes.ProfileSelf },
];

export default function CustomerPortal() {
  return (
    <SessionProvider>
      <RequirePortal requiredRole="Customer">
        <PortalFrame title="Customer" basePath="/portal/customer" items={NAV} />
      </RequirePortal>
    </SessionProvider>
  );
}
