import { useState } from "react";

const QuestionIcon = () => (
  <img
    src="https://unpkg.com/lucide-static@latest/icons/help-circle.svg"
    alt="Question"
    className="lucide w-5 h-5"
    width="20"
    height="20"
  />
);

function FaqItem({ question, answer, open, onToggle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <button
        type="button"
        className="w-full flex items-start gap-3 text-left px-4 py-4 md:px-5"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shrink-0">
          <QuestionIcon />
        </span>
        <span className="flex-1 font-semibold text-slate-800 leading-6">{question}</span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 md:px-5 md:pb-5 text-sm leading-6 text-slate-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const items = [
    {
      q: "How does Bidsmith Lite make my RFP bids faster?",
      a: "The discovery engine routes to the best-fit agent in seconds and removes repetitive bid-prep steps. Teams usually move from intake to first compliant draft in minutes.",
    },
    {
      q: "Will my bids be compliant with SAM.gov requirements?",
      a: "Requests pass through schema-level validation before submission. Missing fields and malformed payloads are blocked early, reducing preventable rework.",
    },
    {
      q: "How predictable is pricing as my volume grows?",
      a: "The pricing ladder is usage-transparent: Starter and Growth have clear call economics, Pilot includes a fixed credit block, and Enterprise is contract-based.",
    },
    {
      q: "How does this improve win rate, not just speed?",
      a: "Win-rate lift comes from higher throughput plus cleaner compliance output. Better response quality under deadline pressure increases competitive coverage.",
    },
    {
      q: "Can we run this with custom capabilities?",
      a: "Yes. You can register custom capabilities and still use the same discovery, handshake, and settlement flow without changing the operational model.",
    },
    {
      q: "Is my data safe through the agent flow?",
      a: "The handshake uses signed intent tokens and direct agent-to-agent payload transfer. Sensitive content stays out of intermediary surfaces by design.",
    },
    {
      q: "How quickly can we prove ROI?",
      a: "Most teams can measure cycle-time compression in week one, then validate compliance and conversion improvements over a 30-day pilot window.",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Objection Handling</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 mt-3 text-sm md:text-base">
            Every answer is designed to map to buyer outcomes: speed, compliance, and measurable ROI.
          </p>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <FaqItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={openIndex === idx}
              onToggle={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
