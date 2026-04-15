/**
 * Minute-aligned scheduler (same pattern as traffic brief): Apollo pull, Instantly push, A/B rollup.
 * IST defaults: pull 07:00, push 07:30, A/B 07:45 — all disabled if OUTBOUND_AUTOMATION_ENABLED=false.
 */
import { claimDailyJobRun } from "../services/analytics.js";
import { calculateAbResults } from "./abResultsCalculator.js";
import { pullApolloLeads } from "./apolloPullLeads.js";
import { pushLeadsToInstantly } from "./instantlyPushLeads.js";

const TZ = process.env.OUTBOUND_SCHEDULER_TIMEZONE || process.env.TRAFFIC_BRIEF_TIMEZONE || "Asia/Kolkata";

function zonedParts(date = new Date(), timeZone = TZ) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    hour: Number(map.hour),
    minute: Number(map.minute),
    dateKey: `${map.year}-${map.month}-${map.day}`,
  };
}

function numEnv(name, fallback) {
  const v = parseInt(process.env[name] || String(fallback), 10);
  return Number.isNaN(v) ? fallback : v;
}

export function startOutboundScheduler() {
  if (process.env.OUTBOUND_AUTOMATION_ENABLED === "false") {
    console.info("[OUTBOUND] scheduler disabled by OUTBOUND_AUTOMATION_ENABLED=false");
    return;
  }

  const pullH = numEnv("OUTBOUND_APOLLO_HOUR", 7);
  const pullM = numEnv("OUTBOUND_APOLLO_MINUTE", 0);
  const pushH = numEnv("OUTBOUND_INSTANTLY_HOUR", 7);
  const pushM = numEnv("OUTBOUND_INSTANTLY_MINUTE", 30);
  const abH = numEnv("OUTBOUND_AB_HOUR", 7);
  const abM = numEnv("OUTBOUND_AB_MINUTE", 45);

  console.info("[OUTBOUND] scheduler started", {
    timezone: TZ,
    apollo: `${pullH}:${String(pullM).padStart(2, "0")}`,
    instantly: `${pushH}:${String(pushM).padStart(2, "0")}`,
    ab: `${abH}:${String(abM).padStart(2, "0")}`,
  });

  setInterval(async () => {
    try {
      const now = zonedParts(new Date(), TZ);
      const { dateKey } = now;

      if (now.hour === pullH && now.minute === pullM) {
        const claimed = await claimDailyJobRun("outbound_apollo_pull", dateKey, { timezone: TZ });
        if (claimed) {
          const r = await pullApolloLeads();
          console.info("[OUTBOUND] apollo_pull", r);
        }
      }

      if (now.hour === pushH && now.minute === pushM) {
        const claimed = await claimDailyJobRun("outbound_instantly_push", dateKey, { timezone: TZ });
        if (claimed) {
          const r = await pushLeadsToInstantly();
          console.info("[OUTBOUND] instantly_push", r);
        }
      }

      if (now.hour === abH && now.minute === abM) {
        const claimed = await claimDailyJobRun("outbound_ab_calc", dateKey, { timezone: TZ });
        if (claimed) {
          const rows = await calculateAbResults();
          console.info("[OUTBOUND] ab_calc", { variants: rows.length });
        }
      }
    } catch (err) {
      console.warn("[OUTBOUND] scheduler tick failed", err.message);
    }
  }, 60 * 1000);
}
