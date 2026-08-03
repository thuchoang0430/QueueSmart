import registerImage from "../../assets/register_login_image.png";
import { FaBell, FaChartLine, FaClock } from "react-icons/fa";
import FeatureItem from "./FeatureItem";

function RegisterBrandSection() {
  return (
    <section className="flex w-full flex-col justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-3 text-4xl font-bold text-blue-600 shadow-sm">
            Q
          </span>

          <div className="flex gap-1 text-3xl font-bold">
            <p>Queue</p>
            <p className="text-blue-600">Smart</p>
          </div>
        </div>

        <div>
          <div className="text-4xl font-bold lg:text-5xl">
            <p>Smart Queues</p>
            <p className="text-blue-600">Better Experience</p>
          </div>

          <p className="mt-10 text-slate-600">
            QueueSmart helps you wait less and live more. Join now and
            experience smarter queuing.
          </p>

          <div className="mt-8 flex justify-center overflow-hidden rounded-3xl lg:justify-start">
            <img
              src={registerImage}
              alt="QueueSmart registration"
              className="w-full max-w-[560px] object-contain opacity-95 mix-blend-multiply"
            />
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <FeatureItem
            icon={<FaClock />}
            title="Save Time"
            text="Skip the line and save valuable time."
          />

          <FeatureItem
            icon={<FaBell />}
            title="Real-Time Updates"
            text="Get notified and stay updated in real time."
          />

          <FeatureItem
            icon={<FaChartLine />}
            title="Smart & Easy"
            text="Simple to use with a powerful experience."
          />
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-600">
        © 2026 QueueSmart — Group 20 Software Design. All rights reserved.
      </p>
    </section>
  );
}

export default RegisterBrandSection;
