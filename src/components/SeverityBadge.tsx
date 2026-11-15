import type { Severity } from '../engine/types';

const SEVERITY_CONFIG: Record<
  Severity,
  { bg: string; text: string; label: string }
> = {
  high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High Risk' },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Medium Risk',
  },
  low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low Risk' },
  info: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Info' },
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      role="status"
      aria-label={`Severity: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
