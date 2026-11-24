import { publicAsset } from "../lib/assets";

/**
 * Media library fixtures for the design preview. They reference the owner's
 * existing files. Nothing here is uploaded or stored by the application.
 * machine3/machine4 are duplicates and are not listed.
 */
export const MEDIA_FIXTURES = [
  {
    id: "photo-head",
    title: "Unik Gold embroidery head",
    kind: "image",
    src: publicAsset("machine1.jpg"),
    thumb: publicAsset("media/machine1-240.jpg"),
    status: "approved",
  },
  {
    id: "photo-touchscreen",
    title: "Unik Gold touchscreen machine",
    kind: "image",
    src: publicAsset("machine2.jpg"),
    thumb: publicAsset("media/machine2-240.jpg"),
    status: "approved",
  },
  {
    id: "banner-1",
    title: "Homepage banner 1",
    kind: "image",
    src: publicAsset("baner1.png"),
    thumb: publicAsset("baner1.png"),
    status: "approved",
  },
  {
    id: "banner-2",
    title: "Homepage banner 2",
    kind: "image",
    src: publicAsset("baner2.png"),
    thumb: publicAsset("baner2.png"),
    status: "pending",
  },
  {
    id: "demo-video",
    title: "Machine demonstration video",
    kind: "video",
    src: null,
    thumb: null,
    status: "draft",
  },
  {
    id: "brochure",
    title: "Product brochure (PDF)",
    kind: "brochure",
    src: null,
    thumb: null,
    status: "draft",
  },
];

export const MEDIA_STATUSES = ["approved", "pending", "draft"];
export const MEDIA_KINDS = ["image", "video", "brochure"];
