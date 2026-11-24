import { getPortalRole, getPortalSection } from "../../config/portal";

/**
 * Validates the role and section before rendering. Unknown combinations throw
 * a 404 response. Only generated sample data is ever shown.
 */
export function portalLoader({ params }) {
  const roleId = params.role;
  const role = getPortalRole(roleId);
  if (!role) {
    throw new Response("Portal not found", { status: 404 });
  }
  const sectionId = params.section ?? "overview";
  const section = getPortalSection(roleId, sectionId);
  if (!section) {
    throw new Response("Section not found", { status: 404 });
  }
  return { roleId, role, section };
}
