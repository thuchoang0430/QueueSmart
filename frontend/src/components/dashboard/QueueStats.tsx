interface StatCardProps {
  label: string;
  value: string;
  description: string;
  badge?: string;
}

function StatCard({ label, value, description, badge }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <p className="text-slate-600">{label}</p>

        {badge && (
          <span className="rounded-2xl bg-blue-50 px-2 py-2 font-bold text-blue-600">
            {badge}
          </span>
        )}
      </div>

      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="text-slate-600">{description}</p>
    </article>
  );
}

function QueueStats() {
  return (
    <section className="mx-auto mt-5 grid w-[90%] max-w-6xl grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm md:grid-cols-3">
      <StatCard
        label="🛐 Current Position"
        value="3"
        description="You are close to your turn"
        badge="Active"
      />

      <StatCard
        label="⏰ Estimated Wait"
        value="15 minutes"
        description="Time may change based on service speed."
      />

      <StatCard
        label="🈂️ Available Services"
        value="3"
        description="Services currently open"
      />
    </section>
  );
}

export default QueueStats;
