import type { ReactNode } from "react";

interface FeatureItemProps {
  icon: ReactNode;
  title: string;
  text: string;
}

function FeatureItem({ icon, title, text }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
    </div>
  );
}

export default FeatureItem;
