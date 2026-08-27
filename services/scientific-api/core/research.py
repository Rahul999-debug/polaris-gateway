from __future__ import annotations

from typing import Any

import httpx


OPENALEX_API_URL = "https://api.openalex.org/works"


class ResearchPaperService:
    """
    Service responsible for discovering scholarly papers.

    At this stage we use OpenAlex only for discovery.
    We do not download PDFs and we do not put papers into the RAG system yet.
    """

    def __init__(self) -> None:
        self.base_url = OPENALEX_API_URL

    async def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Search OpenAlex and convert its response into the simplified
        Research Paper structure used by Polaris.
        """

        if not query.strip():
            return []

        params = {
            "search": query,
            "page": page,
            "per-page": per_page,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                self.base_url,
                params=params,
                headers={
                    "User-Agent": "Polaris-Research-Portal/1.0"
                },
            )

            response.raise_for_status()

            data = response.json()

        return [
            self._normalize_work(work)
            for work in data.get("results", [])
        ]

    async def get(self, paper_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/{paper_id}",
                headers={"User-Agent": "Polaris-Research-Portal/1.0"},
            )
            response.raise_for_status()
            return self._normalize_work(response.json())

    def _normalize_work(self, work: dict[str, Any]) -> dict[str, Any]:
        """
        Convert an OpenAlex work into Polaris' research-paper format.
        """

        authors: list[str] = []

        for authorship in work.get("authorships", []):
            author = authorship.get("author", {})

            name = author.get("display_name")

            if name:
                authors.append(name)

        primary_location = work.get("primary_location") or {}

        source = primary_location.get("source") or {}

        landing_page_url = primary_location.get("landing_page_url")

        pdf_url = None

        source_url = primary_location.get("pdf_url")

        if source_url:
            pdf_url = source_url

        abstract = self._reconstruct_abstract(
            work.get("abstract_inverted_index")
        )

        concepts = []

        for concept in work.get("concepts", []):
            name = concept.get("display_name")

            if name:
                concepts.append(name)

        doi = work.get("doi")

        if doi and doi.startswith("https://doi.org/"):
            doi = doi.replace("https://doi.org/", "")

        return {
            "source": "OpenAlex",
            "source_id": work.get("id"),
            "title": work.get("title") or "Untitled paper",
            "authors": authors,
            "journal": source.get("display_name"),
            "year": work.get("publication_year"),
            "doi": doi,
            "abstract": abstract,
            "keywords": concepts,
            "paper_url": landing_page_url,
            "pdf_url": pdf_url,
            "open_access": bool(
                (work.get("open_access") or {}).get("is_oa")
            ),
            "publisher": source.get("host_organization_name") or source.get("display_name"),
            "citation_count": work.get("cited_by_count"),
            "openalex_url": work.get("id"),
        }

    @staticmethod
    def _reconstruct_abstract(
        inverted_index: dict[str, list[int]] | None,
    ) -> str | None:
        """
        OpenAlex stores abstracts as an inverted index.

        Convert it back into normal readable text.
        """

        if not inverted_index:
            return None

        words: list[tuple[int, str]] = []

        for word, positions in inverted_index.items():
            for position in positions:
                words.append((position, word))

        words.sort(key=lambda item: item[0])

        return " ".join(word for _, word in words)