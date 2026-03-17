import "./GovernmentBanner.css";

const DATA_SOURCES = [
  { name: "SAM.gov", detail: "federal opportunities" },
  { name: "USAspending.gov", detail: "award intelligence" },
  { name: "Grants.gov", detail: "grant notices" },
  { name: "GSA eLibrary", detail: "schedule metadata" },
  { name: "FPDS", detail: "historical contracts" },
  { name: "SEC EDGAR", detail: "entity filings" },
  { name: "Census API", detail: "NAICS and market context" },
];

function SourceChip({ name, detail }) {
  return (
    <div className="credibility-chip">
      <span className="credibility-chip-name">{name}</span>
      <span className="credibility-chip-separator">/</span>
      <span className="credibility-chip-detail">{detail}</span>
    </div>
  );
}

export default function GovernmentBanner() {
  return (
    <section className="credibility-strip" aria-label="Public data sources used by ARIS workflows">
      <div className="credibility-strip-heading">
        Built with public procurement data from
      </div>
      <div className="credibility-strip-marquee">
        <div className="credibility-strip-track">
          {DATA_SOURCES.map((source) => (
            <SourceChip key={source.name} {...source} />
          ))}
          {DATA_SOURCES.map((source) => (
            <SourceChip key={`${source.name}-duplicate`} {...source} />
          ))}
        </div>
      </div>
    </section>
  );
}
