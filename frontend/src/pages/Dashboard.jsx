
import { useEffect, useMemo, useState } from "react";
import { api, API_URL } from "../api";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function loadLinks() {
    try {
      setError("");
      const data = await api.getLinks();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load links.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  const totalClicks = links.reduce(
    (total, link) => total + (Number(link.click_count) || 0),
    0
  );

  const filteredLinks = useMemo(() => {
    const query = search.toLowerCase();

    return links.filter(
      (link) =>
        link.original_url.toLowerCase().includes(query) ||
        link.short_code.toLowerCase().includes(query)
    );
  }, [links, search]);

  async function handleCreate(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    try {
      setCreating(true);
      await api.createLink(url.trim());
      setUrl("");
      setMessage("Short link created successfully!");
      await loadLinks();
    } catch (err) {
      setError(err.message || "Could not create the link.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(code) {
    const shortUrl = `${API_URL}/${code}`;

    try {
      await navigator.clipboard.writeText(shortUrl);
      setMessage("Short link copied!");
      setError("");
    } catch {
      setError("Clipboard access failed. Copy the link manually.");
    }
  }

  async function handleDelete(code) {
    if (!window.confirm("Are you sure you want to delete this link?")) {
      return;
    }

    try {
      await api.deleteLink(code);
      setLinks((current) =>
        current.filter((link) => link.short_code !== code)
      );
      setMessage("Link deleted successfully.");
      setError("");
    } catch (err) {
      setError(err.message || "Could not delete the link.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Workspace <span className="mx-2 text-slate-300">/</span> Overview
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Dashboard
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Manage your links and track their performance.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            System ready
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700"
          >
            <span className="font-bold">✓</span>
            <p>{message}</p>
          </div>
        )}

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-500">
                Total links
              </p>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                ↗
              </span>
            </div>

            <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
              {loading ? "—" : links.length.toLocaleString()}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              Links created by you
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-500">
                Total clicks
              </p>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                ⌁
              </span>
            </div>

            <p className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
              {loading ? "—" : totalClicks.toLocaleString()}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              Across all your short links
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-white px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-xl text-white shadow-lg shadow-violet-600/20">
                +
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950 sm:text-xl">
                  Create a short link
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Make long URLs shorter, cleaner, and easier to share.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-3 p-6 sm:flex-row sm:p-8"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor="destination-url"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Destination URL
              </label>
              <input
                id="destination-url"
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/your-long-url"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {creating ? "Creating..." : "Create link →"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:p-7">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-slate-950 sm:text-xl">
                  Recent links
                </h3>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  {loading ? "…" : filteredLinks.length} links
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">
                View and manage your shortened URLs.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search links..."
                aria-label="Search links"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 p-10 text-sm text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              Loading your links...
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
                ↗
              </div>
              <p className="mt-4 font-semibold text-slate-900">
                {search ? "No matching links" : "Your links start here"}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Create your first short link above and it will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Short link</th>
                    <th className="px-6 py-4 font-semibold">Destination</th>
                    <th className="px-6 py-4 font-semibold">Clicks</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLinks.map((link) => (
                    <tr
                      key={link.short_code}
                      className="transition-colors hover:bg-violet-50/40"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold text-violet-700">
                          {API_URL}/{link.short_code}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Short URL
                        </p>
                      </td>

                      <td className="max-w-xs px-6 py-5">
                        <div
                          className="truncate text-slate-600"
                          title={link.original_url}
                        >
                          {link.original_url}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                          {Number(link.click_count) || 0}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(link.short_code)}
                            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          >
                            Copy
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(link.short_code)}
                            className="rounded-lg border border-red-100 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-400">
          <span>Shortly · Link management and analytics</span>
          <span>Built for better links.</span>
        </footer>
      </main>
    </div>
  );
}
