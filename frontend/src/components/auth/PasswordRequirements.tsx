import { FaCheck } from "react-icons/fa";

interface PasswordRequirementsProps {
  password: string;
}

interface RequirementProps {
  passed: boolean;
  text: string;
}

function Requirement({ passed, text }: RequirementProps) {
  return (
    <div
      className={`flex items-center gap-3 ${
        passed ? "text-green-600" : "text-slate-400"
      }`}
    >
      <FaCheck />
      <p>{text}</p>
    </div>
  );
}

function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = {
    minimumLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    specialCharacter: /[^A-Za-z0-9]/.test(password),
  };

  return (
    <div className="rounded-xl bg-blue-50 px-5 py-4 shadow-sm">
      <p className="mb-2 font-semibold text-blue-600">Password must contain:</p>

      <div className="space-y-1">
        <Requirement
          passed={requirements.minimumLength}
          text="At least 8 characters"
        />

        <Requirement
          passed={requirements.uppercase}
          text="One uppercase letter"
        />

        <Requirement passed={requirements.number} text="One number" />

        <Requirement
          passed={requirements.specialCharacter}
          text="One special character"
        />
      </div>
    </div>
  );
}

export default PasswordRequirements;
