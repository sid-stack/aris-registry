import { sendEmail } from "../utils/mailer.js";
import { claimDailyJobRun, getTrafficBrief } from "./analytics.js";

const DEFAULT_TIMEZONE = process.env.TRAFFIC_BRIEF_TIMEZONE || "America/New_York";
const DEFAULT_HOUR = Number(process.env.TRAFFIC_BRIEF_HOUR || 8);
const DEFAULT_MINUTE = Number(process.env.TRAFFIC_BRIEF_MINUTE || 0);
const DASHBOARD_URL = process.env.TRAFFIC_BRIEF_URL || "https://www.bidsmith.pro/traffic-brief";
const ADMIN_URL = process.env.TRAFFIC_BRIEF_ADMIN_URL || "https://www.bidsmith.pro/admin";

const JOB_NAME = "daily_traffic_brief_email";

function getRecipients() {
  const raw = process.env.TRAFFIC_BRIEF_RECIPIENTS
    || process.env.CONTACT_TO
    || "sid@bidsmith.pro";
  return raw.split(",").map((email) => email.trim()).filter(Boolean);
}

function getZonedParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    dateKey: `${map.year}-${map.month}-${map.day}`,
  };
}

function renderTrendRows(rows = []) {
  if (!rows.length) {
    return `<tr><td colspan="5" style="padding:10px;border:1px solid #e2e8f0;color:#64748b">No trend data yet</td></tr>`;
  }
  return rows.map((row) => `
    <tr>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.day}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.visitors}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.pageviews}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.qualified}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.audits}</td>
    </tr>
  `).join("");
}

function renderTopPageRows(rows = [], emptyMessage = "No page data for this period") {
  if (!rows.length) {
    return `<tr><td colspan="3" style="padding:10px;border:1px solid #e2e8f0;color:#64748b">${emptyMessage}</td></tr>`;
  }
  return rows.map((row) => `
    <tr>
      <td style="padding:10px;border:1px solid #e2e8f0;font-family:ui-monospace, SFMono-Regular, Menlo, monospace">${row.path}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.pageviews}</td>
      <td style="padding:10px;border:1px solid #e2e8f0">${row.visitors}</td>
    </tr>
  `).join("");
}

function buildHealthSummary(summary = {}) {
  const qualified = Number(summary.qualified_yesterday || 0);
  const audits = Number(summary.audits_yesterday || 0);
  const visitors = Number(summary.visitors_yesterday || 0);
  const qualifiedRate = visitors > 0 ? (qualified / visitors) * 100 : 0;
  const auditRate = qualified > 0 ? (audits / qualified) * 100 : 0;

  const status = [];
  if (visitors === 0) status.push("No traffic yesterday");
  if (visitors > 0 && qualified === 0) status.push("Traffic did not reach qualified pages");
  if (qualified > 0 && audits === 0) status.push("Qualified traffic did not start audits");
  if (audits > 0) status.push("Audit funnel active");

  return {
    qualifiedRate: `${qualifiedRate.toFixed(1)}%`,
    auditRate: `${auditRate.toFixed(1)}%`,
    statusText: status.join(" | ") || "No signal yet",
  };
}

function buildHtml(brief) {
  const summary = brief.summary || {};
  const health = buildHealthSummary(summary);
  const generatedAt = brief.generated_at
    ? new Date(brief.generated_at).toLocaleString()
    : new Date().toLocaleString();

  return `
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:840px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a">
      <h1 style="margin:0 0 6px;font-size:24px">Daily Morning Traffic Brief</h1>
      <p style="margin:0 0 16px;color:#475569">Generated: ${generatedAt}</p>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700">Yesterday Visitors</div>
          <div style="font-size:28px;font-weight:900">${summary.visitors_yesterday || 0}</div>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700">Qualified Sessions</div>
          <div style="font-size:28px;font-weight:900">${summary.qualified_yesterday || 0}</div>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700">Audits Started</div>
          <div style="font-size:28px;font-weight:900">${summary.audits_yesterday || 0}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#1d4ed8;text-transform:uppercase;font-weight:700">Today Visitors (so far)</div>
          <div style="font-size:28px;font-weight:900;color:#1e3a8a">${summary.visitors_today ?? 0}</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#1d4ed8;text-transform:uppercase;font-weight:700">Today Pageviews</div>
          <div style="font-size:28px;font-weight:900;color:#1e3a8a">${summary.pageviews_today ?? 0}</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#1d4ed8;text-transform:uppercase;font-weight:700">Today Audits</div>
          <div style="font-size:28px;font-weight:900;color:#1e3a8a">${summary.audits_today ?? 0}</div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px">
        <h2 style="margin:0 0 8px;font-size:16px">Funnel Health</h2>
        <p style="margin:0;color:#334155">Qualified / Visitor: <strong>${health.qualifiedRate}</strong> | Audit / Qualified: <strong>${health.auditRate}</strong></p>
        <p style="margin:6px 0 0;color:#475569">${health.statusText}</p>
      </div>

      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px">
        <h2 style="margin:0 0 10px;font-size:16px">Top Pages Today (so far)</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Path</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Pageviews</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Visitors</th>
            </tr>
          </thead>
          <tbody>${renderTopPageRows(brief.top_pages_today || [], "No page data for today yet")}</tbody>
        </table>
      </div>

      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px">
        <h2 style="margin:0 0 10px;font-size:16px">Top Pages Yesterday</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Path</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Pageviews</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Visitors</th>
            </tr>
          </thead>
          <tbody>${renderTopPageRows(brief.top_pages_yesterday, "No page data for yesterday")}</tbody>
        </table>
      </div>

      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:16px">
        <h2 style="margin:0 0 10px;font-size:16px">7-Day Trend</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Day</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Visitors</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Pageviews</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Qualified</th>
              <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc">Audits</th>
            </tr>
          </thead>
          <tbody>${renderTrendRows(brief.trend_7d)}</tbody>
        </table>
      </div>

      <p style="margin:0;color:#475569">Open dashboards: <a href="${DASHBOARD_URL}">${DASHBOARD_URL}</a> | <a href="${ADMIN_URL}">${ADMIN_URL}</a></p>
    </div>
  `;
}

export async function sendTrafficBriefNow(trigger = "manual") {
  const recipients = getRecipients();
  const brief = await getTrafficBrief();
  if (brief.error) return { success: false, error: brief.error };
  const health = buildHealthSummary(brief.summary);

  const subject = `BidSmith Daily Traffic Brief — ${brief.summary?.visitors_yesterday || 0} visitors, ${brief.summary?.audits_yesterday || 0} audits`;
  const html = buildHtml(brief);
  const ok = await sendEmail({
    to: recipients.join(","),
    subject,
    html,
  });

  return {
    success: ok,
    recipients,
    trigger,
    summary: brief.summary || {},
    health,
  };
}

export function startTrafficBriefScheduler() {
  if (process.env.TRAFFIC_BRIEF_ENABLED === "false") {
    console.info("[TRAFFIC_BRIEF] scheduler disabled by env");
    return;
  }

  console.info("[TRAFFIC_BRIEF] scheduler started", {
    timezone: DEFAULT_TIMEZONE,
    hour: DEFAULT_HOUR,
    minute: DEFAULT_MINUTE,
    recipients: getRecipients(),
  });

  setInterval(async () => {
    try {
      const now = getZonedParts(new Date(), DEFAULT_TIMEZONE);
      if (now.hour !== DEFAULT_HOUR || now.minute !== DEFAULT_MINUTE) return;

      const claimed = await claimDailyJobRun(
        JOB_NAME,
        now.dateKey,
        { timezone: DEFAULT_TIMEZONE, trigger: "scheduler" },
      );

      if (!claimed) return;
      const result = await sendTrafficBriefNow("scheduler");
      if (!result.success) {
        console.warn("[TRAFFIC_BRIEF] send failed", result.error || "unknown error");
      } else {
        console.info("[TRAFFIC_BRIEF] sent", {
          visitors_yesterday: result.summary.visitors_yesterday,
          audits_yesterday: result.summary.audits_yesterday,
        });
      }
    } catch (err) {
      console.warn("[TRAFFIC_BRIEF] scheduler tick failed", err.message);
    }
  }, 60 * 1000);
}
