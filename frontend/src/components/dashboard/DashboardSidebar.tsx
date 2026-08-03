import { NavLink } from "react-router-dom";

import { sidebarLinks } from "../../data/dashboardData";

function DashboardSidebar() {
  return (
    <aside className="h-full space-y-5 bg-slate-900 px-5 py-3 text-white">
      <div className="flex items-center gap-3">
        <p className="rounded-full bg-blue-600 px-3 py-3 font-bold text-white">
          QS
        </p>

        <div>
          <p className="text-3xl font-bold">QueueSmart</p>
          <p className="text-sm text-slate-300">Smart Queue Management</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-700 px-3 py-3 shadow-sm ring ring-slate-600">
        <p className="font-bold text-blue-400">Team Product</p>

        <p className="font-bold">Software Design Group 20</p>

        <p className="text-xs text-slate-300">
          Built by our team for the QueueSmart front-end project.
        </p>
      </div>

      <nav className="space-y-3">
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block rounded-2xl px-3 py-2 transition ${
                isActive
                  ? "bg-blue-600 font-bold text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            {link.icon} {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 rounded-2xl bg-slate-700 px-3 py-3 shadow-sm ring ring-slate-600">
        <p className="font-bold">👩🏻‍🎓 Group 20</p>

        <p className="text-sm text-slate-300">
          Team members: Andy, Ayush, Ngoc Thang, and Tom
        </p>

        <button
          type="button"
          className="w-full rounded-xl bg-white px-4 py-2 font-semibold text-slate-900"
        >
          View Team
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
