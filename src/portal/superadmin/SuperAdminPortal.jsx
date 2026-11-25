import PortalFrame from "../PortalFrame";
import RequirePortal from "../RequirePortal";
import { SessionProvider } from "../SessionProvider";
import { PermissionCodes } from "../permissions";

/** SuperAdmin portal layout. Every page below requires the SuperAdmin role. */
const NAV = [
  { path: "", label: "Overview" },
  { path: "administrators", label: "Administrators", permission: PermissionCodes.UsersManageAdmins },
  { path: "roles", label: "Roles and permissions", permission: PermissionCodes.RolesPermissionsManage },
  { path: "organization", label: "Organization", permission: PermissionCodes.SettingsManage },
  { path: "audit", label: "Audit log", permission: PermissionCodes.AuditRead },
  { path: "profile", label: "Profile", permission: PermissionCodes.ProfileSelf },
];

export default function SuperAdminPortal() {
  return (
    <SessionProvider>
      <RequirePortal requiredRole="SuperAdmin">
        <PortalFrame title="SuperAdmin" basePath="/portal/superadmin" items={NAV} />
      </RequirePortal>
    </SessionProvider>
  );
}
