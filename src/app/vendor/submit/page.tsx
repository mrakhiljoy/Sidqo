"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SubmitForm() {
  const params = useSearchParams();
  const vendorId = params.get("vendorId") || "";
  const jobId = params.get("jobId") || "";
  const token = params.get("token") || "";

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const fd = new FormData();
      fd.append("vendorId", vendorId);
      fd.append("jobId", jobId);
      fd.append("token", token);
      fd.append("file", file);
      const res = await fetch("/api/translate/vendor/submit", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (!vendorId || !jobId || !token) {
    return (
      <div className="p-8 text-red-400">
        Invalid link. Please use the link from your assignment email.
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Submission received</h1>
        <p className="text-neutral-300">
          Thanks. The customer has been notified automatically. You can close
          this tab.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Submit translation</h1>
      <p className="text-neutral-400 mb-6 text-sm">
        Job ID: <span className="font-mono">{jobId.slice(0, 8)}…</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-neutral-300"
          required
        />
        <button
          type="submit"
          disabled={!file || status === "uploading"}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded text-white"
        >
          {status === "uploading" ? "Uploading…" : "Submit translation"}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>
    </div>
  );
}

export default function VendorSubmitPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <SubmitForm />
    </Suspense>
  );
}
