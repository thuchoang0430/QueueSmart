import type { ReactElement } from "react";
import { Link, NavLink } from "react-router-dom";
import NotificationsPanel from "../../components/NotificationsPanel";

const SIDEBAR_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "🖥️", end: true },
  { to: "/join-queue", label: "Join Queue", icon: "➕" },
  { to: "/queue-status", label: "Queue Status", icon: "⏳" },
  { to: "/history", label: "History", icon: "🕧" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
];

function UserDashboard(): ReactElement {
  return (
    <>
      <div className="min-h-screen bg-slate-100 grid grid-cols-1 lg:grid-cols-[0.3fr_1.7fr]">
        <aside className="bg-slate-900 h-full px-5 py-3 text-white space-y-5">
          <div className="flex gap-3 items-center">
            <div>
              <p className="px-3 py-3 bg-blue-600 text-white font-bold rounded-full">
                QS
              </p>
            </div>

            <div className="text-white">
              <p className="text-3xl font-bold">QueueSmart</p>
              <p className="text-slate-300 text-sm">Smart Queue Management</p>
            </div>
          </div>

          <div className="bg-slate-700 px-3 py-3 rounded-2xl ring ring-slate-600 shadow-sm">
            <p className="font-bold text-blue-600">Team Product</p>
            <p className="font-bold">Software Design Group 20</p>
            <p className="text-slate-300 text-xs">
              Built by our team for the QueueSmart front-end project.
            </p>
          </div>

          <div className="space-y-5">
            {SIDEBAR_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-2xl py-2 px-2 ${
                    isActive ? "bg-blue-600 font-bold" : "text-slate-300"
                  }`
                }
              >
                <p>
                  {link.icon} {link.label}
                </p>
              </NavLink>
            ))}
            <div className="text-slate-300 py-2 px-2">
              <p>🙎🏻 Team Members</p>
            </div>
          </div>

          <div className="bg-slate-700 px-3 py-3 rounded-2xl ring ring-slate-600 shadow-sm space-y-2">
            <p className="font-bold">👩🏻‍🎓 Group 20</p>
            <p className="text-slate-300">
              Team members: Andy, Ayush, Ngoc Thang, and Tom
            </p>

            <div className="text-center">
              <button
                type="button"
                className="bg-white text-slate-900 px-6 py-2 rounded-2xl"
              >
                View Team
              </button>
            </div>
          </div>
        </aside>

        <div>
          <div className="bg-white flex flex-col xl:flex-row px-6 lg:px-10 py-10 justify-between gap-5">
            <div className="text-slate-600">
              <p className="text-blue-700 font-bold text-2xl">
                SOFTWARE DESIGN GROUP 20
              </p>
              <p className="font-bold text-slate-900 text-4xl">
                QueueSmart Dashboard
              </p>
              <p className="text-slate-600 text-xl">
                A smart queue management product built by our team.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center items-center text-xl border border-slate-200 px-5 py-5 rounded-2xl shadow-sm">
              <Link
                to="/history"
                className="border border-slate-200 rounded-2xl px-2 py-2 font-semibold text-slate-600"
              >
                🕛 View History
              </Link>
              <Link
                to="/join-queue"
                className="border border-slate-200 rounded-2xl px-2 py-2 bg-blue-600 text-white font-semibold"
              >
                + Join Queue
              </Link>
              <span className="px-2 py-2 rounded-full bg-slate-600 text-white font-semibold text-4xl">
                U
              </span>
            </div>
          </div>

          <div className="w-[90%] max-w-6xl bg-white rounded-2xl grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] mt-5 border border-slate-100 shadow-sm mx-auto overflow-hidden">
            <div className="px-5 py-5">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-blue-700 font-bold bg-blue-50 px-2 py-2 rounded-2xl">
                  🚀 QueueSmart
                </span>
                <span className="text-slate-900 font-bold bg-slate-100 px-2 py-2 rounded-2xl">
                  🧑‍🎓 Group 20
                </span>
                <span className="text-slate-900 font-bold bg-slate-100 px-2 py-2 rounded-2xl">
                  🖥️ Software Design Project
                </span>
              </div>

              <div className="mt-4">
                <p className="text-slate-900 font-bold text-xl">
                  Smart Queue Management Application
                </p>
                <p className="text-slate-600 text-sm">
                  QueueSmart is our team product for Software Design Group 20.
                  It helps users join a queue, track their position, estimate
                  wait time, and receive service updates in one simple system.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 px-3 py-3 text-white">
              <p className="text-blue-600 text-sm">PRODUCT OWNER TEAM</p>
              <p className="font-bold">Software Design Group 20</p>
              <p className="text-xs text-slate-300">
                This dashboard belongs to our QueueSmart team project.
              </p>
            </div>
          </div>

          <div className="w-[90%] max-w-6xl bg-white rounded-2xl mt-5 border border-slate-100 shadow-sm mx-auto">
            <div className="flex justify-between items-center px-2">
              <div className="px-5 py-5">
                <p className="text-blue-600 font-semibold">👷‍♂️ TEAM MEMBERS</p>
                <p className="font-bold">Software Design Group 20</p>
              </div>

              <div>
                <span className="text-blue-600 bg-blue-50 px-2 py-2 rounded-2xl">
                  4 Students
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 px-3 py-3">
              <div className="border border-slate-100 px-2 py-3 rounded-2xl bg-blue-50 flex gap-4 justify-center items-center">
                <span className="bg-blue-600 text-white font-bold px-2 py-2 rounded-full">
                  AL
                </span>
                <div>
                  <p className="font-bold">Andy L. Do</p>
                  <p className="text-sm text-slate-600">Team Member 1</p>
                </div>
              </div>

              <div className="border border-slate-100 px-2 py-3 rounded-2xl bg-blue-50 flex gap-4 justify-center items-center">
                <span className="bg-blue-600 text-white font-bold px-2 py-2 rounded-full">
                  AK
                </span>
                <div>
                  <p className="font-bold">Ayush Kharel</p>
                  <p className="text-sm text-slate-600">Team Member 2</p>
                </div>
              </div>

              <div className="border border-slate-100 px-2 py-3 rounded-2xl bg-blue-50 flex gap-4 justify-center items-center">
                <span className="bg-blue-600 text-white font-bold px-2 py-2 rounded-full">
                  NT
                </span>
                <div>
                  <p className="font-bold">Ngoc Thang Nguyen</p>
                  <p className="text-sm text-slate-600">Team Member 3</p>
                </div>
              </div>

              <div className="border border-slate-100 px-2 py-3 rounded-2xl bg-blue-50 flex gap-4 justify-center items-center">
                <span className="bg-blue-600 text-white font-bold px-2 py-2 rounded-full">
                  TH
                </span>
                <div>
                  <p className="font-bold">Tom Hoang</p>
                  <p className="text-sm text-slate-600">Team Member 4</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[90%] max-w-6xl bg-white rounded-2xl mt-5 border border-slate-100 shadow-sm mx-auto px-5 py-5">
            <div className="flex flex-col lg:flex-row justify-between gap-5">
              <div className="space-y-2">
                <p className="text-blue-600 font-semibold">
                  Welcome back, Student User
                </p>
                <p className="font-bold text-xl">
                  Your queue is currently active
                </p>
                <p className="text-sm text-slate-600">
                  You are waiting for Academic Advising. Stay ready and check
                  your notifications for status updates.
                </p>
              </div>

              <div className="bg-blue-50 px-5 py-5 rounded-2xl">
                <p className="text-slate-600">Current Status</p>
                <p className="text-blue-600 font-bold">Waiting</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-[90%] max-w-6xl bg-white rounded-2xl mt-5 border border-slate-100 shadow-sm mx-auto px-5 py-5">
            <div className="bg-white border border-slate-200 px-5 py-5 rounded-2xl shadow-sm">
              <div className="flex justify-between">
                <p className="text-slate-600">🛐 Current Position</p>
                <p className="px-2 py-2 bg-blue-50 text-blue-600 rounded-2xl font-bold">
                  Active
                </p>
              </div>
              <div>
                <p className="font-bold text-3xl">3</p>
                <p className="text-slate-600">You are close to your turn</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 px-5 py-5 rounded-2xl shadow-sm">
              <div className="flex justify-between">
                <p className="text-slate-600">⏰ Estimated Wait</p>
              </div>
              <div>
                <div className="flex gap-3 items-center">
                  <p className="font-bold text-3xl">15</p>
                  <p>minutes</p>
                </div>
                <p className="text-slate-600">
                  Time may change based on service speed.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 px-5 py-5 rounded-2xl shadow-sm">
              <div className="flex justify-between">
                <p className="text-slate-600">🈂️ Available Services</p>
              </div>
              <div>
                <p className="font-bold text-3xl">3</p>
                <p className="text-slate-600">Services currently open</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] w-[90%] max-w-6xl bg-white rounded-2xl mt-5 border border-slate-100 shadow-sm mx-auto px-5 py-5 gap-5">
            <div className="border border-slate-200 px-5 py-5 rounded-2xl shadow-sm space-y-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-blue-600 font-bold">🎯 CURRENT QUEUE</p>
                  <p className="font-bold text-2xl">Academic Advising</p>
                </div>

                <div>
                  <p className="px-2 py-2 bg-blue-50 text-blue-600 font-bold rounded-2xl">
                    Waiting
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 px-5 py-5 rounded-2xl shadow-sm text-center">
                  <p className="text-slate-600 text-xl font-semibold">
                    Position
                  </p>
                  <p className="text-3xl font-bold">3</p>
                </div>

                <div className="bg-white border border-slate-200 px-5 py-5 rounded-2xl shadow-sm text-center">
                  <p className="text-slate-600 text-xl font-semibold">
                    Estimated Wait
                  </p>
                  <p className="text-3xl font-bold">15m</p>
                </div>

                <div className="bg-white border border-slate-200 px-5 py-5 rounded-2xl shadow-sm text-center">
                  <p className="text-slate-600 text-xl font-semibold">
                    Service Type
                  </p>
                  <p className="text-3xl font-bold">Advising</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Queue Progress</p>
                  <p className="text-sm font-bold text-blue-700">60%</p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-3 w-3/5 bg-blue-600 rounded-2xl"></div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Please stay ready. You will receive a notification when your
                  turn is close.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 text-center">
                <Link
                  to="/queue-status"
                  className="block px-2 py-2 bg-blue-600 text-white rounded-2xl"
                >
                  View Queue Status
                </Link>
                <div>
                  <p className="px-2 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl">
                    Leave Queue
                  </p>
                </div>
              </div>
            </div>

            <NotificationsPanel />
          </div>

          <section className="w-[90%] max-w-6xl bg-white rounded-2xl mt-5 mb-10 border border-slate-100 shadow-sm mx-auto px-5 py-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  🏢 Services
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  Active Services
                </h2>
              </div>

              <Link
                to="/join-queue"
                className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View All Services
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    👨🏻‍🏫
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Open
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  Academic Advising
                </h3>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-500">
                    Estimated Wait Time
                  </p>
                  <p className="mt-1 font-bold text-slate-950">15 minutes</p>
                </div>

                <Link
                  to="/join-queue"
                  className="mt-4 block w-full rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Join Queue
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    🧑🏻‍💻
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Open
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  IT Help Desk
                </h3>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-500">
                    Estimated Wait Time
                  </p>
                  <p className="mt-1 font-bold text-slate-950">15 minutes</p>
                </div>

                <Link
                  to="/join-queue"
                  className="mt-4 block w-full rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Join Queue
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    🏦
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Open
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  Financial Aid
                </h3>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-500">
                    Estimated Wait Time
                  </p>
                  <p className="mt-1 font-bold text-slate-950">25 minutes</p>
                </div>

                <Link
                  to="/join-queue"
                  className="mt-4 block w-full rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  Join Queue
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default UserDashboard;
