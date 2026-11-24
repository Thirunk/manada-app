/**
 * Design-preview configuration for the four role portals. All records are
 * generated sample rows, labelled as sample data in the UI. They do not
 * represent real customers, orders or figures.
 */
const STATUS_CYCLE = ["Active", "Pending", "Draft", "Closed"];
const COLUMNS = ["Reference", "Item", "Status", "Updated"];

function sampleRows(prefix, count = 4) {
  return Array.from({ length: count }, (_, index) => ({
    reference: `${prefix}-${String(index + 1).padStart(3, "0")}`,
    item: `Sample record ${index + 1}`,
    status: STATUS_CYCLE[index % STATUS_CYCLE.length],
    updated: "Sample data",
  }));
}

const SECTION_DESCRIPTIONS = {
  overview: "Summary of activity for this role.",
  administrators: "Accounts with administrative access.",
  roles: "Roles and the permissions assigned to them.",
  settings: "Site-wide configuration.",
  security: "Sign-in and access events to review.",
  audit: "Record of changes made in the system.",
  storage: "Where media and documents are stored.",
  products: "Machines and product information.",
  inventory: "Stock levels for machines and parts.",
  customers: "Customer accounts and contact details.",
  staff: "Staff accounts and assignments.",
  leads: "New enquiries waiting for follow-up.",
  quotations: "Quotations sent to customers.",
  orders: "Confirmed orders.",
  installations: "Scheduled and completed installations.",
  "service-requests": "Repair and maintenance requests.",
  "warranty-amc": "Warranty periods and AMC agreements.",
  training: "Training courses and bookings.",
  cms: "Website pages and content.",
  reports: "Reports for management review.",
  enquiries: "Enquiries assigned to you.",
  "follow-ups": "Customer follow-ups due.",
  "service-jobs": "Service jobs assigned to you.",
  "installation-tasks": "Installation tasks assigned to you.",
  "maintenance-schedules": "Scheduled maintenance visits.",
  "training-assignments": "Training sessions you are assigned to.",
  "status-updates": "Update the progress of your work.",
  evidence: "Photos and documents attached to completed work.",
  machines: "Machines registered to your account.",
  notifications: "Messages and alerts for your account.",
  profile: "Your contact details and preferences.",
};

const ROLE_SECTIONS = {
  superadmin: [
    { id: "overview", label: "System overview" },
    { id: "administrators", label: "Administrators" },
    { id: "roles", label: "Roles and permissions" },
    { id: "settings", label: "Global settings" },
    { id: "security", label: "Security monitoring" },
    { id: "audit", label: "Audit logs" },
    { id: "storage", label: "Storage configuration" },
  ],
  admin: [
    { id: "overview", label: "Business overview" },
    { id: "products", label: "Products" },
    { id: "inventory", label: "Inventory" },
    { id: "customers", label: "Customers" },
    { id: "staff", label: "Staff" },
    { id: "leads", label: "Leads" },
    { id: "quotations", label: "Quotations" },
    { id: "orders", label: "Orders" },
    { id: "installations", label: "Installations" },
    { id: "service-requests", label: "Service requests" },
    { id: "warranty-amc", label: "Warranty and AMC" },
    { id: "training", label: "Training" },
    { id: "cms", label: "CMS" },
    { id: "reports", label: "Reports" },
  ],
  staff: [
    { id: "overview", label: "My work" },
    { id: "enquiries", label: "Assigned enquiries" },
    { id: "follow-ups", label: "Follow-ups" },
    { id: "service-jobs", label: "Service jobs" },
    { id: "installation-tasks", label: "Installation tasks" },
    { id: "maintenance-schedules", label: "Maintenance schedules" },
    { id: "training-assignments", label: "Training assignments" },
    { id: "status-updates", label: "Work status updates" },
    { id: "evidence", label: "Evidence attachments" },
  ],
  customer: [
    { id: "overview", label: "My dashboard" },
    { id: "quotations", label: "Quotations" },
    { id: "orders", label: "Orders" },
    { id: "machines", label: "Registered machines" },
    { id: "warranty-amc", label: "Warranty and AMC" },
    { id: "service-requests", label: "Service requests" },
    { id: "training", label: "Training" },
    { id: "notifications", label: "Notifications" },
    { id: "profile", label: "Profile" },
  ],
};

export const PORTAL_ROLES = {
  superadmin: {
    label: "SuperAdmin",
    kpis: [
      "Administrator accounts",
      "Open security events",
      "Storage services",
    ],
    sections: ROLE_SECTIONS.superadmin,
  },
  admin: {
    label: "Admin",
    kpis: ["Open leads", "Quotations awaiting reply", "Service requests open"],
    sections: ROLE_SECTIONS.admin,
  },
  staff: {
    label: "Staff",
    kpis: ["Assigned enquiries", "Service jobs open", "Evidence pending"],
    sections: ROLE_SECTIONS.staff,
  },
  customer: {
    label: "Customer",
    kpis: ["Open quotations", "Registered machines", "Service requests open"],
    sections: ROLE_SECTIONS.customer,
  },
};

export function getPortalRole(roleId) {
  return PORTAL_ROLES[roleId] ?? null;
}

export function getPortalSection(roleId, sectionId) {
  const role = getPortalRole(roleId);
  const section = role?.sections.find((item) => item.id === sectionId);
  if (!section) return null;
  return {
    ...section,
    description: SECTION_DESCRIPTIONS[sectionId] ?? "",
    columns: COLUMNS,
    rows: sampleRows(
      `${roleId.slice(0, 3).toUpperCase()}-${sectionId.slice(0, 4).toUpperCase()}`,
    ),
  };
}
