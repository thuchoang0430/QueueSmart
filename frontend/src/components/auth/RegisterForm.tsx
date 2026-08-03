import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaFacebookF,
  FaGoogle,
  FaLock,
  FaPhone,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";

import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AuthInput from "./AuthInput";
import PasswordRequirements from "./PasswordRequirements";
import SocialButton from "./SocialButton";

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof RegisterFormData, value: string) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  function validateForm(): string | null {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return "Please fill in all required fields.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/\d/.test(password)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character.";
    }

    if (password !== confirmPassword) {
      return "Password and confirm password do not match.";
    }

    if (!acceptedTerms) {
      return "Please accept the Terms of Service and Privacy Policy.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.displayMessage
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[560px] rounded-[2rem] bg-white px-6 py-10 shadow-xl sm:px-8 lg:px-10"
      >
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <FaUserPlus className="text-3xl text-blue-600" />
          </div>
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold text-slate-950">
            Create Your Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign up to get started with QueueSmart.
          </p>
        </div>

        <div className="mt-9 space-y-5">
          <AuthInput
            icon={<FaUser />}
            label="Full Name"
            placeholder="Enter your full name"
            type="text"
            value={formData.name}
            onChange={(value) => updateField("name", value)}
          />

          <AuthInput
            icon={<FaEnvelope />}
            label="Email Address"
            placeholder="Enter your email address"
            type="email"
            value={formData.email}
            onChange={(value) => updateField("email", value)}
          />

          <AuthInput
            icon={<FaPhone />}
            label="Phone Number"
            placeholder="Enter your phone number"
            type="tel"
            value={formData.phone}
            onChange={(value) => updateField("phone", value)}
          />

          <AuthInput
            icon={<FaLock />}
            label="Password"
            placeholder="Create a password"
            type="password"
            value={formData.password}
            onChange={(value) => updateField("password", value)}
          />

          <AuthInput
            icon={<FaLock />}
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
          />

          <PasswordRequirements password={formData.password} />

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
            >
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-600"
            />

            <span>
              I agree to the{" "}
              <span className="font-semibold text-blue-600">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="font-semibold text-blue-600">
                Privacy Policy
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 font-bold text-white shadow-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <p>or register with</p>
            <div className="h-px flex-1 bg-slate-200" />
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
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-semibold text-blue-600 hover:text-purple-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </section>
  );
}

export default RegisterForm;
