import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import registerImage from "../../assets/register_login_image.png";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaUserPlus,
  FaCheck,
  FaGoogle,
  FaFacebookF,
  FaClock,
  FaBell,
  FaChartLine,
} from "react-icons/fa";

interface InputProps {
  label: string;
  icon: ReactNode;
  rightIcon?: ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  function switchToLogin(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    // Login route is "/" in App.tsx
    navigate("/");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password did not match. Please try again.");
      return;
    }

    setSubmitting(true);

    try {
      // The backend re-checks all of this and owns the duplicate-email rule -
      // see backend/src/modules/auth/auth.service.ts
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.displayMessage
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex justify-center py-5 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] border border-slate-200 rounded-2xl px-6 lg:px-10 py-7 shadow-lg bg-slate-50 gap-8 max-w-7xl w-full mx-4">
        {/* Left side of register page */}
        <div className="flex flex-col w-full justify-between">
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-sky-100 px-3 py-3 rounded-full text-blue-600 text-4xl font-bold shadow-sm">
                  Q
                </span>

                <div className="flex gap-1 text-3xl font-bold">
                  <p>Queue</p>
                  <p className="text-blue-600">Smart</p>
                </div>
              </div>
            </div>

            <div>
              <div className="text-4xl lg:text-5xl font-bold">
                <p>Smart Queues</p>
                <p className="text-blue-600">Better Experience</p>
              </div>

              <div className="mt-10">
                <p className="text-slate-600">
                  QueueSmart helps you wait less and live more. Join now and
                  experience smarter queuing.
                </p>
              </div>

              <div className="mt-8 flex justify-center lg:justify-start overflow-hidden rounded-3xl">
                <img
                  src={registerImage}
                  alt="QueueSmart register"
                  className="w-full max-w-[560px] object-contain mix-blend-multiply opacity-95"
                />
              </div>
            </div>

            <div className="space-y-8 mt-10">
              <div className="flex gap-3">
                <FaClock className="w-12 h-12 text-blue-600 bg-sky-200 px-2 py-2 rounded-2xl" />
                <div className="text-slate-600">
                  <p className="font-bold">Save Time</p>
                  <p>Skip the line and save valuable time.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <FaBell className="w-12 h-12 text-blue-600 bg-sky-200 px-2 py-2 rounded-2xl" />
                <div className="text-slate-600">
                  <p className="font-bold">Real-Time Updates</p>
                  <p>Get notified and stay updated in real time.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <FaChartLine className="w-12 h-12 text-blue-600 bg-sky-200 px-2 py-2 rounded-2xl" />
                <div className="text-slate-600">
                  <p className="font-bold">Smart & Easy</p>
                  <p>Simple to use with a powerful experience.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-600 text-sm mt-8">
              © 2026 QueueSmart — Group 20 Software Design. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right side of register page */}
        <div className="flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[560px] rounded-[2rem] bg-white px-6 sm:px-8 lg:px-10 py-10 shadow-xl"
          >
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <FaUserPlus className="text-3xl text-blue-600" />
              </div>
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-3xl font-bold text-slate-950">
                Create Your Account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign up to get started with QueueSmart.
              </p>
            </div>

            <div className="mt-9 space-y-5">
              <Input
                icon={<FaUser />}
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                icon={<FaEnvelope />}
                label="Email Address"
                placeholder="Enter your email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                icon={<FaPhone />}
                label="Phone Number"
                placeholder="Enter your phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                icon={<FaLock />}
                label="Password"
                placeholder="Create a password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                icon={<FaLock />}
                label="Confirm Password"
                placeholder="Confirm your password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="rounded-xl bg-blue-50 px-5 py-4 shadow-sm">
                <p className="font-semibold text-blue-600">
                  Password must contain:
                </p>

                <div>
                  <div className="flex items-center text-slate-400 gap-3">
                    <FaCheck className="text-blue-600" />
                    <p>At least 8 characters</p>
                  </div>

                  <div className="flex items-center text-slate-400 gap-3">
                    <FaCheck className="text-blue-600" />
                    <p>One uppercase letter</p>
                  </div>

                  <div className="flex items-center text-slate-400 gap-3">
                    <FaCheck className="text-blue-600" />
                    <p>One number</p>
                  </div>

                  <div className="flex items-center text-slate-400 gap-3">
                    <FaCheck className="text-blue-600" />
                    <p>One special character</p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}

              <div className="flex items-start gap-3 text-sm text-slate-500">
                <input
                  className="mt-1 h-4 w-4 accent-blue-600"
                  type="checkbox"
                />
                <p>
                  I agree to the{" "}
                  <span className="text-blue-600 font-semibold">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-blue-600 font-semibold">
                    Privacy Policy
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>

              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="h-px flex-1 bg-slate-200"></div>
                <p>or register with</p>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-3 font-semibold hover:bg-slate-50"
                >
                  <FaGoogle className="text-red-500" />
                  Google
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-3 font-semibold hover:bg-slate-50"
                >
                  <FaFacebookF className="text-blue-600" />
                  Facebook
                </button>
              </div>

              <p className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-semibold text-blue-600 hover:text-purple-700"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  icon,
  rightIcon,
  placeholder,
  type = "text",
  value,
  onChange,
}: InputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-4 text-slate-500 shadow-sm focus-within:border-purple-500">
        {icon}

        <input
          type={type}
          placeholder={placeholder}
          className="w-full outline-none placeholder:text-slate-400"
          value={value}
          onChange={onChange}
        />

        {rightIcon && <span>{rightIcon}</span>}
      </div>
    </div>
  );
}

export default Register;
