export const site = {
  name: "India Polar Science Portal",
  ministry: "Ministry of Earth Sciences, Government of India",
  operator: "National Centre for Polar and Ocean Research (NCPOR), Goa",
  tagline: "India's open window on the Antarctic, the Arctic, the Southern Ocean and the third pole",
  established: 1981,
};

export const primaryNav = [
  { to: "/", label: "Home" },
  { to: "/expeditions", label: "Expeditions" },
  { to: "/repository", label: "Data repository" },
  { to: "/learning", label: "Learning" },
  { to: "/media", label: "Media" },
  { to: "/research", label: "Research Library", authenticated: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export const headlineStats = [
  { label: "Antarctic expeditions since 1981", value: "44" },
  { label: "Research stations operated", value: "4" },
  { label: "Curated datasets published", value: "1,286" },
  { label: "Partner institutions", value: "37" },
];

export const researchThemes = [
  {
    title: "Cryosphere & ice-sheet dynamics",
    description:
      "Mass-balance monitoring, firn and ice coring, GNSS geodesy and remote sensing of ice-sheet change in Queen Maud Land, Svalbard and the Chandra basin.",
  },
  {
    title: "Polar atmosphere & aerosols",
    description:
      "Surface energy balance, boundary-layer profiling, black carbon and aerosol optical properties measured continuously at Maitri and Himadri.",
  },
  {
    title: "Southern Ocean & fjord systems",
    description:
      "Repeat hydrography along 57°E, carbon-inventory change, Argo and BGC-Argo deployments, and glacier-fjord coupling in Kongsfjorden.",
  },
  {
    title: "Polar biology & ecosystems",
    description:
      "Microbial diversity in cryoconite and meltwater, mesozooplankton distribution, and bioprospecting for cold-adapted enzymes.",
  },
  {
    title: "Geology & solid-earth geophysics",
    description:
      "Precambrian crustal evolution of East Antarctica, glacial isostatic adjustment, palaeomagnetism and meteorite recovery from blue-ice fields.",
  },
  {
    title: "Policy, law & capacity building",
    description:
      "Implementing the Indian Antarctic Act 2022, Antarctic Treaty engagement, environmental impact assessment and training the next research cohort.",
  },
];

export const timeline = [
  { year: "1981", event: "First Indian Scientific Expedition to Antarctica departs for Queen Maud Land." },
  { year: "1983", event: "India accedes to the Antarctic Treaty and attains Consultative Party status; Dakshin Gangotri established." },
  { year: "1989", event: "Maitri station commissioned on the Schirmacher Oasis." },
  { year: "1998", event: "NCPOR (then NCAOR) established at Goa as the nodal polar research institution." },
  { year: "2008", event: "Himadri station opens at Ny-Ålesund, beginning sustained Indian Arctic research." },
  { year: "2012", event: "Bharati station commissioned at Larsemann Hills, East Antarctica." },
  { year: "2014", event: "IndARC sub-surface mooring deployed in Kongsfjorden." },
  { year: "2016", event: "HIMANSH high-altitude station established in Spiti Valley for Himalayan cryosphere work." },
  { year: "2022", event: "The Indian Antarctic Act comes into force, codifying Treaty obligations in domestic law." },
  { year: "2025", event: "Polar Science Portal launched as the single open access point for expedition data and outreach." },
];

export const publications = [
  {
    title:
      "Surface energy balance controls on summer melt at the Schirmacher Oasis, East Antarctica",
    authors: "Iyer, K., Sen, A., Rawat, M.",
    journal: "Journal of Glaciology",
    year: 2025,
    doi: "10.1017/jog.2025.0417",
  },
  {
    title: "Decadal change in anthropogenic carbon along the 57°E Southern Ocean section",
    authors: "Bose, N., Menon, H., Sheikh, F.",
    journal: "Deep-Sea Research Part I",
    year: 2025,
    doi: "10.1016/j.dsr.2025.104312",
  },
  {
    title:
      "Refractory black carbon deposition on Svalbard glaciers from South Asian source regions",
    authors: "Khan, Y., Pillai, S., Norbu, T.",
    journal: "Atmospheric Chemistry and Physics",
    year: 2024,
    doi: "10.5194/acp-24-11987-2024",
  },
  {
    title: "Eight-year mass balance of Chandra basin glaciers from a dense stake network",
    authors: "Verma, I., Devi, A.",
    journal: "The Cryosphere",
    year: 2025,
    doi: "10.5194/tc-19-1447-2025",
  },
];

// -----------------------------------------------------------------------------
// Research Paper Library
// -----------------------------------------------------------------------------
//
// This is the initial catalogue used by the Research Library UI.
//
// IMPORTANT:
// These are currently demonstration records only.
// Later, they will be replaced/extended by records imported from scholarly
// sources such as OpenAlex and Crossref through the backend.
//
// Do NOT put API keys or private credentials in this file.
//

export type ResearchPaper = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  abstract: string;
  keywords: string[];
  region: string;
  theme: string;
  paperUrl?: string;
  pdfUrl?: string;
  openAccess: boolean;
};

export const researchPapers: ResearchPaper[] = [
  {
    id: "ice-nucleating-particles-2024",

    title:
      "Ice-nucleating particles active below −24 °C in a Finnish boreal forest and their relationship to bioaerosols",

    authors: [
      "Franziska Vogel",
      "Michael P. Adams",
      "Larissa Lacher",
      "Polly B. Foster",
      "Grace C. E. Porter",
    ],

    journal: "Atmospheric Chemistry and Physics",

    year: 2024,

    doi: "10.5194/acp-24-11737-2024",

    abstract:
      "This study investigates ice-nucleating particles in a Finnish boreal forest and examines their relationship with biological aerosol particles. The research contributes to understanding atmospheric processes involved in ice formation.",

    keywords: [
      "ice-nucleating particles",
      "bioaerosols",
      "atmospheric science",
      "ice formation",
      "aerosols",
    ],

    region: "Arctic",

    theme: "Polar atmosphere & aerosols",

    paperUrl:
      "https://doi.org/10.5194/acp-24-11737-2024",

    pdfUrl:
      "https://acp.copernicus.org/articles/24/11737/2024/",

    openAccess: true,
  },

  {
    id: "antarctic-black-carbon-2019",

    title:
      "Black carbon in the atmosphere over the Antarctic Peninsula",

    authors: [
      "A. P. Chaubey",
      "S. N. Tripathi",
      "T. A. N. R. others",
    ],

    journal: "Atmospheric Chemistry and Physics",

    year: 2019,

    abstract:
      "Research on atmospheric black carbon over Antarctica provides insight into aerosol transport, deposition, radiative effects and the role of long-range transported particles in the polar atmosphere.",

    keywords: [
      "black carbon",
      "Antarctica",
      "aerosols",
      "atmospheric transport",
      "radiative effects",
    ],

    region: "Antarctica",

    theme: "Polar atmosphere & aerosols",

    paperUrl:
      "https://acp.copernicus.org/",

    openAccess: true,
  },

  {
    id: "southern-ocean-carbon-cycle",

    title:
      "The Southern Ocean carbon cycle: recent advances and future challenges",

    authors: [
      "Southern Ocean Research Community",
    ],

    journal: "Southern Ocean scientific literature",

    year: 2024,

    abstract:
      "Research into the Southern Ocean carbon cycle examines air-sea carbon exchange, ocean circulation, biological productivity and the role of the Southern Ocean in regulating the global climate system.",

    keywords: [
      "Southern Ocean",
      "carbon cycle",
      "oceanography",
      "air-sea exchange",
      "climate",
    ],

    region: "Southern Ocean",

    theme: "Southern Ocean & fjord systems",

    paperUrl:
      "https://openalex.org/",
    
    openAccess: true,
  },

  {
    id: "himalayan-glacier-change",

    title:
      "Himalayan glacier change and the response of the high-mountain cryosphere",

    authors: [
      "High Mountain Research Community",
    ],

    journal: "Cryosphere research literature",

    year: 2024,

    abstract:
      "Studies of Himalayan glaciers investigate glacier mass balance, ice loss, snow accumulation, remote sensing observations and the response of high-mountain cryospheric systems to climate variability.",

    keywords: [
      "Himalaya",
      "glacier",
      "mass balance",
      "cryosphere",
      "remote sensing",
    ],

    region: "Himalaya",

    theme: "Cryosphere & ice-sheet dynamics",

    paperUrl:
      "https://openalex.org/",

    openAccess: true,
  },

  {
    id: "polar-microbial-ecosystems",

    title:
      "Microbial ecosystems in polar cryoconite and meltwater environments",

    authors: [
      "Polar Microbiology Research Community",
    ],

    journal: "Polar biological research literature",

    year: 2024,

    abstract:
      "Research on microbial communities in cryoconite and meltwater environments explores biodiversity, ecological processes and the ability of microorganisms to survive under extreme polar conditions.",

    keywords: [
      "polar biology",
      "microbiology",
      "cryoconite",
      "meltwater",
      "extremophiles",
    ],

    region: "Antarctica",

    theme: "Polar biology & ecosystems",

    paperUrl:
      "https://openalex.org/",

    openAccess: true,
  },

  {
    id: "antarctic-geophysics",

    title:
      "Geophysical investigations of the Antarctic continental crust",

    authors: [
      "Antarctic Geophysics Research Community",
    ],

    journal: "Antarctic geophysics research literature",

    year: 2024,

    abstract:
      "Geophysical investigations of Antarctica use geological, geophysical and geodetic observations to study continental crustal evolution, tectonic history and changes associated with the Antarctic ice sheet.",

    keywords: [
      "Antarctica",
      "geophysics",
      "continental crust",
      "geology",
      "geodesy",
    ],

    region: "Antarctica",

    theme: "Geology & solid-earth geophysics",

    paperUrl:
      "https://openalex.org/",

    openAccess: true,
  },

  {
    id: "antarctic-policy-law",

    title:
      "Antarctic governance, environmental protection and scientific cooperation",

    authors: [
      "Antarctic Policy Research Community",
    ],

    journal: "Antarctic policy and governance literature",

    year: 2024,

    abstract:
      "Research into Antarctic governance examines the Antarctic Treaty System, environmental protection, scientific cooperation, environmental impact assessment and the development of national polar policies.",

    keywords: [
      "Antarctic Treaty",
      "policy",
      "environmental protection",
      "governance",
      "scientific cooperation",
    ],

    region: "Antarctica",

    theme: "Policy, law & capacity building",

    paperUrl:
      "https://www.ats.aq/",

    openAccess: true,
  },
];

export const notices = [
  {
    date: "2026-08-12",
    title: "Call for proposals: 46th Indian Scientific Expedition to Antarctica",
    body: "Proposals for ISEA-46 station and traverse science are invited from Indian universities and research institutions. Submissions close 30 September 2026.",
    tag: "Call for proposals",
  },
  {
    date: "2026-07-28",
    title: "Southern Ocean 57°E data release, version 3.0",
    body: "The 2023-24 occupation of the 57°E repeat hydrographic section is now published with full-depth CTD, bottle chemistry and gridded fields.",
    tag: "Data release",
  },
  {
    date: "2026-07-02",
    title: "Winter maintenance window for the repository search index",
    body: "Full-text and faceted search will be read-only between 03:00 and 05:00 IST on 10 July 2026 while the index is rebuilt.",
    tag: "Service notice",
  },
];
