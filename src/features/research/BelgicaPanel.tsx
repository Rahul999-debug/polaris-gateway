import { useState } from "react";

type ResearchPaperForBelgica = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  paperUrl?: string;
  pdfUrl?: string;
  openAccess: boolean;
};

type BelgicaPanelProps = {
  paper: ResearchPaperForBelgica;
  onClose: () => void;
};

type BelgicaResponse = {
  analysis_type: "full_text" | "abstract" | "metadata";
  status?: "available" | "not_available" | "analyzed" | "failed";
  answer: string;
  sources: string[];
  access_message?: string;
};

const scientificApiUrl = import.meta.env["VITE_SCIENTIFIC_API_URL"] ?? "http://127.0.0.1:8000";

export function BelgicaPanel({ paper, onClose }: BelgicaPanelProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BelgicaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const hasAbstract =
    Boolean(paper.abstract) &&
    paper.abstract.trim() !== "" &&
    paper.abstract.trim().toLowerCase() !== "abstract unavailable.";

  const hasFullPdf = Boolean(paper.pdfUrl && paper.openAccess);

  async function analyzePaper() {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await fetch(`${scientificApiUrl}/api/belgica/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paper: {
            id: paper.id,
            title: paper.title,
            authors: paper.authors,
            journal: paper.journal,
            year: paper.year,
            doi: paper.doi ?? null,
            abstract: paper.abstract,
            paper_url: paper.paperUrl ?? null,
            pdf_url: paper.pdfUrl ?? null,
            open_access: paper.openAccess,
          },
        }),
      });

      if (!result.ok) {
        let message = "Belgica could not analyse this paper.";

        try {
          const body = (await result.json()) as {
            detail?: string;
          };

          if (body.detail) {
            message = body.detail;
          }
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      const data = (await result.json()) as BelgicaResponse;

      setResponse(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Belgica is currently unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function analyzeUploadedPdf() {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const result = await fetch(`${scientificApiUrl}/papers/analyze-upload`, {
        method: "POST",
        body: formData,
      });
      if (!result.ok) {
        const body = (await result.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? "Belgica could not analyse the uploaded PDF.");
      }
      setResponse((await result.json()) as BelgicaResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Belgica is currently unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Belgica"
          className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full border border-border bg-card text-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          ×
        </button>

        {/* Belgica header */}
        <div className="border-b border-border bg-card px-6 py-7 sm:px-8">
          <div className="flex items-center gap-5">
            <div className="size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 bg-muted shadow-md">
              <img src="/belgica.png" alt="Belgica" className="size-full object-cover" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">Belgica</h2>

                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Research Assistant
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Helping young researchers understand scientific literature
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          {/* Selected paper */}
          <section className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Selected paper
            </p>

            <h3 className="mt-2 text-xl font-semibold leading-7">{paper.title}</h3>

            <p className="mt-2 text-sm text-muted-foreground">{paper.authors.join(", ")}</p>

            <p className="mt-1 text-sm italic text-muted-foreground">
              {paper.journal} · {paper.year}
            </p>

            {paper.doi ? (
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                DOI: {paper.doi}
              </p>
            ) : null}
          </section>

          {/* Access status */}
          <section className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">Paper access</h3>

            {hasFullPdf ? (
              <div className="mt-3 rounded-xl bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Full paper available
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  An accessible PDF is associated with this publication. Belgica can use the full
                  text when the backend successfully obtains the document.
                </p>
              </div>
            ) : hasAbstract ? (
              <div className="mt-3 rounded-xl bg-amber-500/10 p-4">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Abstract available — full paper access required
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Belgica can analyse the available abstract now. A complete paper analysis requires
                  legitimate access to the full paper.
                </p>

                {paper.paperUrl ? (
                  <a
                    href={paper.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex rounded-lg border border-amber-500/30 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background/50"
                  >
                    View publisher / access options
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-muted p-4">
                <p className="font-semibold">No usable abstract or full paper available</p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Belgica cannot produce a reliable scientific summary from bibliographic metadata
                  alone.
                </p>

                {paper.paperUrl ? (
                  <a
                    href={paper.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-background"
                  >
                    View paper
                  </a>
                ) : null}
              </div>
            )}
          </section>

          {/* What Belgica analyses */}
          <section>
            <h3 className="font-semibold">Belgica will explain</h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">🎯 Research question</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  What scientific problem the research is addressing.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">🔬 Methodology</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  What approach the researchers used, when the accessible material supports it.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">📊 Key findings</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The important findings explicitly supported by the source.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">💡 Why it matters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  An easier explanation of the scientific significance.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">⚠️ Limitations</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Limitations Belgica can support from the available source.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold">🚀 Research directions</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clearly labelled suggestions for possible future research.
                </p>
              </div>
            </div>
          </section>

          {/* Analysis */}
          <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">
                  {hasFullPdf
                    ? "Analyse the accessible full paper"
                    : hasAbstract
                      ? "Analyse the available abstract"
                      : "Analysis unavailable"}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {hasFullPdf
                    ? "Belgica will fetch and analyze the public PDF when it is a valid PDF."
                    : hasAbstract
                      ? "This will be explicitly labelled as abstract-based analysis."
                      : "An abstract or full text is required for reliable analysis."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void analyzePaper()}
                disabled={loading || (!hasAbstract && !hasFullPdf)}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Belgica is analysing..."
                  : hasAbstract
                    ? "Analyse with Belgica"
                    : "Analysis unavailable"}
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            ) : null}

            {response ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Analysis type
                  </p>

                  <p className="mt-1 font-semibold">
                    {response.analysis_type === "full_text"
                      ? "Full-paper analysis"
                      : response.analysis_type === "abstract"
                        ? "Abstract-based analysis"
                        : "Metadata-based analysis"}
                  </p>

                  {response.access_message ? (
                    <p className="mt-2 text-sm text-muted-foreground">{response.access_message}</p>
                  ) : null}
                </div>

                <div>
                  <h4 className="font-semibold">Belgica's explanation</h4>

                  <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-background p-5 text-sm leading-7">
                    {response.answer}
                  </div>
                </div>

                {response.sources.length > 0 ? (
                  <div>
                    <h4 className="font-semibold">Sources</h4>

                    <div className="mt-3 space-y-2">
                      {response.sources.map((source) => (
                        <div
                          key={source}
                          className="rounded-lg border border-border bg-background p-3 font-mono text-xs"
                        >
                          {source}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Legitimate full paper upload */}
          <section className="rounded-xl border border-dashed border-border p-5">
            <h3 className="font-semibold">Have legitimate access to the full paper?</h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Upload a legally obtained PDF for full-paper analysis. Belgica will never ask for
              publisher passwords or attempt to bypass paywalls or CAPTCHA.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => void analyzeUploadedPdf()}
                disabled={loading || !selectedFile}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Analyse uploaded PDF
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
