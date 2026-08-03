import { Link } from "react-router-dom";

function DashboardHeader() {
  return (
    <header className="flex flex-col justify-between gap-5 bg-white px-6 py-10 lg:px-10 xl:flex-row">
      <div>
        <p className="text-2xl font-bold text-blue-700">
          SOFTWARE DESIGN GROUP 20
        </p>

        <h1 className="text-4xl font-bold text-slate-900">
          QueueSmart Dashboard
        </h1>

        <p className="text-xl text-slate-600">
          A smart queue management product built by our team.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 px-5 py-5 text-lg shadow-sm">
        <Link
          to="/history"
          className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600"
        >
          🕛 View History
        </Link>

        <Link
          to="/join-queue"
          className="rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white"
        >
          + Join Queue
        </Link>

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-xl font-semibold text-white">
          U
        </span>
      </div>
    </header>
  );
}

export default DashboardHeader;
