import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useNoIndex } from "../../hooks/useNoIndex";
import DataTable from "../../ui/DataTable";
import Field from "../../ui/Field";
import KpiTile from "../../ui/KpiTile";
import PortalShell from "../../ui/PortalShell";

function ProfileForm() {
  return (
    <form
      aria-label="Profile details"
      className="card max-w-2xl space-y-5 p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <Field label="Full name">
        <input className="field-input" name="name" autoComplete="name" />
      </Field>
      <Field label="Email address">
        <input
          className="field-input"
          type="email"
          name="email"
          autoComplete="email"
        />
      </Field>
      <Field label="Phone number">
        <input
          className="field-input"
          type="tel"
          name="phone"
          autoComplete="tel"
        />
      </Field>
      <p className="text-sm text-muted">
        Saving profile changes will be available after backend integration (M4).
      </p>
      <button type="button" disabled className="btn-secondary">
        Save changes (after M4)
      </button>
    </form>
  );
}

function PortalPage() {
  const { roleId, role, section } = useLoaderData();
  const isOverview = section.id === "overview";
  const [filter, setFilter] = useState("");

  usePageMeta({
    title: `${role.label} · ${section.label}`,
    description: section.description,
    path: undefined,
  });
  useNoIndex();

  const rows = section.rows.filter(
    (row) =>
      !filter.trim() ||
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(filter.trim().toLowerCase()),
  );

  return (
    <PortalShell
      roleId={roleId}
      breadcrumbs={[
        { label: "Design preview", to: "/preview" },
        { label: role.label, to: `/preview/${roleId}` },
        { label: section.label },
      ]}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{role.label} portal</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-navy">
              {section.label}
            </h1>
            <p className="mt-2 text-sm text-body">{section.description}</p>
          </div>
          {!isOverview && section.id !== "profile" ? (
            <button
              type="button"
              disabled
              title="Available after backend integration (M4)"
              className="btn-secondary"
            >
              New record (after M4)
            </button>
          ) : null}
        </div>

        {isOverview ? (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {role.kpis.map((label) => (
                <KpiTile key={label} label={label} />
              ))}
            </div>
            <section aria-labelledby="activity-heading" className="space-y-4">
              <h2
                id="activity-heading"
                className="font-display text-xl font-bold text-navy"
              >
                Recent activity
              </h2>
              <DataTable
                caption="Recent activity (sample data)"
                columns={section.columns}
                rows={section.rows}
              />
            </section>
          </>
        ) : section.id === "profile" ? (
          <ProfileForm />
        ) : (
          <>
            <div className="max-w-md">
              <label
                htmlFor="portal-filter"
                className="text-sm font-semibold text-navy"
              >
                Filter this view
              </label>
              <input
                id="portal-filter"
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="field-input mt-1.5"
              />
            </div>
            <DataTable
              caption={`${section.label} (sample data)`}
              columns={section.columns}
              rows={rows}
              emptyMessage="No sample records match this filter."
            />
          </>
        )}
        <p className="text-xs text-muted">
          All records on this page are sample data for layout review.
        </p>
      </div>
    </PortalShell>
  );
}

export default PortalPage;
