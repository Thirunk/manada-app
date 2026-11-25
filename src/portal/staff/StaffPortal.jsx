import PortalFrame from "../PortalFrame";
import RequirePortal from "../RequirePortal";
import { SessionProvider } from "../SessionProvider";
import { PermissionCodes } from "../permissions";

/** Staff portal layout. Staff hold profile access only; account administration is not shown. */
const NAV = [
  { path: "", label: "Dashboard" },
  { path: "profile", label: "Profile", permission: PermissionCodes.ProfileSelf },
];

export default function StaffPortal() {
  return (
    <SessionProvider>
      <RequirePortal requiredRole="Staff">
        <PortalFrame title="Staff" basePath="/portal/staff" items={NAV} />
      </RequirePortal>
    </SessionProvider>
  );
}
