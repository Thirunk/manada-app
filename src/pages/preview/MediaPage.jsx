import { usePageMeta } from "../../hooks/usePageMeta";
import { useNoIndex } from "../../hooks/useNoIndex";
import MediaLibrary from "../../ui/MediaLibrary";
import PortalShell from "../../ui/PortalShell";

function MediaPage() {
  usePageMeta({
    title: "Media library (design preview)",
    description: "Media library layout preview.",
    path: undefined,
  });
  useNoIndex();

  return (
    <PortalShell
      roleId="admin"
      breadcrumbs={[
        { label: "Design preview", to: "/preview" },
        { label: "Admin", to: "/preview/admin" },
        { label: "Media library" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">
            Media library
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-body">
            Layout preview for images, videos, brochures and banners. Uploads,
            storage and publication are not connected yet (M4).
          </p>
        </div>
        <MediaLibrary />
      </div>
    </PortalShell>
  );
}

export default MediaPage;
