import { publicAsset } from "../lib/assets";

/**
 * Homepage machine gallery. Alt text describes the verified content of each
 * image. Note: machine1.jpg and machine3.jpg are byte-identical, as are
 * machine2.jpg and machine4.jpg; the owner should confirm whether duplicate
 * slides are intended.
 */
export const MACHINE_SLIDES = [
  {
    src: publicAsset("machine1.jpg"),
    width: 1280,
    height: 959,
    alt: "Close-up of a Unik Gold embroidery head stitching metallic beads onto fabric.",
  },
  {
    src: publicAsset("machine2.jpg"),
    width: 959,
    height: 1280,
    alt: "Unik Gold multi-needle embroidery machine with a DAHAO control touchscreen in a workshop.",
  },
  {
    src: publicAsset("machine3.jpg"),
    width: 1280,
    height: 959,
    alt: "Close-up of a Unik Gold embroidery head stitching metallic beads onto fabric.",
  },
  {
    src: publicAsset("machine4.jpg"),
    width: 959,
    height: 1280,
    alt: "Unik Gold multi-needle embroidery machine with a DAHAO control touchscreen in a workshop.",
  },
];

/**
 * Homepage promotional banners, kept exactly as provided by the owner.
 */
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
