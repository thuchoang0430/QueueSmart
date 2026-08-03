import type { ReactElement } from "react";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import ProductOverview from "../../components/dashboard/ProductOverview";
import QueueOverview from "../../components/dashboard/QueueOverview";
import QueueStats from "../../components/dashboard/QueueStats";
import ServicesSection from "../../components/dashboard/ServicesSection";
import TeamSection from "../../components/dashboard/TeamSection";

function UserDashboard(): ReactElement {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-100 lg:grid-cols-[0.3fr_1.7fr]">
      <DashboardSidebar />

      <main>
        <DashboardHeader />
        <ProductOverview />
        <TeamSection />

        <section className="mx-auto mt-5 w-[90%] max-w-6xl rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row">
            <div className="space-y-2">
              <p className="font-semibold text-blue-600">
                Welcome back, Student User
              </p>

              <h2 className="text-xl font-bold">
                Your queue is currently active
              </h2>

              <p className="text-sm text-slate-600">
                You are waiting for Academic Advising. Stay ready and check your
                notifications for status updates.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-5">
              <p className="text-slate-600">Current Status</p>

              <p className="font-bold text-blue-600">Waiting</p>
            </div>
          </div>
        </section>

        <QueueStats />
        <QueueOverview />
        <ServicesSection />
      </main>
    </div>
  );
}

export default UserDashboard;
