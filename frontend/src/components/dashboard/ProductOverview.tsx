function ProductOverview() {
  return (
    <section className="mx-auto mt-5 grid w-[90%] max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:grid-cols-[1.4fr_0.6fr]">
      <div className="px-5 py-5">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-2xl bg-blue-50 px-2 py-2 font-bold text-blue-700">
            🚀 QueueSmart
          </span>

          <span className="rounded-2xl bg-slate-100 px-2 py-2 font-bold text-slate-900">
            🧑‍🎓 Group 20
          </span>

          <span className="rounded-2xl bg-slate-100 px-2 py-2 font-bold text-slate-900">
            🖥️ Software Design Project
          </span>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold text-slate-900">
            Smart Queue Management Application
          </h2>

          <p className="text-sm text-slate-600">
            QueueSmart helps users join a queue, track their position, estimate
            wait time, and receive service updates in one simple system.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 px-5 py-5 text-white">
        <p className="text-sm text-blue-400">PRODUCT OWNER TEAM</p>

        <p className="font-bold">Software Design Group 20</p>

        <p className="text-xs text-slate-300">
          This dashboard belongs to our QueueSmart team project.
        </p>
      </div>
    </section>
  );
}

export default ProductOverview;
