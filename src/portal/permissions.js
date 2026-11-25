/** Permission codes as the API returns them. They must match backend Manada.Domain PermissionCodes. */
export const PermissionCodes = Object.freeze({
  ProfileSelf: "profile.self",
  CustomerSelf: "customer.self",
  UsersRead: "users.read",
  UsersManageStaff: "users.manage.staff",
  UsersManageCustomers: "users.manage.customers",
  UsersManageAdmins: "users.manage.admins",
  RolesAssign: "roles.assign",
  RolesPermissionsManage: "roles.permissions.manage",
  AuditRead: "audit.read",
  SettingsManage: "settings.manage",
});
