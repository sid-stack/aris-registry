from pathlib import Path

from fpdf import FPDF

from apps.api.core.document_ai.chunking import IndustryStandardChunker
from apps.api.core.document_ai.processor import EnterprisePDFProcessor
from apps.api.core.document_ai.service import DocumentAIService


def test_chunker_generates_stable_chunks() -> None:
    chunker = IndustryStandardChunker(chunk_size=10, chunk_overlap=3)
    elements = [
        {
            "text": (
                "This is a long paragraph for testing chunk generation. "
                "It should split into multiple segments with overlap. "
                "Each segment should include metadata and a chunk id."
            ),
            "metadata": {"page_number": 1},
        }
    ]

    chunks = chunker.chunk_elements(elements)

    assert len(chunks) >= 2
    assert all(chunk["chunk_id"] for chunk in chunks)
    assert all(chunk["token_count"] > 0 for chunk in chunks)
    assert all(chunk["metadata"]["page_number"] == 1 for chunk in chunks)


def test_pypdf_extraction_reads_text(tmp_path: Path) -> None:
    pdf_path = tmp_path / "sample.pdf"

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, "RFP TITLE: Example Federal Solicitation")
    pdf.output(str(pdf_path))

    processor = EnterprisePDFProcessor(strategy="pypdf")
    output = processor.extract(str(pdf_path))

    assert output
    joined = " ".join(item["text"] for item in output)
    assert "Example Federal Solicitation" in joined


def test_embedding_is_deterministic() -> None:
    service = DocumentAIService()

    first = service.build_embedding("same text")
    second = service.build_embedding("same text")
    third = service.build_embedding("different text")

    assert len(first) == service.embedding_dim
    assert first == second
    assert first != third
    assert all(-1.0 <= value <= 1.0 for value in first)
