export interface MediaItem {
  id: string;
  kind: "photo" | "video" | "audio" | "document";
  title: string;
  credit: string;
  captured: string;
  location: string;
  expeditionCode: string;
  description: string;
  tags: string[];
  durationSeconds?: number;
  pages?: number;
  license: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  isPlaceholder?: boolean;
  /** Deterministic gradient seed so the demo tile art is stable across SSR and hydration. */
  hue: number;
}

const imageUrl = (path: string) =>
  `https://images.unsplash.com/${path}?auto=format&fit=crop&w=1200&q=80`;

export const mediaItems: MediaItem[] = [
  {
    id: "md-001",
    kind: "photo",
    title: "Katabatic drift over the Schirmacher Oasis",
    credit: "Photo: Dr. Kavya Iyer / NCPOR",
    captured: "2025-01-18",
    location: "Maitri station, Antarctica",
    expeditionCode: "ISEA-44",
    description:
      "Late-afternoon drift snow streaming off the ice sheet edge during a 24 m/s katabatic event, photographed from the Maitri automatic weather station mast.",
    tags: ["katabatic", "Maitri", "weather"],
    license: "CC BY 4.0",
    thumbnailUrl: imageUrl("photo-1519681393784-d120267933ba"),
    mediaUrl: imageUrl("photo-1482192596544-9eb780fc7f66"),
    isPlaceholder: false,
    hue: 214,
  },
  {
    id: "md-002",
    kind: "photo",
    title: "Firn core section PC-44/03 under raking light",
    credit: "Photo: Dr. Anirban Sen / NCPOR",
    captured: "2025-01-11",
    location: "Sør Rondane foothills, Antarctica",
    expeditionCode: "ISEA-44",
    description:
      "A 1 m section of firn core photographed on a light table, with visible melt layers used as summer markers during annual layer counting.",
    tags: ["ice core", "glaciology", "stratigraphy"],
    license: "CC BY 4.0",
    thumbnailUrl: imageUrl("photo-1511497584788-876760111969"),
    mediaUrl: imageUrl("photo-1473448912268-2022ce9509d8"),
    isPlaceholder: false,
    hue: 198,
  },
  {
    id: "md-003",
    kind: "video",
    title: "Deploying the Kongsfjorden CTD rosette",
    credit: "Video: IARC-2025 field team / NCPOR",
    captured: "2025-06-27",
    location: "Kongsfjorden, Svalbard",
    expeditionCode: "IARC-2025",
    description:
      "Small-boat CTD deployment at inner-fjord station K3, showing the winch procedure and surface meltwater layer sampling near the Kronebreen calving front.",
    tags: ["CTD", "Arctic", "fieldwork"],
    durationSeconds: 214,
    license: "CC BY-NC 4.0",
    thumbnailUrl: imageUrl("photo-1518837695005-2083093ee35b"),
    mediaUrl: imageUrl("photo-1521295121783-8a321d551ad2"),
    isPlaceholder: false,
    hue: 190,
  },
  {
    id: "md-004",
    kind: "audio",
    title: "Glacier calving acoustics, Kronebreen front",
    credit: "Recording: Dr. Sanjana Pillai / NCPOR",
    captured: "2025-07-14",
    location: "Kronebreen, Svalbard",
    expeditionCode: "IARC-2025",
    description:
      "Hydrophone recording of submarine melt and calving events, captured 400 m from the terminus over a 12-minute window during peak melt.",
    tags: ["acoustics", "calving", "hydrophone"],
    durationSeconds: 726,
    license: "CC BY 4.0",
    thumbnailUrl: imageUrl("photo-1500530855697-b586d89ba3ee"),
    mediaUrl: imageUrl("photo-1501785888041-af3ef285b470"),
    isPlaceholder: false,
    hue: 172,
  },
  {
    id: "md-005",
    kind: "photo",
    title: "Ablation stake survey on Sutri Dhaka",
    credit: "Photo: Dr. Ishaan Verma / NCPOR",
    captured: "2024-09-14",
    location: "Chandra basin, Himachal Pradesh",
    expeditionCode: "HICRYO-2024",
    description:
      "Field team recording stake emergence on the debris-covered tongue of Sutri Dhaka glacier during the end-of-ablation-season survey.",
    tags: ["mass balance", "Himalaya", "HIMANSH"],
    license: "CC BY 4.0",
    thumbnailUrl: imageUrl("photo-1464822759023-fed622ff2c3b"),
    mediaUrl: imageUrl("photo-1506744038136-46273834b3fb"),
    isPlaceholder: false,
    hue: 40,
  },
  {
    id: "md-006",
    kind: "document",
    title: "ISEA-44 preliminary science report",
    credit: "NCPOR, Ministry of Earth Sciences",
    captured: "2025-05-30",
    location: "Goa, India",
    expeditionCode: "ISEA-44",
    description:
      "Preliminary cruise and station report summarising instrument deployments, sample inventories and data-submission status for the 44th Antarctic expedition.",
    tags: ["report", "documentation", "ISEA-44"],
    pages: 84,
    license: "Government Open Data Licence — India",
    thumbnailUrl: imageUrl("photo-1451187580459-43490279c0fa"),
    mediaUrl: imageUrl("photo-1497366754035-f200968a6e72"),
    isPlaceholder: false,
    hue: 228,
  },
  {
    id: "md-007",
    kind: "photo",
    title: "Aurora australis above Bharati station",
    credit: "Photo: Lt Cdr Rohan Bhatt / Indian Navy",
    captured: "2025-03-09",
    location: "Larsemann Hills, Antarctica",
    expeditionCode: "ISEA-44",
    description:
      "Thirty-second exposure of aurora australis over the modular container architecture of Bharati station at the start of the polar night transition.",
    tags: ["aurora", "Bharati", "night sky"],
    license: "CC BY 4.0",
    thumbnailUrl: imageUrl("photo-1469474968028-56623f02e42e"),
    mediaUrl: imageUrl("photo-1521295121783-8a321d551ad2"),
    isPlaceholder: false,
    hue: 158,
  },
  {
    id: "md-008",
    kind: "video",
    title: "UAV photogrammetry flight lines, Sutri Dhaka",
    credit: "Video: Dr. Aruna Devi / WIHG",
    captured: "2024-09-15",
    location: "Chandra basin, Himachal Pradesh",
    expeditionCode: "HICRYO-2024",
    description:
      "Time-compressed footage of a mapping flight over the glacier tongue, annotated with ground control point positions used for the 0.15 m DEM.",
    tags: ["UAV", "DEM", "survey"],
    durationSeconds: 168,
    license: "CC BY 4.0",
    thumbnailUrl: imageUrl("photo-1446776811953-b23d57bd21aa"),
    mediaUrl: imageUrl("photo-1470770841072-f978cf4d019e"),
    isPlaceholder: false,
    hue: 96,
  },
  {
    id: "md-009",
    kind: "photo",
    title: "Cryoconite holes on Vestre Broggerbreen",
    credit: "Photo: Dr. Tenzing Norbu / NCPOR",
    captured: "2025-08-02",
    location: "Brøggerhalvøya, Svalbard",
    expeditionCode: "IARC-2025",
    description:
      "Water-filled cryoconite holes with dark sediment floors, each a self-contained microbial habitat sampled for 16S rRNA amplicon sequencing.",
    tags: ["microbiology", "cryoconite", "Arctic"],
    license: "CC BY-NC 4.0",
    thumbnailUrl: imageUrl("photo-1500375592092-40eb2168fd21"),
    mediaUrl: imageUrl("photo-1493246507139-91e8fad9978e"),
    isPlaceholder: false,
    hue: 148,
  },
];

export const mediaKinds = ["photo", "video", "audio", "document"] as const;
