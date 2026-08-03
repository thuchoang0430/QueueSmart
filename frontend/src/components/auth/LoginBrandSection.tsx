import { FaClock, FaBell, FaChartLine } from "react-icons/fa";

import loginImage from "../../assets/register_login_image.png";
import FeatureItem from "./FeatureItem";

function LoginBrandSection() {
  return (
    <section>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-blue-100 px-4 py-2 text-3xl font-bold text-blue-600">
          Q
        </div>

        <h1 className="text-3xl font-bold">
          Queue<span className="text-blue-600">Smart</span>
        </h1>
      </div>

      <div className="mt-6">
        <h2 className="text-4xl font-bold">Smart Queues</h2>
        <h2 className="text-4xl font-bold text-blue-600">Better Experience</h2>
      </div>

      <p className="mt-6 text-slate-600">
        QueueSmart helps you wait less and live more.
      </p>

      <img
        src={loginImage}
        alt="QueueSmart login"
        className="mt-6 w-full max-w-lg"
      />

      <div className="mt-6 space-y-3">
        <FeatureItem
          icon={<FaClock />}
          title="Save Time"
          text="Skip the line and save time."
        />

        <FeatureItem
          icon={<FaBell />}
          title="Real-Time Updates"
          text="Receive live queue notifications."
        />

        <FeatureItem
          icon={<FaChartLine />}
          title="Easy to Use"
          text="Simple and convenient queue management."
        />
      </div>

      <p className="mt-8 text-sm text-slate-500">
        © 2026 QueueSmart — Group 20 Software Design.
      </p>
    </section>
  );
}

export default LoginBrandSection;
