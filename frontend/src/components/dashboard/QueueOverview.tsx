import { Link } from "react-router-dom";

import NotificationsPanel from "./NotificationsPanel";

function QueueOverview() {
  return (
    <section className="mx-auto mt-5 grid w-[90%] max-w-6xl grid-cols-1 gap-5 rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm xl:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-5 rounded-2xl border border-slate-200 px-5 py-5 shadow-sm">
        <div className="flex justify-between gap-4">
          <div>
            <p className="font-bold text-blue-600">🎯 CURRENT QUEUE</p>

            <h2 className="text-2xl font-bold">Academic Advising</h2>
          </div>

          <span className="h-fit rounded-2xl bg-blue-50 px-3 py-2 font-bold text-blue-600">
            Waiting
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <QueueDetail label="Position" value="3" />
          <QueueDetail label="Estimated Wait" value="15m" />
          <QueueDetail label="Service Type" value="Advising" />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">Queue Progress</p>

            <p className="text-sm font-bold text-blue-700">60%</p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-3/5 rounded-full bg-blue-600" />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please stay ready. You will receive a notification when your turn is
            close.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            to="/queue-status"
            className="rounded-2xl bg-blue-600 px-3 py-3 text-center font-semibold text-white"
          >
            View Queue Status
          </Link>

          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 font-semibold shadow-sm"
          >
            Leave Queue
          </button>
        </div>
      </div>

      <NotificationsPanel />
    </section>
  );
}

interface QueueDetailProps {
  label: string;
  value: string;
}

function QueueDetail({ label, value }: QueueDetailProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-center shadow-sm">
      <p className="text-lg font-semibold text-slate-600">{label}</p>

      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default QueueOverview;
