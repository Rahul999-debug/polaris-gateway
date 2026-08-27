import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { PublicShell } from "@/components/site/public-shell";
import { Button } from "@/components/ui/button";
import { ShieldQuestion } from "lucide-react";
import { researchPapers } from "@/features/site/content";
import { BelgicaPanel } from "@/features/research/BelgicaPanel";
import { useSession } from "@/features/auth/useSession";
import type { ResearchPaper } from "@/features/site/content";

const title = "Research Library | India Polar Science Portal";

const description =
  "Explore scientific literature related to polar science, cryosphere research, oceanography, atmospheric science, and other research areas connected to Polaris.";

const scientificApiUrl =
  import.meta.env["VITE_SCIENTIFIC_API_URL"] ??
  "http://127.0.0.1:8000";

const paperPageSize = 200;

const antarcticFallbackPapers = researchPapers.filter(
  (paper) => paper.region === "Antarctica",
);

type ResearchApiPaper = {
  source?: string;
  source_id?: string;
  title: string;
  authors?: string[];
  journal?: string | null;
  year?: number | null;
  doi?: string | null;
  abstract?: string | null;
  keywords?: string[];
  paper_url?: string | null;
  pdf_url?: string | null;
  open_access?: boolean;
};

type ResearchApiResponse = {
  query: string;
  page: number;
  per_page: number;
  papers: ResearchApiPaper[];
};

function normalizeApiPaper(
  paper: ResearchApiPaper,
  index: number,
): ResearchPaper {
  const searchableText = [
    paper.title,
    paper.abstract ?? "",
    ...(paper.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const region = searchableText.includes("southern ocean")
    ? "Southern Ocean"
    : searchableText.includes("antarctic") ||
        searchableText.includes("antarctica")
      ? "Antarctica"
      : searchableText.includes("arctic")
        ? "Arctic"
        : searchableText.includes("himalaya") ||
            searchableText.includes("glacier")
          ? "Himalaya"
          : "Polar regions";

  const theme = searchableText.includes("ocean")
    ? "Southern Ocean & fjord systems"
    : searchableText.includes("atmosphere") ||
        searchableText.includes("aerosol")
      ? "Polar atmosphere & aerosols"
      : searchableText.includes("biology") ||
          searchableText.includes("microb")
        ? "Polar biology & ecosystems"
        : searchableText.includes("geophys") ||
            searchableText.includes("geolog")
          ? "Geology & solid-earth geophysics"
          : "Cryosphere & ice-sheet dynamics";

  const normalized: ResearchPaper = {
    id: paper.source_id ?? `openalex-${index}`,
    title: paper.title || "Untitled paper",
    authors: paper.authors ?? [],
    journal: paper.journal ?? "Research publication",
    year: paper.year ?? 0,
    abstract: paper.abstract ?? "Abstract unavailable.",
    keywords: paper.keywords ?? [],
    region,
    theme,
    openAccess: Boolean(paper.open_access),
  };

  const paperUrl =
    paper.paper_url ??
    (paper.doi ? `https://doi.org/${paper.doi}` : undefined);

  if (paper.doi) {
    normalized.doi = paper.doi;
  }

  if (paperUrl) {
    normalized.paperUrl = paperUrl;
  }

  if (paper.pdf_url) {
    normalized.pdfUrl = paper.pdf_url;
  }

  return normalized;
}

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ResearchLibraryPage,
});

function ResearchLibraryPage() {
  const { user, ready } = useSession();

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRegion, setSelectedRegion] = useState("All");

  const [selectedTheme, setSelectedTheme] = useState("All");

  const [selectedPaperForBelgica, setSelectedPaperForBelgica] =
    useState<ResearchPaper | null>(null);

  const [selectedSort, setSelectedSort] = useState("newest");

  const [papers, setPapers] = useState<ResearchPaper[]>(
    antarcticFallbackPapers,
  );

  const [papersLoading, setPapersLoading] = useState(false);

  const [papersError, setPapersError] = useState(false);

  const [usingFallback, setUsingFallback] = useState(true);

  const [nextPage, setNextPage] = useState(2);

  const [hasMorePapers, setHasMorePapers] = useState(false);

  /*
   * Load papers from the live FastAPI/OpenAlex service.
   *
   * IMPORTANT:
   * We do NOT automatically prepend "Antarctica" to the user's query.
   *
   * Empty search:
   *     query=Antarctica
   *
   * Search for Vostok:
   *     query=Vostok
   *
   * Search for glacier:
   *     query=glacier
   *
   * This allows OpenAlex to perform the actual scholarly search.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const controller = new AbortController();

    const trimmedQuery = searchQuery.trim();

    const apiQuery = trimmedQuery || "Antarctica";

    setPapersLoading(true);
    setPapersError(false);
    setUsingFallback(false);
    setNextPage(2);
    setHasMorePapers(false);

    const timeoutId = window.setTimeout(async () => {
      try {
        const url =
          `${scientificApiUrl}/api/research/papers` +
          `?query=${encodeURIComponent(apiQuery)}` +
          `&page=1` +
          `&per_page=${paperPageSize}`;

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Research API returned HTTP ${response.status}`,
          );
        }

        const payload =
          (await response.json()) as ResearchApiResponse;

        if (!active) {
          return;
        }

        const incoming = (payload.papers ?? []).map(
          normalizeApiPaper,
        );

        /*
         * The live API is working.
         *
         * Even if it returns zero papers, we must NOT silently
         * replace the result with the four local papers.
         *
         * Otherwise a legitimate search such as "Vostok" could
         * incorrectly appear as if only four papers exist.
         */
        setPapers(incoming);

        setUsingFallback(false);

        /*
         * If the API returned a full page, there may be another page.
         */
        setHasMorePapers(
          incoming.length === paperPageSize,
        );
      } catch (error: unknown) {
        if (!active) {
          return;
        }

        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Failed to load research papers from scientific API:",
          error,
        );

        /*
         * Only use the four local papers when the LIVE API itself
         * cannot be reached.
         */
        setPapers(antarcticFallbackPapers);
        setUsingFallback(true);
        setPapersError(true);
        setHasMorePapers(false);
      } finally {
        if (active) {
          setPapersLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, user]);

  async function loadMorePapers() {
    if (papersLoading || !hasMorePapers) {
      return;
    }

    const trimmedQuery = searchQuery.trim();

    const apiQuery = trimmedQuery || "Antarctica";

    setPapersLoading(true);
    setPapersError(false);

    try {
      const url =
        `${scientificApiUrl}/api/research/papers` +
        `?query=${encodeURIComponent(apiQuery)}` +
        `&page=${nextPage}` +
        `&per_page=${paperPageSize}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Research API returned HTTP ${response.status}`,
        );
      }

      const payload =
        (await response.json()) as ResearchApiResponse;

      const incoming = (payload.papers ?? []).map(
        normalizeApiPaper,
      );

      setPapers((current) => {
        const existingIds = new Set(
          current.map((paper) => paper.id),
        );

        const uniqueIncoming = incoming.filter(
          (paper) => !existingIds.has(paper.id),
        );

        return [...current, ...uniqueIncoming];
      });

      setNextPage((page) => page + 1);

      setHasMorePapers(
        incoming.length === paperPageSize,
      );
    } catch (error) {
      console.error(
        "Failed to load more research papers:",
        error,
      );

      setPapersError(true);
    } finally {
      setPapersLoading(false);
    }
  }

  const regions = useMemo(
    () => [
      "All",
      "Arctic",
      "Antarctica",
      "Southern Ocean",
      "Himalaya",
      "Polar regions",
    ],
    [],
  );

  const themes = [
    "All",
    "Cryosphere & ice-sheet dynamics",
    "Polar atmosphere & aerosols",
    "Southern Ocean & fjord systems",
    "Polar biology & ecosystems",
    "Geology & solid-earth geophysics",
    "Policy, law & capacity building",
    "Polar regions",
  ];

  /*
   * IMPORTANT:
   *
   * Search is already performed by OpenAlex through the backend.
   *
   * Therefore we do NOT perform another title/abstract search here.
   *
   * The client-side filtering below is ONLY for Region and Theme.
   *
   * This prevents valid OpenAlex results from disappearing because
   * their metadata does not contain the exact search string.
   */
  const filteredPapers = useMemo(() => {
    const filtered = papers.filter((paper) => {
      const matchesRegion =
        selectedRegion === "All" ||
        paper.region === selectedRegion;

      const matchesTheme =
        selectedTheme === "All" ||
        paper.theme === selectedTheme;

      return matchesRegion && matchesTheme;
    });

    const sorted = [...filtered];

    switch (selectedSort) {
      case "oldest":
        sorted.sort((a, b) => a.year - b.year);
        break;

      case "newest":
        sorted.sort((a, b) => b.year - a.year);
        break;

      case "title-asc":
        sorted.sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        break;

      case "title-desc":
        sorted.sort((a, b) =>
          b.title.localeCompare(a.title),
        );
        break;

      case "region":
        sorted.sort((a, b) =>
          a.region.localeCompare(b.region),
        );
        break;

      case "theme":
        sorted.sort((a, b) =>
          a.theme.localeCompare(b.theme),
        );
        break;

      default:
        break;
    }

    return sorted;
  }, [
    papers,
    selectedRegion,
    selectedTheme,
    selectedSort,
  ]);

  if (!ready) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl px-4 py-24">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </PublicShell>
    );
  }

  /*
   * Belgica remains protected behind authentication.
   */
  if (!user) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <ShieldQuestion
            className="mx-auto size-10 text-accent"
            aria-hidden
          />

          <h1 className="mt-4 font-display text-2xl font-bold">
            Sign in to view the Research Library
          </h1>

          <p className="mt-3 text-muted-foreground">
            The Research Library contains scientific literature
            curated by NCPOR researchers. Please sign in to
            access it.
          </p>

          <Button asChild className="mt-6">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Polaris Research
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Research Paper Library
              </h1>

              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Explore scientific literature related to polar
                science, cryosphere research, oceanography,
                atmospheric science, and other research areas
                connected to Polaris.
              </p>
            </div>
          </div>
        </section>

        {/* Search and filters */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-[1fr_200px_200px_200px]">
              {/* Search */}
              <div>
                <label
                  htmlFor="research-search"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Search papers
                </label>

                <input
                  id="research-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search title, author, keyword..."
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Region */}
              <div>
                <label
                  htmlFor="research-region"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Region
                </label>

                <select
                  id="research-region"
                  value={selectedRegion}
                  onChange={(event) =>
                    setSelectedRegion(event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme */}
              <div>
                <label
                  htmlFor="research-theme"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Research theme
                </label>

                <select
                  id="research-theme"
                  value={selectedTheme}
                  onChange={(event) =>
                    setSelectedTheme(event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
                >
                  {themes.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label
                  htmlFor="research-sort"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Sort by
                </label>

                <select
                  id="research-sort"
                  value={selectedSort}
                  onChange={(event) =>
                    setSelectedSort(event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
                >
                  <option value="newest">
                    Newest first
                  </option>

                  <option value="oldest">
                    Oldest first
                  </option>

                  <option value="title-asc">
                    Title (A-Z)
                  </option>

                  <option value="title-desc">
                    Title (Z-A)
                  </option>

                  <option value="region">
                    Region
                  </option>

                  <option value="theme">
                    Research theme
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Research papers
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredPapers.length} paper
                {filteredPapers.length === 1 ? "" : "s"} found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {papersLoading
                  ? "Loading the live scholarly catalogue..."
                  : usingFallback
                    ? "Live catalogue unavailable; showing the local catalogue."
                    : "Live scholarly catalogue powered by OpenAlex."}
              </p>

              {papersError && (
                <p className="mt-1 text-xs text-destructive">
                  The scientific API could not be reached.
                  Please make sure the FastAPI service is running.
                </p>
              )}
            </div>
          </div>

          {papersLoading && papers.length === 0 ? (
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                No papers found
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Try changing your search query or filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPapers.map((paper) => (
                <article
                  key={paper.id}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                      {paper.region}
                    </span>

                    <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                      {paper.theme}
                    </span>

                    <span className="text-muted-foreground">
                      {paper.year}
                    </span>

                    {paper.openAccess && (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 font-medium text-green-700 dark:text-green-400">
                        Open Access
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold leading-7 text-foreground">
                    {paper.title}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {paper.authors.join(", ")}
                  </p>

                  <p className="mt-1 text-sm italic text-muted-foreground">
                    {paper.journal}
                  </p>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {paper.abstract}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {paper.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {paper.paperUrl && (
                      <a
                        href={paper.paperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                      >
                        View paper
                      </a>
                    )}

                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                      >
                        Open PDF
                      </a>
                    )}

                    {/* BELGICA AI — PRESERVED */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPaperForBelgica(paper)
                      }
                      className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
                    >
                      Ask Belgica
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMorePapers && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMorePapers}
                disabled={papersLoading}
              >
                {papersLoading
                  ? "Loading papers..."
                  : "Load more papers"}
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* BELGICA AI PANEL — PRESERVED */}
      {selectedPaperForBelgica && (
        <BelgicaPanel
          paper={selectedPaperForBelgica}
          onClose={() =>
            setSelectedPaperForBelgica(null)
          }
        />
      )}
    </PublicShell>
  );
}