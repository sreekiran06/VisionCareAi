import React from "react";
import { NeedType } from "../../types";
import { NEED_CONFIG } from "../../utils/needConfig";

interface NeedBadgeProps {
  need: NeedType;
  size?: "sm" | "md";
}

export const NeedBadge: React.FC<NeedBadgeProps> = ({ need, size = "md" }) => {
  const config = NEED_CONFIG[need];
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${config.badgeClass}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default NeedBadge;
