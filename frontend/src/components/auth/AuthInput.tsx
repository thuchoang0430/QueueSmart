import type { ReactNode } from "react";

interface AuthInputProps {
  label: string;
  icon: ReactNode;
<<<<<<< HEAD
  type: "email" | "password" | "text";
=======
  type?: "email" | "password" | "text" | "tel";
>>>>>>> 62e36a4 (Refactor register page into reusable components)
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function AuthInput({
  label,
  icon,
<<<<<<< HEAD
  type,
=======
  type = "text",
>>>>>>> 62e36a4 (Refactor register page into reusable components)
  placeholder,
  value,
  onChange,
}: AuthInputProps) {
  return (
    <div>
      <label className="mb-2 block font-semibold text-slate-700">{label}</label>

<<<<<<< HEAD
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3">
=======
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 focus-within:border-blue-500">
>>>>>>> 62e36a4 (Refactor register page into reusable components)
        <span className="text-slate-400">{icon}</span>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

export default AuthInput;
