function formatKstTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} KST`;
}

function metNoWeatherText(symbol, precip) {
  const s = String(symbol || "").toLowerCase();
  if (s.includes("thunder")) return "천둥번개";
  if (s.includes("snow") || s.includes("sleet")) return "눈";
  if (s.includes("rain") || s.includes("drizzle") || precip > 0) return "비";
  if (s.includes("fog")) return "안개";
  return "";
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "GET" || url.pathname !== "/api/weather") {
      return new Response("Not found", { status: 404 });
    }

    const upstream =
      "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=33.249&lon=126.278";

    try {
      const response = await fetch(upstream, {
        headers: {
          "User-Agent": "litttl-farm/1.0 (https://litttl.com; unclelitttl@gmail.com)",
          Accept: "application/json",
        },
        cf: { cacheTtl: 0, cacheEverything: false },
      });
      if (!response.ok) throw new Error(`METNO ${response.status}`);
      const data = await response.json();
      const series = data?.properties?.timeseries;
      if (!Array.isArray(series) || !series.length) throw new Error("METNO empty");
      const nowMs = Date.now();
      let chosen = series[0];
      let bestDiff = Math.abs(new Date(chosen.time).getTime() - nowMs);
      for (let i = 1; i < Math.min(series.length, 6); i++) {
        const diff = Math.abs(new Date(series[i].time).getTime() - nowMs);
        if (diff < bestDiff) {
          bestDiff = diff;
          chosen = series[i];
        }
      }
      const instant = chosen.data?.instant?.details || {};
      const next1 = chosen.data?.next_1_hours || chosen.data?.next_6_hours || {};
      const symbol = next1.summary?.symbol_code || "";
      const precip = Number(next1.details?.precipitation_amount ?? 0);
      const rn = Number.isFinite(precip) ? precip : 0;
      const cloudPct = Number(instant.cloud_area_fraction);
      const caTot = Number.isFinite(cloudPct)
        ? Math.round((Math.max(0, Math.min(100, cloudPct)) / 100) * 10)
        : null;
      const ta = Number(instant.air_temperature);
      const ww = metNoWeatherText(symbol, rn);
      const sdTot = ww === "눈" ? Math.max(0.1, rn) : 0;

      return Response.json(
        {
          tm: formatKstTime(chosen.time),
          station: "벼락밭",
          ta: Number.isFinite(ta) ? ta : null,
          rn,
          sdTot,
          ww,
          caTot,
          source: "metno",
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
            Pragma: "no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    } catch {
      return Response.json(
        { error: "날씨 자료를 불러오지 못했습니다." },
        {
          status: 502,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }
  },
};
