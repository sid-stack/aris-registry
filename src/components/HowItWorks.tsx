import React from "react";

/**
 * Re‑usable step component – keeps the markup tidy.
 */
function Step({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Lucide icon – explicit width/height prevents CLS */}
      <img
        src={`https://unpkg.com/lucide-static@latest/icons/${icon}.svg`}
        alt={title}
        className="w-12 h-12 mb-3"
        width={48}
        height={48}
      />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * Main "How it Works" section.
 * Use it anywhere: <HowItWorks />
 */
export default function HowItWorks() {
  return (
    <section className="w-full max-w-5xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        How It Works
      </h2>

      {/* Grid – 1‑column on mobile, 3‑column on md+ */}
      <div className="grid gap-6 md:grid-cols-3">
        <Step
          icon="search"
          title="Fetch the Solicitation"
          description="We automatically pull the latest RFP from SAM.gov or a provided URL – no manual upload required."
        />
        <Step
          icon="brain"
          title="AI‑Powered Analysis"
          description="Our diffusion‑based LLM parses the document, extracts key clauses, and builds a compliance matrix in seconds."
        />
        <Step
          icon="file-check"
          title="Instant Risk Report"
          description="A clean markdown report is generated, complete with executive summary, risk matrix, and actionable recommendations."
        />
      </div>

      {/* Optional call‑to‑action button */}
      <div className="mt-10 text-center">
        <a
          href="/demo"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg shadow-md transition-colors"
        >
          <img
            src="https://unpkg.com/lucide-static@latest/icons/play.svg"
            alt="Demo"
            className="w-5 h-5"
            width={20}
            height={20}
          />
          Try a Demo Report
        </a>
      </div>
    </section>
  );
}
