"""
DAMN Report PDF Generator — BidSmith Intelligence Brief
9-page institutional report. ReportLab-based.
"""

from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT


# ─── Palette ──────────────────────────────────────────────────────────────────

NAVY       = colors.HexColor("#002244")
SLATE      = colors.HexColor("#0f172a")
BLUE       = colors.HexColor("#0B3D91")
GREEN      = colors.HexColor("#16a34a")
AMBER      = colors.HexColor("#d97706")
RED        = colors.HexColor("#dc2626")
PURPLE     = colors.HexColor("#7c3aed")
LIGHT_GRAY = colors.HexColor("#f1f5f9")
MID_GRAY   = colors.HexColor("#64748b")
BORDER     = colors.HexColor("#e2e8f0")
WHITE      = colors.white


def _score_color(score: int):
    if score >= 75: return GREEN
    if score >= 55: return BLUE
    if score >= 35: return AMBER
    return RED


def _rec_color(rec: str):
    if rec == "BID": return GREEN
    if rec == "NO-BID": return RED
    return AMBER


def _styles():
    base = getSampleStyleSheet()
    custom = {
        "cover_title": ParagraphStyle("cover_title", fontSize=28, fontName="Helvetica-Bold",
                                       textColor=WHITE, leading=34, spaceAfter=8),
        "cover_sub":   ParagraphStyle("cover_sub", fontSize=13, fontName="Helvetica",
                                       textColor=colors.HexColor("#94a3b8"), leading=18),
        "cover_meta":  ParagraphStyle("cover_meta", fontSize=10, fontName="Helvetica",
                                       textColor=colors.HexColor("#cbd5e1"), leading=14),
        "section_hdr": ParagraphStyle("section_hdr", fontSize=9, fontName="Helvetica-Bold",
                                       textColor=MID_GRAY, spaceBefore=18, spaceAfter=8,
                                       letterSpacing=1.5),
        "body":        ParagraphStyle("body", fontSize=10, fontName="Helvetica",
                                       textColor=SLATE, leading=15, spaceAfter=6),
        "body_bold":   ParagraphStyle("body_bold", fontSize=10, fontName="Helvetica-Bold",
                                       textColor=SLATE, leading=15, spaceAfter=4),
        "small":       ParagraphStyle("small", fontSize=8, fontName="Helvetica",
                                       textColor=MID_GRAY, leading=12),
        "risk_high":   ParagraphStyle("risk_high", fontSize=9, fontName="Helvetica-Bold", textColor=RED),
        "risk_med":    ParagraphStyle("risk_med",  fontSize=9, fontName="Helvetica-Bold", textColor=AMBER),
        "risk_low":    ParagraphStyle("risk_low",  fontSize=9, fontName="Helvetica-Bold", textColor=GREEN),
        "verdict":     ParagraphStyle("verdict", fontSize=32, fontName="Helvetica-Bold",
                                       textColor=WHITE, leading=38),
        "mono":        ParagraphStyle("mono", fontSize=9, fontName="Courier",
                                       textColor=SLATE, leading=13),
    }
    # StyleSheet1 is not a plain dict — skip merging base styles to avoid AttributeError
    return custom


# ─── Cover page ───────────────────────────────────────────────────────────────

def _cover_page(story, styles, data):
    rfp = data.get("rfp", {})
    company = data.get("company", {})
    score = data.get("score", {})
    rec = score.get("match_label", "MODERATE")
    win_prob = data.get("win_probability", 50)
    recommendation = data.get("recommendation", "CONDITIONAL")

    # Dark cover block
    cover_table = Table(
        [[Paragraph("BIDSMITH", ParagraphStyle("bs", fontSize=11, fontName="Helvetica-Bold",
                                                textColor=colors.HexColor("#94a3b8"), letterSpacing=3)),
          Paragraph("INTELLIGENCE BRIEF", ParagraphStyle("ib", fontSize=11, fontName="Helvetica-Bold",
                                                          textColor=colors.HexColor("#94a3b8"), letterSpacing=2,
                                                          alignment=TA_RIGHT))]],
        colWidths=[3.5*inch, 3.5*inch],
        style=TableStyle([("BACKGROUND", (0,0), (-1,-1), NAVY),
                          ("PADDING", (0,0), (-1,-1), 14),
                          ("VALIGN", (0,0), (-1,-1), "MIDDLE")])
    )
    story.append(cover_table)
    story.append(Spacer(1, 0.3*inch))

    # Solicitation title
    story.append(Paragraph(rfp.get("agency", "Federal Agency").upper(), styles["section_hdr"]))
    story.append(Paragraph(rfp.get("title", "Federal Solicitation"), styles["cover_title"]))
    story.append(Spacer(1, 0.1*inch))

    # Metadata row
    meta_items = []
    if rfp.get("solicitation_number"):
        meta_items.append(rfp["solicitation_number"])
    if rfp.get("naics_code"):
        meta_items.append(f"NAICS {rfp['naics_code']}")
    if rfp.get("value_max"):
        v = rfp["value_max"]
        meta_items.append(f"${v/1_000_000:.1f}M ceiling" if v >= 1_000_000 else f"${v:,}")
    if rfp.get("due_date"):
        meta_items.append(f"Due: {rfp['due_date']}")

    story.append(Paragraph(" · ".join(meta_items), styles["body"]))
    story.append(Spacer(1, 0.4*inch))
    story.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    story.append(Spacer(1, 0.3*inch))

    # Score + Verdict row
    rec_color = _rec_color(recommendation)
    score_color = _score_color(score.get("total", 50))

    score_table = Table(
        [[
            Paragraph(f"{win_prob}%", ParagraphStyle("wp", fontSize=48, fontName="Helvetica-Bold",
                                                      textColor=score_color, leading=54)),
            Paragraph(recommendation, ParagraphStyle("rec", fontSize=36, fontName="Helvetica-Bold",
                                                      textColor=rec_color, leading=42)),
        ]],
        colWidths=[2.5*inch, 4.5*inch],
        style=TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 0),
        ])
    )
    story.append(score_table)
    story.append(Paragraph("WIN PROBABILITY                    RECOMMENDATION", styles["small"]))
    story.append(Spacer(1, 0.3*inch))

    # Basis
    summary = data.get("summary", "")
    if summary:
        story.append(Paragraph("BASIS FOR RECOMMENDATION", styles["section_hdr"]))
        story.append(Paragraph(summary, styles["body"]))
        story.append(Spacer(1, 0.2*inch))

    # Prepared for
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 0.1*inch))
    footer_table = Table(
        [[
            Paragraph(f"Prepared for: {company.get('name', 'Your Company')}", styles["small"]),
            Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y')}",
                      ParagraphStyle("date", fontSize=8, fontName="Helvetica", textColor=MID_GRAY, alignment=TA_RIGHT)),
        ]],
        colWidths=[4*inch, 3*inch],
        style=TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE")])
    )
    story.append(footer_table)
    story.append(PageBreak())


# ─── Score Breakdown page ─────────────────────────────────────────────────────

def _score_page(story, styles, data):
    score = data.get("score", {})

    story.append(Paragraph("SCORE BREAKDOWN", styles["section_hdr"]))
    story.append(Paragraph(f"BidSmith Score: {score.get('total', 0)}/100 — {score.get('match_label', 'MODERATE')}", styles["body_bold"]))
    story.append(Spacer(1, 0.15*inch))

    categories = [
        ("NAICS Match",         score.get("naics_match", 0),        25),
        ("Agency Familiarity",  score.get("agency_familiarity", 0),  15),
        ("Set-Aside Fit",       score.get("set_aside_fit", 0),       15),
        ("Cert Match",          score.get("cert_match", 0),          15),
        ("Value Fit",           score.get("value_fit", 0),           10),
        ("Timeline Fit",        score.get("timeline_fit", 0),        10),
        ("Incumbent Penalty",   score.get("incumbent_penalty", 0),    0),
    ]

    for label, pts, max_pts in categories:
        pct = abs(pts) / max_pts if max_pts > 0 else 0
        bar_color = RED if pts < 0 else (_score_color(int(pct * 100)))
        pts_label = f"{pts:+d}" if pts < 0 else f"{pts}/{max_pts}"

        row = Table(
            [[
                Paragraph(label, styles["small"]),
                Table(
                    [[""]],
                    colWidths=[max(0.1*inch, pct * 3.5*inch)],
                    rowHeights=[0.16*inch],
                    style=TableStyle([("BACKGROUND", (0,0), (0,0), bar_color),
                                      ("ROUNDEDCORNERS", [3])])
                ),
                Paragraph(pts_label, ParagraphStyle("pts", fontSize=9, fontName="Helvetica-Bold",
                                                     textColor=bar_color, alignment=TA_RIGHT)),
            ]],
            colWidths=[1.8*inch, 4*inch, 0.7*inch],
            style=TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                              ("BOTTOMPADDING", (0,0), (-1,-1), 6)])
        )
        story.append(row)

    story.append(Spacer(1, 0.2*inch))

    # Why it matches
    why = score.get("why_matches", [])
    if why:
        story.append(Paragraph("WHY IT MATCHES", styles["section_hdr"]))
        for w in why:
            story.append(Paragraph(f"✓  {w}", styles["body"]))

    story.append(Spacer(1, 0.15*inch))

    # Gaps
    gaps = score.get("gaps", [])
    if gaps:
        story.append(Paragraph("GAPS TO ADDRESS", styles["section_hdr"]))
        for g in gaps:
            story.append(Paragraph(f"⚠  {g}", styles["risk_high"]))

    story.append(PageBreak())


# ─── Incumbent & Competitive Intelligence page ────────────────────────────────

def _incumbent_page(story, styles, data):
    inc = data.get("incumbent_signal", {})
    score = inc.get("score", 0)
    label = inc.get("label", "LOW")
    color = {"LOW": GREEN, "MODERATE": AMBER, "HIGH": RED, "CRITICAL": PURPLE}.get(label, AMBER)

    story.append(Paragraph("INCUMBENT & COMPETITIVE INTELLIGENCE", styles["section_hdr"]))

    inc_table = Table(
        [[
            Paragraph(f"{score}/10", ParagraphStyle("iscore", fontSize=36, fontName="Helvetica-Bold",
                                                      textColor=color, leading=42)),
            Paragraph(f"{label} INCUMBENT RISK\n\n{inc.get('explanation', '')}", styles["body"]),
        ]],
        colWidths=[1.2*inch, 5.8*inch],
        style=TableStyle([("VALIGN", (0,0), (-1,-1), "TOP")])
    )
    story.append(inc_table)
    story.append(Spacer(1, 0.15*inch))

    signals = inc.get("signals_detected", [])
    if signals:
        story.append(Paragraph("SIGNAL SCAN", styles["section_hdr"]))
        rows = [["Signal", "Detected", "Evidence"]]
        for s in signals:
            rows.append([
                Paragraph(s.get("signal", ""), styles["small"]),
                "YES" if s.get("found") else "no",
                Paragraph(s.get("evidence", "—"), styles["small"]),
            ])
        tbl = Table(rows, colWidths=[2*inch, 0.6*inch, 4.4*inch])
        tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (-1,0), NAVY),
            ("TEXTCOLOR",    (0,0), (-1,0), WHITE),
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
            ("GRID",         (0,0), (-1,-1), 0.5, BORDER),
            ("VALIGN",       (0,0), (-1,-1), "TOP"),
            ("PADDING",      (0,0), (-1,-1), 6),
        ]))
        story.append(tbl)

    story.append(PageBreak())


# ─── Compliance Matrix page ───────────────────────────────────────────────────

def _compliance_page(story, styles, data):
    requirements = data.get("requirements", [])
    compliance_flags = data.get("compliance_flags", [])

    story.append(Paragraph("COMPLIANCE MATRIX", styles["section_hdr"]))
    story.append(Paragraph(f"{len(requirements)} requirements extracted. Disqualifiers flagged.", styles["body"]))
    story.append(Spacer(1, 0.1*inch))

    if requirements:
        rows = [["ID", "Requirement", "Section", "Risk", "DQ", "Action"]]
        for r in requirements[:15]:  # Cap at 15 for PDF readability
            risk = r.get("risk", r.get("category", "MED"))
            rows.append([
                Paragraph(r.get("id", ""), styles["mono"]),
                Paragraph(r.get("text", r.get("requirement", ""))[:120], styles["small"]),
                r.get("section", "—"),
                risk,
                "✗" if r.get("is_disqualifier") else "",
                Paragraph(r.get("action_required", r.get("action", ""))[:80], styles["small"]),
            ])

        tbl = Table(rows, colWidths=[0.6*inch, 2.8*inch, 0.7*inch, 0.5*inch, 0.3*inch, 2.1*inch])
        risk_styles = [
            ("BACKGROUND", (0,0), (-1,0), NAVY),
            ("TEXTCOLOR",  (0,0), (-1,0), WHITE),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("GRID",       (0,0), (-1,-1), 0.5, BORDER),
            ("VALIGN",     (0,0), (-1,-1), "TOP"),
            ("PADDING",    (0,0), (-1,-1), 5),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ]
        for i, row_data in enumerate(rows[1:], start=1):
            risk_val = row_data[3]
            if risk_val == "HIGH":
                risk_styles.append(("TEXTCOLOR", (3,i), (3,i), RED))
            elif risk_val == "MED":
                risk_styles.append(("TEXTCOLOR", (3,i), (3,i), AMBER))
        tbl.setStyle(TableStyle(risk_styles))
        story.append(tbl)
        story.append(Spacer(1, 0.2*inch))

    # FAR/DFARS Flags
    if compliance_flags:
        story.append(Paragraph("FAR/DFARS FLAGS", styles["section_hdr"]))
        flag_rows = [["Clause", "Title", "Risk", "Company Status", "Action"]]
        for f in compliance_flags:
            flag_rows.append([
                Paragraph(f.get("clause", ""), styles["mono"]),
                Paragraph(f.get("title", ""), styles["small"]),
                f.get("risk", "MED"),
                f.get("company_status", "UNKNOWN"),
                Paragraph(f.get("action", "")[:80], styles["small"]),
            ])
        flag_tbl = Table(flag_rows, colWidths=[0.8*inch, 1.8*inch, 0.5*inch, 0.8*inch, 3.1*inch])
        flag_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), SLATE),
            ("TEXTCOLOR",  (0,0), (-1,0), WHITE),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("GRID",       (0,0), (-1,-1), 0.5, BORDER),
            ("VALIGN",     (0,0), (-1,-1), "TOP"),
            ("PADDING",    (0,0), (-1,-1), 5),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ]))
        story.append(flag_tbl)

    story.append(PageBreak())


# ─── Gap Analysis page ────────────────────────────────────────────────────────

def _gap_page(story, styles, data):
    gap_analysis = data.get("gap_analysis", {})

    story.append(Paragraph("WIN-GAP ANALYSIS", styles["section_hdr"]))
    story.append(Paragraph(
        f"Recommendation: {gap_analysis.get('go_recommendation', 'CONDITIONAL')}  |  "
        f"Win theme: {gap_analysis.get('win_theme', '')}",
        styles["body"]
    ))
    story.append(Spacer(1, 0.15*inch))

    hard_gaps = gap_analysis.get("hard_gaps", [])
    soft_gaps = gap_analysis.get("soft_gaps", [])

    if hard_gaps:
        story.append(Paragraph("HARD GAPS — Must resolve before bidding", styles["section_hdr"]))
        for g in hard_gaps:
            g_table = Table(
                [[
                    Paragraph(f"[{g.get('category', 'Gap').upper()}]", styles["risk_high"]),
                    Paragraph(g.get("description", ""), styles["body_bold"]),
                ]],
                colWidths=[1.0*inch, 6.0*inch],
                style=TableStyle([
                    ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#fff5f5")),
                    ("LINEBELOW",  (0,0), (-1,-1), 1, colors.HexColor("#fca5a5")),
                    ("PADDING",    (0,0), (-1,-1), 8),
                    ("VALIGN",     (0,0), (-1,-1), "TOP"),
                ])
            )
            story.append(g_table)
            story.append(Paragraph(
                f"Time to close: {g.get('time_to_close', '—')}   |   Cost: {g.get('cost_to_close', '—')}",
                styles["small"]
            ))
            if g.get("teaming_strategy"):
                story.append(Paragraph(f"Teaming: {g['teaming_strategy']}", styles["small"]))
            story.append(Spacer(1, 0.1*inch))

    if soft_gaps:
        story.append(Paragraph("SOFT GAPS — Address in proposal", styles["section_hdr"]))
        for g in soft_gaps:
            story.append(Paragraph(f"•  {g.get('description', '')}", styles["body"]))

    if gap_analysis.get("teaming_required"):
        story.append(Spacer(1, 0.15*inch))
        story.append(Paragraph("TEAMING STRATEGY", styles["section_hdr"]))
        story.append(Paragraph(gap_analysis.get("teaming_rationale", ""), styles["body"]))

    story.append(PageBreak())


# ─── Proposal Roadmap page ────────────────────────────────────────────────────

def _roadmap_page(story, styles, data):
    roadmap = data.get("proposal_roadmap", [])
    eval_type = data.get("evaluation_type", "Unknown")
    eval_reality = data.get("evaluation_reality", "")

    story.append(Paragraph("EVALUATION INTELLIGENCE + PROPOSAL ROADMAP", styles["section_hdr"]))
    story.append(Paragraph(f"Evaluation type: {eval_type}", styles["body_bold"]))
    if eval_reality:
        story.append(Paragraph(eval_reality, styles["body"]))
    story.append(Spacer(1, 0.15*inch))

    if roadmap:
        rows = [["Section", "Pages", "Focus Areas", "Lead Discriminator"]]
        for r in roadmap:
            focus = ", ".join(r.get("focus_areas", [])[:2]) if isinstance(r.get("focus_areas"), list) else str(r.get("focus_areas", ""))
            rows.append([
                Paragraph(r.get("section", ""), styles["body_bold"]),
                r.get("recommended_pages", "—"),
                Paragraph(focus, styles["small"]),
                Paragraph(r.get("discriminator", ""), styles["small"]),
            ])

        tbl = Table(rows, colWidths=[1.6*inch, 0.8*inch, 2.6*inch, 2*inch])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), BLUE),
            ("TEXTCOLOR",  (0,0), (-1,0), WHITE),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 9),
            ("GRID",       (0,0), (-1,-1), 0.5, BORDER),
            ("VALIGN",     (0,0), (-1,-1), "TOP"),
            ("PADDING",    (0,0), (-1,-1), 7),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ]))
        story.append(tbl)

    story.append(PageBreak())


# ─── Main generator ───────────────────────────────────────────────────────────

def generate(report_data: dict) -> bytes:
    """
    Generate the full DAMN Report PDF.
    report_data keys: rfp, company, score, gap_analysis, requirements,
                      compliance_flags, incumbent_signal, proposal_roadmap,
                      evaluation_type, evaluation_reality, summary,
                      recommendation, win_probability
    Returns bytes (PDF).
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.85*inch,
        rightMargin=0.85*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
    )

    styles = _styles()
    story = []

    _cover_page(story, styles, report_data)
    _score_page(story, styles, report_data)
    _incumbent_page(story, styles, report_data)
    _compliance_page(story, styles, report_data)
    _gap_page(story, styles, report_data)
    _roadmap_page(story, styles, report_data)

    doc.build(story)
    return buffer.getvalue()
