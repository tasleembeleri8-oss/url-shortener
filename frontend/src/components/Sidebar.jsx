
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="flex w-full flex-col bg-slate-950 p-5 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold">
          S
        </div>
        <div>
          <h1 className="text-lg font-bold">Shortly</h1>
          <p className="text-xs text-slate-400">Link management</p>
        </div>
      </div>

      <p className="mb-3 mt-10 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Workspace
      </p>

      <nav className="space-y-2">
        <NavLink to="/" end className={linkClass}>
          <span aria-hidden="true">▦</span>
          Dashboard
        </NavLink>

        <NavLink to="/analytics" className={linkClass}>
          <span aria-hidden="true">↗</span>
          Analytics
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-5">
        <p className="mb-3 text-xs text-slate-500">URL SHORTENER</p>
        <button
          onClick={logout}
          className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          ↪ Log out
        </button>
      </div>
    </aside>
  );
}
