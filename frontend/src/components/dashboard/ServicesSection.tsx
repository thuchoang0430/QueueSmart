import { Link } from "react-router-dom";

import { services } from "../../data/dashboardData";
import ServiceCard from "./ServiceCard";

function ServicesSection() {
  return (
    <section className="mx-auto mb-10 mt-5 w-[90%] max-w-6xl rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
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
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}

export default ServicesSection;
