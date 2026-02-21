import logging
import os
from typing import Any, Dict, List

logger = logging.getLogger("aris.document_ai.processor")


class EnterprisePDFProcessor:
    """
    Provider-aware PDF extraction with safe fallbacks.
    Priority: unstructured -> llamaparse -> pypdf.
    """

    def __init__(self, strategy: str | None = None):
        self.strategy = (strategy or os.getenv("PDF_PROCESSOR", "auto")).lower()
        self.unstructured_strategy = os.getenv("UNSTRUCTURED_STRATEGY", "hi_res")
        self.llama_parse_key = os.getenv("LLAMA_CLOUD_API_KEY")

    def extract(self, pdf_path: str) -> List[Dict[str, Any]]:
        providers = self._provider_order()
        errors: list[str] = []

        for provider in providers:
            try:
                extractor = getattr(self, f"_extract_{provider}")
                elements = extractor(pdf_path)
                if elements:
                    logger.info(
                        "Document extracted with provider=%s elements=%s",
                        provider,
                        len(elements),
                    )
                    return elements
            except Exception as exc:  # noqa: BLE001
                message = f"{provider}: {exc}"
                errors.append(message)
                logger.warning("Provider failed: %s", message)

        raise RuntimeError("All PDF extraction providers failed: " + " | ".join(errors))

    def _provider_order(self) -> List[str]:
        if self.strategy in {"unstructured", "llamaparse", "pypdf"}:
            return [self.strategy]
        return ["unstructured", "llamaparse", "pypdf"]

    def _extract_unstructured(self, pdf_path: str) -> List[Dict[str, Any]]:
        from unstructured.partition.pdf import partition_pdf  # type: ignore

        elements = partition_pdf(
            filename=pdf_path,
            strategy=self.unstructured_strategy,
            extract_images_in_pdf=False,
            infer_table_structure=True,
        )

        output: list[dict[str, Any]] = []
        for element in elements:
            text = str(element).strip()
            if not text:
                continue

            metadata = getattr(element, "metadata", None)
            output.append(
                {
                    "text": text,
                    "metadata": {
                        "provider": "unstructured",
                        "type": type(element).__name__,
                        "page_number": getattr(metadata, "page_number", None),
                        "filename": getattr(metadata, "filename", None),
                        "category": getattr(element, "category", None),
                    },
                }
            )

        if not output:
            raise RuntimeError("Unstructured returned no text")
        return output

    def _extract_llamaparse(self, pdf_path: str) -> List[Dict[str, Any]]:
        if not self.llama_parse_key:
            raise RuntimeError("LLAMA_CLOUD_API_KEY is not configured")

        from llama_parse import LlamaParse  # type: ignore

        parser = LlamaParse(
            api_key=self.llama_parse_key,
            result_type="markdown",
            language="en",
        )
        documents = parser.load_data(pdf_path)
        output: list[dict[str, Any]] = []

        for doc in documents:
            text = getattr(doc, "text", "").strip()
            if not text:
                continue
            output.append(
                {
                    "text": text,
                    "metadata": {
                        "provider": "llamaparse",
                        "type": "markdown",
                        "raw_metadata": getattr(doc, "metadata", {}),
                    },
                }
            )

        if not output:
            raise RuntimeError("LlamaParse returned no text")
        return output

    def _extract_pypdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        import pypdf

        reader = pypdf.PdfReader(pdf_path)
        output: list[dict[str, Any]] = []

        for index, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if not text:
                continue
            output.append(
                {
                    "text": text,
                    "metadata": {
                        "provider": "pypdf",
                        "type": "page",
                        "page_number": index,
                    },
                }
            )

        if not output:
            raise RuntimeError("pypdf returned no text")
        return output
