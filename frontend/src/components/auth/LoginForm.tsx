import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaUserPlus,
  FaGoogle,
  FaFacebookF,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import AuthInput from "./AuthInput";
import SocialButton from "./SocialButton";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsLoading(true);

      const user = await login(email, password);

      if (!user) {
        setError("Login failed. Please try again.");
        return;
      }

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error && typeof (error as any).displayMessage === "string") {
        setError((error as any).displayMessage);
      } else if (error instanceof Error) {
        setError(error.message || "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <FaUserPlus className="text-3xl text-blue-600" />
          </div>

          <h2 className="mt-4 text-3xl font-bold">Welcome Back!</h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your QueueSmart account.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <AuthInput
            label="Email"
            icon={<FaEnvelope />}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={setEmail}
          />
          <AuthInput
            label="Password"
            icon={<FaLock />}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" />
              Remember me
            </label>

            <button type="button" className="text-blue-600">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-300" />
            <span className="text-sm text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-300" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon={<FaGoogle className="text-red-500" />}>
              Google
            </SocialButton>

            <SocialButton icon={<FaFacebookF className="text-blue-600" />}>
              Facebook
            </SocialButton>
          </div>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-semibold text-blue-600"
            >
              Register
            </button>
          </p>
        </div>
      </form>
    </section>
  );
}

export default LoginForm;
