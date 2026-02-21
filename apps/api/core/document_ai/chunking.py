import hashlib
import re
from typing import Any, Callable, Dict, List


class IndustryStandardChunker:
    """
    Token-aware chunking with optional langchain/tiktoken integration.
    """

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._token_counter = self._build_token_counter()
        self._recursive_splitter = self._build_recursive_splitter()

    def chunk_elements(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks: list[dict[str, Any]] = []

        for source_index, element in enumerate(elements):
            text = (element.get("text") or "").strip()
            if not text:
                continue

            metadata = element.get("metadata", {})
            split = self._split_text(text)

            for chunk_index, value in enumerate(split):
                normalized = value.strip()
                if not normalized:
                    continue
                chunk_id = hashlib.md5(
                    f"{source_index}:{chunk_index}:{normalized}".encode("utf-8")
                ).hexdigest()
                chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "text": normalized,
                        "token_count": self.count_tokens(normalized),
                        "metadata": {
                            **metadata,
                            "source_index": source_index,
                            "chunk_index": chunk_index,
                            "strategy": "recursive",
                        },
                    }
                )

        return chunks

    def count_tokens(self, text: str) -> int:
        return self._token_counter(text)

    def _build_token_counter(self) -> Callable[[str], int]:
        try:
            import tiktoken  # type: ignore

            encoding = tiktoken.get_encoding("cl100k_base")
            return lambda text: len(encoding.encode(text))
        except Exception:
            return lambda text: max(1, len(text.split()))

    def _build_recursive_splitter(self):
        try:
            from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore

            return RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                length_function=self.count_tokens,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
                keep_separator=True,
            )
        except Exception:
            return None

    def _split_text(self, text: str) -> List[str]:
        if self._recursive_splitter:
            return self._recursive_splitter.split_text(text)

        sentences = re.split(r"(?<=[.!?])\s+", text)
        output: list[str] = []
        current: list[str] = []
        current_tokens = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            sentence_tokens = self.count_tokens(sentence)
            if current and current_tokens + sentence_tokens > self.chunk_size:
                output.append(" ".join(current))
                overlap_tokens = 0
                overlap: list[str] = []
                for value in reversed(current):
                    value_tokens = self.count_tokens(value)
                    if overlap_tokens + value_tokens > self.chunk_overlap:
                        break
                    overlap.insert(0, value)
                    overlap_tokens += value_tokens
                current = overlap + [sentence]
                current_tokens = overlap_tokens + sentence_tokens
            else:
                current.append(sentence)
                current_tokens += sentence_tokens

        if current:
            output.append(" ".join(current))

        return output or [text]
