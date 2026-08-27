from __future__ import annotations

from typing import Any

from core.paper_models import AnalysisStatus, PaperAnalysisResponse


class PaperAnalyzer:
    def __init__(self, llm: Any | None = None) -> None:
        self.llm = llm

    def analyze(
        self,
        text: str,
        source: str,
        analysis_type: str,
    ) -> PaperAnalysisResponse:
        if not text or not text.strip():
            return PaperAnalysisResponse(
                analysis_type=analysis_type,
                status=AnalysisStatus.FAILED,
                answer="Belgica cannot analyse an empty document.",
                sources=[source] if source else [],
            )

        if self.llm is None:
            return PaperAnalysisResponse(
                analysis_type=analysis_type,
                status=AnalysisStatus.NOT_AVAILABLE,
                answer=(
                    "Belgica analysis is unavailable because the configured "
                    "language model is not ready."
                ),
                sources=[source] if source else [],
                access_message=(
                    "Configure the existing GOOGLE_API_KEY environment "
                    "variable to enable analysis."
                ),
            )

        try:
            source_text = self._clean_text(text)

            # For long papers, first produce section summaries.
            if len(source_text) > 18000:
                summaries: list[str] = []

                chunks = self._chunks(
                    source_text,
                    size=12000,
                )

                for index, chunk in enumerate(chunks, start=1):
                    chunk_prompt = f"""
You are Belgica, a scientific research assistant.

Analyze ONLY the supplied portion of a scientific paper.

Do not invent information.
Do not infer unsupported numerical results.
Do not invent methodology, datasets, conclusions, citations, or limitations.

Preserve important:
- methods
- datasets
- experiments
- numerical results
- observations
- limitations
- uncertainty

If something is not present, write:
Not stated in the available text.

This is section/chunk {index} of the paper.

PAPER CONTENT:
{chunk}
"""

                    summary = self._invoke(chunk_prompt)

                    if summary.strip():
                        summaries.append(summary.strip())

                if not summaries:
                    raise RuntimeError(
                        "The language model returned no usable chunk summaries."
                    )

                source_text = "\n\n--- NEXT PAPER SECTION ---\n\n".join(summaries)

            # Limit the final prompt to a safe amount of text.
            final_text = source_text[:120000]

            prompt = f"""
You are Belgica, a careful scientific-literacy assistant for
the Indian Polar Science research portal.

Analyze ONLY the supplied {analysis_type.replace("_", " ")}.

IMPORTANT EVIDENCE RULES:

1. Never invent facts.
2. Never invent numerical values.
3. Never invent datasets, methods, experiments, citations,
   limitations, or conclusions.
4. Distinguish clearly between what the paper states and
   Belgica's interpretation.
5. If information is missing, write:
   "Not stated in the available text."
6. Do not pretend that an abstract is a full paper.
7. When full paper text is supplied, analyze the actual supplied
   paper text.
8. Preserve important scientific terminology.
9. Explain difficult terminology in understandable language.
10. Do not fabricate references.

Produce a structured research analysis using exactly these sections:

## Paper overview

## Research problem and objective

## Methodology and data

## Main results

## Contributions and significance

## Limitations

## Future work

## Key findings

## Belgica's interpretation

For quantitative findings, report numbers only when supported
by the supplied text.

SOURCE:

{final_text}
"""

            answer = self._invoke(prompt)

            if not answer.strip():
                raise RuntimeError(
                    "The language model returned an empty analysis."
                )

            access_message = (
                "Full-text analysis is grounded in the uploaded or "
                "legitimately accessible paper text."
                if analysis_type == "full_text"
                else "This is an abstract-level analysis; the complete "
                "paper was not provided."
            )

            return PaperAnalysisResponse(
                analysis_type=analysis_type,
                status=AnalysisStatus.ANALYZED,
                answer=answer.strip(),
                sources=[source] if source else [],
                access_message=access_message,
            )

        except Exception as error:
            # Keep the real diagnostic in the server terminal/log.
            print(
                f"[Belgica] Analysis failed "
                f"(type={analysis_type}, source={source}): "
                f"{type(error).__name__}: {error}"
            )

            # Preserve the real exception for the FastAPI layer.
            raise RuntimeError(
                f"Belgica language-model analysis failed: "
                f"{type(error).__name__}: {error}"
            ) from error

    def _invoke(self, prompt: str) -> str:
        response = self.llm.invoke(prompt)

        content = getattr(response, "content", response)

        # Gemini/LangChain should normally return a string,
        # but handle list-based content safely.
        if isinstance(content, list):
            parts: list[str] = []

            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    text = item.get("text")
                    if text:
                        parts.append(str(text))

            return "\n".join(parts).strip()

        return str(content).strip()

    @staticmethod
    def _clean_text(text: str) -> str:
        lines = [line.strip() for line in text.splitlines()]

        cleaned: list[str] = []
        previous_blank = False

        for line in lines:
            if not line:
                if not previous_blank:
                    cleaned.append("")
                previous_blank = True
                continue

            cleaned.append(line)
            previous_blank = False

        return "\n".join(cleaned).strip()

    @staticmethod
    def _chunks(text: str, size: int) -> list[str]:
        if size <= 0:
            raise ValueError("Chunk size must be positive.")

        return [
            text[start:start + size]
            for start in range(0, len(text), size)
        ]