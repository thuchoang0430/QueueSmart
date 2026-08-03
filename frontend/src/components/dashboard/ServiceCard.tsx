import { Link } from "react-router-dom";

import type { Service } from "../../data/dashboardData";

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg">
          {service.icon}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {service.status}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-950">{service.name}</h3>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-500">
          Estimated Wait Time
        </p>

        <p className="mt-1 font-bold text-slate-950">
          {service.estimatedWait} minutes
        </p>
      </div>

      <Link
        to="/join-queue"
        className="mt-4 block w-full rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
      >
        Join Queue
      </Link>
    </article>
  );
}

export default ServiceCard;
