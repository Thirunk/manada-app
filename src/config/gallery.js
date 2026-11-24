import { publicAsset } from "../lib/assets";

/**
 * Machine photographs supplied by the owner. Each entry has the unchanged
 * original plus 240px and 640px JPEG derivatives in public/media for
 * responsive delivery.
 *
 * machine3.jpg and machine4.jpg are byte-identical to machine1.jpg and
 * machine2.jpg. They stay in public/ as original assets but are not listed
 * here, so the gallery shows no duplicate slides.
 */
export const MACHINE_PHOTOS = {
  "unik-gold-head": {
    id: "unik-gold-head",
    src: publicAsset("machine1.jpg"),
    thumb: publicAsset("media/machine1-240.jpg"),
    medium: publicAsset("media/machine1-640.jpg"),
    width: 1280,
    height: 959,
    alt: "Close-up of a Unik Gold embroidery head stitching metallic beads onto fabric.",
  },
  "unik-gold-touchscreen": {
    id: "unik-gold-touchscreen",
    src: publicAsset("machine2.jpg"),
    thumb: publicAsset("media/machine2-240.jpg"),
    medium: publicAsset("media/machine2-640.jpg"),
    width: 959,
    height: 1280,
    alt: "Unik Gold multi-needle embroidery machine with a DAHAO control touchscreen in a workshop.",
  },
};

/** Unique photographs for the homepage gallery. */
export const MACHINE_SLIDES = [
  MACHINE_PHOTOS["unik-gold-head"],
  MACHINE_PHOTOS["unik-gold-touchscreen"],
];

/** Homepage promotional banners, kept exactly as provided by the owner. */
export const HOME_BANNERS = [
  {
    src: publicAsset("baner1.png"),
    width: 1054,
    height: 784,
    alt: "Manada banner: sales and service for all kinds of sewing and embroidery machines, listing Unik Gold, Brother, Bernina and Usha, with the Manada logo and contact numbers.",
  },
  {
    src: publicAsset("baner2.png"),
    width: 1066,
    height: 789,
    alt: "Manada banner: embroidered blouse designs beside an embroidery machine, promoting embroidery training, design training and repair services.",
  },
  {
    src: publicAsset("baner3.png"),
    width: 1051,
    height: 786,
    alt: "Manada banner: two embroidery design layouts for blouse back and front, with the Manada logo and contact numbers.",
  },
];
