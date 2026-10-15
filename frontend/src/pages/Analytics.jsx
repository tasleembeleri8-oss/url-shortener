
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api";
import Sidebar from "../components/Sidebar";

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

  const dailyClicks = Object.entries(stats?.daily_clicks || {})
    .sort(([a], [b]) => a.localeCompare(b));

  const maxClicks = Math.max(
    1,
    ...dailyClicks.map(([, count]) => Number(count) || 0)
  );

  const breakdowns = [
    ["Browsers", stats?.browsers],
    ["Devices", stats?.devices],
  ];

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Workspace <span className="mx-2 text-slate-300">/</span> Analytics
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Analytics
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Understand how people interact with your short links.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Link insights
          </div>
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
              Create your first short link to start exploring its performance.
            </p>
            <NavLink
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700"
            >
              Go to dashboard →
            </NavLink>
          </div>
        ) : (
          <>
            <section className="mb-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-950">
                  Report settings
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a link and reporting period.
                </p>
              </div>

              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="analytics-link"
              >
                Select a short link
              </label>

              <select
                id="analytics-link"
                value={selectedCode}
                onChange={(event) => setSelectedCode(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100 sm:max-w-xl"
              >
                {links.map((link) => {
                  let domain = link.original_url;

                  try {
                    domain = new URL(link.original_url).hostname;
                  } catch {
                    // Retain the original URL if it cannot be parsed.
                  }

                  return (
                    <option key={link.short_code} value={link.short_code}>
                      {link.short_code} — {domain}
                    </option>
                  );
                })}
              </select>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Reporting period
                </p>

                <div className="flex flex-wrap gap-2">
                  {[7, 30, 90].map((range) => (
                    <button
                      type="button"
                      key={range}
                      onClick={() => setDays(range)}
                      aria-pressed={days === range}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        days === range
                          ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                      }`}
                    >
                      Last {range} days
                    </button>
                  ))}
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
                <section className="grid gap-5 sm:grid-cols-2">
                  <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-500">
                        Total clicks
                      </p>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                        ↗
                      </span>
                    </div>

                    <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
                      {(Number(stats.total_clicks) || 0).toLocaleString()}
                    </p>

                    <p className="mt-3 text-sm text-slate-500">
                      Recorded for this short link
                    </p>
                  </div>

                  <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-500">
                        Reporting period
                      </p>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                        ◷
                      </span>
                    </div>

                    <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
                      {days} days
                    </p>

                    <p className="mt-3 text-sm text-slate-500">
                      Selected analytics window
                    </p>
                  </div>
                </section>

                <section className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950 sm:text-xl">
                        Click activity
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Daily clicks during the selected period.
                      </p>
                    </div>

                    <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                      Last {days} days
                    </span>
                  </div>

                  {dailyClicks.length === 0 ? (
                    <div className="mt-7 rounded-xl bg-slate-50 px-5 py-10 text-center">
                      <p className="font-medium text-slate-700">
                        No click activity yet
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Click data will appear here when your link receives visits.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-8 overflow-x-auto pb-2">
                      <div className="flex h-56 min-w-full items-end gap-3 border-b border-slate-200">
                        {dailyClicks.map(([date, count]) => {
                          const value = Number(count) || 0;

                          return (
                            <div
                              key={date}
                              className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2"
                            >
                              <span className="text-xs font-semibold text-slate-600">
                                {value}
                              </span>

                              <div
                                title={`${date}: ${value} clicks`}
                                className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-300 hover:from-violet-700 hover:to-indigo-400"
                                style={{
                                  height: `${Math.max(5, (value / maxClicks) * 100)}%`,
                                }}
                              />

                              <span className="pb-1 text-[10px] text-slate-500">
                                {date.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="mt-7 grid gap-5 lg:grid-cols-2">
                  {breakdowns.map(([title, breakdown]) => {
                    const entries = Object.entries(breakdown || {}).sort(
                      ([, a], [, b]) => Number(b) - Number(a)
                    );

                    const maxCount = Math.max(
                      1,
                      ...entries.map(([, count]) => Number(count) || 0)
                    );

                    return (
                      <div
                        key={title}
                        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-bold text-slate-950">
                            {title}
                          </h3>
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {entries.length} types
                          </span>
                        </div>

                        {!entries.length ? (
                          <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                            No breakdown data available yet.
                          </p>
                        ) : (
                          <div className="mt-6 space-y-5">
                            {entries.map(([name, count]) => {
                              const value = Number(count) || 0;

                              return (
                                <div key={name}>
                                  <div className="mb-2 flex justify-between gap-3 text-sm">
                                    <span className="font-medium text-slate-700">
                                      {name}
                                    </span>
                                    <span className="font-semibold tabular-nums text-slate-900">
                                      {value.toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all duration-500"
                                      style={{
                                        width: `${Math.min(100, (value / maxCount) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
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
