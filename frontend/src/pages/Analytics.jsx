
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api";
import Sidebar from "../components/Sidebar";

const COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#f97316",
  "#6366f1",
];

function formatDate(date) {
  const value = new Date(`${date}T00:00:00`);
  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function DailyLineChart({ data }) {
  const width = 720;
  const height = 240;
  const left = 36;
  const right = 16;
  const top = 20;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const values = data.map(([, count]) => Number(count) || 0);
  const max = Math.max(1, ...values);
  const points = data.map(([date], index) => {
    const x =
      data.length === 1
        ? left + chartWidth / 2
        : left + (index / (data.length - 1)) * chartWidth;

    const y = top + chartHeight - (values[index] / max) * chartHeight;

    return { x, y, date, value: values[index] };
  });

  const line = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${top + chartHeight} L ${points[0].x} ${top + chartHeight} Z`
    : "";

  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((data.length - 1) / 3),
      Math.floor(((data.length - 1) * 2) / 3),
      data.length - 1,
    ]),
  ].filter((index) => index >= 0);

  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex h-60 items-center justify-center text-sm text-slate-500">
          No click activity available for this period.
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
            Daily clicks
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="block w-full overflow-visible"
            role="img"
            aria-label="Daily clicks line chart"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = top + chartHeight * fraction;
              const label = Math.round(max * (1 - fraction));

              return (
                <g key={fraction}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            <path d={area} fill="#8b5cf6" fillOpacity="0.10" />

            <path
              d={line}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point) => (
              <g key={point.date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#7c3aed"
                  strokeWidth="2"
                >
                  <title>
                    {point.date}: {point.value} clicks
                  </title>
                </circle>
              </g>
            ))}

            {labelIndexes.map((index) => (
              <text
                key={index}
                x={points[index].x}
                y={height - 12}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === data.length - 1
                      ? "end"
                      : "middle"
                }
                fontSize="10"
                fill="#64748b"
              >
                {formatDate(points[index].date)}
              </text>
            ))}
          </svg>
        </>
      )}
    </div>
  );
}

function BreakdownChart({ title, data }) {
  const entries = Object.entries(data || {})
    .map(([name, count]) => [name, Number(count) || 0])
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  let accumulated = 0;
  const gradient = entries.map(([, count], index) => {
    const start = accumulated;
    accumulated += total ? (count / total) * 100 : 0;
    return `${COLORS[index % COLORS.length]} ${start}% ${accumulated}%`;
  });

  return (
    <ChartCard title={title} subtitle="Distribution of recorded clicks">
      {entries.length === 0 || total === 0 ? (
        <div className="flex h-48 items-center justify-center text-center text-sm text-slate-500">
          No breakdown data available yet.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div
            className="relative h-36 w-36 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(${gradient.join(", ")})`,
            }}
            role="img"
            aria-label={`${title} distribution`}
          >
            <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white">
              <span className="text-2xl font-bold text-slate-900">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Total clicks</span>
            </div>
          </div>

          <div className="w-full min-w-0 space-y-3">
            {entries.map(([name, count], index) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <span className="truncate text-slate-600">{name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-semibold text-slate-900">
                    {count.toLocaleString()}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {Math.round((count / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export default function Analytics() {
  const [links, setLinks] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLinks() {
      try {
        const data = await api.getLinks();
        const list = Array.isArray(data) ? data : [];
        setLinks(list);
        if (list.length) setSelectedCode(list[0].short_code);
      } catch (err) {
        setError(err.message || "Could not load links.");
      } finally {
        setLoadingLinks(false);
      }
    }

    loadLinks();
  }, []);

  useEffect(() => {
    if (!selectedCode) {
      setStats(null);
      return;
    }

    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);
      setError("");

      try {
        const data = await api.getStats(selectedCode, days);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load analytics.");
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [selectedCode, days]);

  const dailyClicks = useMemo(
    () =>
      Object.entries(stats?.daily_clicks || {}).sort(([a], [b]) =>
        a.localeCompare(b)
      ),
    [stats]
  );

  const totalClicks = Number(stats?.total_clicks) || 0;

  const busiestDay = dailyClicks.reduce(
    (best, current) =>
      Number(current[1]) > Number(best[1]) ? current : best,
    ["", 0]
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Workspace <span className="mx-2 text-slate-300">/</span>
              Analytics
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Analytics
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Understand how people interact with your short links.
            </p>
          </div>

          <span className="flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Link insights
          </span>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loadingLinks ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            Loading your links...
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
              ↗
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              No links to analyze yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create your first short link to explore its performance.
            </p>
            <NavLink
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Go to dashboard →
            </NavLink>
          </div>
        ) : (
          <>
            <section className="mb-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="analytics-link"
                  >
                    Select a short link
                  </label>
                  <select
                    id="analytics-link"
                    value={selectedCode}
                    onChange={(event) =>
                      setSelectedCode(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  >
                    {links.map((link) => {
                      let domain = link.original_url;
                      try {
                        domain = new URL(link.original_url).hostname;
                      } catch {
                        // Keep the original URL if parsing fails.
                      }

                      return (
                        <option
                          key={link.short_code}
                          value={link.short_code}
                        >
                          {link.short_code} — {domain}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Reporting period
                  </p>
                  <div className="flex gap-2">
                    {[7, 30, 90].map((range) => (
                      <button
                        type="button"
                        key={range}
                        onClick={() => setDays(range)}
                        aria-pressed={days === range}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          days === range
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-violet-50"
                        }`}
                      >
                        {range}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {loadingStats ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                Loading analytics...
              </div>
            ) : stats ? (
              <>
                <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-500">
                        Total clicks
                      </p>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
                        ↗
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-bold tracking-tight">
                      {totalClicks.toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Recorded for this short link
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-500">
                        Unique visitors
                      </p>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                        ◎
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-bold tracking-tight">
                      {(Number(stats.unique_visitors) || 0).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Distinct visitor IDs in the last {days} days
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:col-span-2 xl:col-span-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-500">
                        Busiest recorded day
                      </p>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                        ↑
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-bold tracking-tight">
                      {busiestDay[0] ? formatDate(busiestDay[0]) : "—"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {Number(busiestDay[1]) || 0} clicks on the busiest day
                    </p>
                  </div>
                </section>

                <ChartCard
                  title="Click activity"
                  subtitle={`Daily clicks during the last ${days} days`}
                >
                  <DailyLineChart data={dailyClicks} />
                </ChartCard>

                <section className="mt-6 grid gap-5 lg:grid-cols-2">
                  <BreakdownChart
                    title="Clicks by browser"
                    data={stats.browsers}
                  />
                  <BreakdownChart
                    title="Clicks by device"
                    data={stats.devices}
                  />
                  <BreakdownChart
                    title="Clicks by operating system"
                    data={stats.operating_systems}
                  />
                  <BreakdownChart
                    title="Traffic sources"
                    data={stats.referrers}
                  />
                </section>

                <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
                  <p className="text-sm font-semibold text-violet-900">
                    About your analytics
                  </p>
                  <p className="mt-1 text-sm leading-6 text-violet-800">
                    Unique visitors are estimated using anonymous browser
                    cookies, so the same person using different browsers or
                    devices may count more than once. Traffic sources depend
                    on referrer information supplied by the visitor's browser;
                    direct visits and some apps may not provide it. Older
                    clicks may not include visitor IDs or operating-system data.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
                No analytics data available.
              </div>
            )}
          </>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-400">
          <span>Shortly · Link analytics</span>
          <span>Built for better links.</span>
        </footer>
      </main>
    </div>
  );
}
