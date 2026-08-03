import type { ReactNode } from "react";

interface SocialButtonProps {
  icon: ReactNode;
  children: ReactNode;
}

function SocialButton({ icon, children }: SocialButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50"
    >
      {icon}
      {children}
    </button>
  );
}

export default SocialButton;
