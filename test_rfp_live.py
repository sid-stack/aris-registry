"""
Quick test — sends the NATO RFP text directly to /analyze
as a synthetic PDF so we can verify Gemini is working end-to-end.
Run from aris-core root: python test_rfp_live.py
"""

import requests
import json
import io

# ── The real SAM.gov RFP text ──────────────────────────────────────────────
RFP_TEXT = """
NATO Business Opportunity: COTS IT Hardware and Associated Support – Server and Storage Equipment
Indefinite Delivery, Indefinite Quantity (IDIQ) Framework

Notice ID: IFB-CO-424340-e-FIT
Contract Opportunity Type: Special Notice
Response Date: Apr 15, 2026 5:00 PM EDT
Published Date: Feb 16, 2026 10:04 AM EST
Department/Ind. Agency: COMMERCE, DEPARTMENT OF
Sub-tier: BUREAU OF INDUSTRY AND SECURITY
NAICS Code: 541519 - Other Computer Related Services

DESCRIPTION:
The NATO Communications and Information Agency (NCIA) intends to issue an Invitation for Bid (IFB)
for an Indefinite Delivery, Indefinite Quantity (IDIQ) Framework agreement for COTS IT Hardware and
Associated Support - Server and Storage Equipment.

The Enterprise Frequent and Swift Transaction (e-FAST) Contracts Program is an NCIA Strategic
Sourcing Initiative to offer best in class NATO-wide contract vehicles to meet requirements for
common goods and services.

SUMMARY OF REQUIREMENT:
The e-FIT IT equipment IFB will establish one IDIQ Delivery Order Contract for IT Server and Storage
Equipment for use at a NATO Enterprise Level and allows for multiple funding sources such as NSIP,
MB, and 3rd Party purchases.

The scope of work will cover hardware, software, and licenses for server and storage systems.
The scope will additionally include all associated accessories and sub-components, such as cables,
SFPs, storage media, batteries, and power supplies, together with applicable warranty and support
services. When applicable, TEMPEST-certified equipment (SDIP-27/3), including certification
corresponding to the required TEMPEST level, may be requested.

The scope may require the provision of technicians and/or engineers at designated locations to
support installation activities. Should execution of the proposed Contract require Contractor
personnel to access and work at NATO Class II security areas, these individuals will need to hold
personnel security clearances of NATO SECRET.

The Proposed Contract will provide equipment to all authorized NATO Command Locations in Europe,
North America and Turkiye; as well as, to any eligible Third Parties or any Nation which has
requested NCIA involvement.

The Proposed Contract is envisioned to include various performance options, in terms of volume
discounts against published Original Equipment Manufacturer (OEM) commercial pricelist/commercial
catalogue pricing, expedited deliveries, and support.

Period of performance is anticipated to be five years from the contract award date or until the
maximum ceiling is reached, whichever occurs first.

Funding obligation shall occur at the time a task order is placed against the IDIQ contract.

IMPORTANT DATES:
- Request a DOE: April 15, 2026
- NCIA distributes the IFB (planned): Q2 2026
- Bid closing (anticipated): Q2 2026
- Contract Award (estimated): Q2 2026

Primary Contact: Lee Ann Carpenter
Email: leeann.carpenter@bis.doc.gov
"""

def make_fake_pdf(text: str) -> bytes:
    """
    Build a minimal but valid PDF containing the RFP text.
    No external libraries needed — hand-crafted PDF structure.
    """
    # Escape text for PDF stream
    safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\n", "\\n")

    stream = f"BT /F1 10 Tf 50 750 Td ({safe}) Tj ET"
    stream_bytes = stream.encode("latin-1", errors="replace")

    objects = []

    # Object 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # Object 2: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # Object 3: Page
    objects.append(
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R "
        b"/MediaBox [0 0 612 792] "
        b"/Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
    )
    # Object 4: Content stream
    stream_header = f"<< /Length {len(stream_bytes)} >>\n".encode()
    objects.append(b"4 0 obj\n" + stream_header + b"stream\n" + stream_bytes + b"\nendstream\nendobj\n")
    # Object 5: Font
    objects.append(
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    )

    # Build body and xref
    header = b"%PDF-1.4\n"
    body = b""
    offsets = []
    pos = len(header)
    for obj in objects:
        offsets.append(pos)
        body += obj
        pos += len(obj)

    xref_offset = len(header) + len(body)
    xref = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for off in offsets:
        xref += f"{off:010d} 00000 n \n"

    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    )

    return header + body + xref.encode() + trailer.encode()


def main():
    url = "http://localhost:8000/analyze"
    print(f"🚀 Sending NATO RFP to {url}...\n")

    pdf_bytes = make_fake_pdf(RFP_TEXT)
    print(f"📄 Synthetic PDF: {len(pdf_bytes):,} bytes, starts with: {pdf_bytes[:8]}")

    files = {"file": ("nato_rfp.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    try:
        resp = requests.post(url, files=files, timeout=60)
        print(f"📡 HTTP {resp.status_code}\n")

        if resp.status_code == 200:
            data = resp.json()
            print("=" * 55)
            print(f"  Project:     {data['project_title']}")
            print(f"  Agency:      {data['agency']}")
            print(f"  Value:       {data['est_value']}")
            print(f"  Deadline:    {data['deadline']}")
            print(f"  Win Prob:    {data['win_probability']}")
            print(f"  Match Score: {data['match_score']}")
            print(f"\n  Summary:\n  {data['exec_summary']}")
            print("=" * 55)
        else:
            print(f"❌ Error: {resp.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect — is the backend running on port 8000?")
        print("   Run: python -m uvicorn registry.main:app --reload --port 8000")


if __name__ == "__main__":
    main()
