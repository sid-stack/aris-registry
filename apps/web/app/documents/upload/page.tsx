"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type UploadResponse = {
    document_id: string;
    status: string;
    chunk_count?: number;
    message?: string;
    error?: string;
};

type StatusResponse = {
    document_id: string;
    status: string;
    chunk_count?: number;
    error?: string;
};

export default function DocumentUploadPage() {
    const { getToken } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [namespace, setNamespace] = useState("default");
    const [documentId, setDocumentId] = useState("");
    const [uploadState, setUploadState] = useState<UploadResponse | null>(null);
    const [statusState, setStatusState] = useState<StatusResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [error, setError] = useState("");

    const canUpload = useMemo(() => Boolean(file) && !loading, [file, loading]);

    async function upload(e: FormEvent) {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError("");
        setUploadState(null);
        setStatusState(null);

        try {
            const token = await getToken();
            const form = new FormData();
            form.append("file", file);
            form.append("namespace", namespace);

            const response = await fetch("/api/documents/upload", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: form,
            });

            const data = (await response.json()) as UploadResponse;
            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setUploadState(data);
            setDocumentId(data.document_id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setLoading(false);
        }
    }

    async function refreshStatus() {
        if (!documentId) return;

        setStatusLoading(true);
        setError("");
        try {
            const token = await getToken();
            const response = await fetch(
                `/api/documents/upload?documentId=${encodeURIComponent(documentId)}`,
                {
                    method: "GET",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            const data = (await response.json()) as StatusResponse;
            if (!response.ok) {
                throw new Error(data.error || "Status request failed");
            }
            setStatusState(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Status request failed");
        } finally {
            setStatusLoading(false);
        }
    }

    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="mb-6 text-3xl font-semibold">Document Upload</h1>

            <form className="space-y-4 rounded-lg border p-6" onSubmit={upload}>
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="namespace">
                        Namespace
                    </label>
                    <input
                        id="namespace"
                        value={namespace}
                        onChange={(event) => setNamespace(event.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="default"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="file">
                        PDF File
                    </label>
                    <input
                        id="file"
                        type="file"
                        accept="application/pdf"
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                        className="w-full text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!canUpload}
                    className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                    {loading ? "Uploading..." : "Upload & Process"}
                </button>
            </form>

            {uploadState && (
                <section className="mt-6 rounded-lg border p-4 text-sm">
                    <p>Document: {uploadState.document_id}</p>
                    <p>Status: {uploadState.status}</p>
                    {typeof uploadState.chunk_count === "number" && (
                        <p>Chunks: {uploadState.chunk_count}</p>
                    )}
                </section>
            )}

            {documentId && (
                <section className="mt-4 rounded-lg border p-4 text-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <p>Track document: {documentId}</p>
                        <button
                            type="button"
                            onClick={refreshStatus}
                            disabled={statusLoading}
                            className="rounded-md border px-3 py-1.5 text-xs"
                        >
                            {statusLoading ? "Refreshing..." : "Refresh status"}
                        </button>
                    </div>
                    {statusState && (
                        <div className="space-y-1">
                            <p>Status: {statusState.status}</p>
                            {typeof statusState.chunk_count === "number" && (
                                <p>Chunks: {statusState.chunk_count}</p>
                            )}
                            {statusState.error && <p>Error: {statusState.error}</p>}
                        </div>
                    )}
                </section>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </main>
    );
}
