export const phaseColors: Record<string, string> = {
  discovery: 'var(--color-discovery)',
  validation: 'var(--color-validation)',
  creation: 'var(--color-creation)',
  building: 'var(--color-building)',
};

export const statusColors: Record<string, string> = {
  active: 'var(--color-creation)',
  inactive: 'var(--color-text-muted)',
  dissolved: 'var(--color-text-muted)',
  acquired: 'var(--color-validation)',
  planned: 'var(--color-discovery)',
  divested: 'var(--color-text-muted)',
  proposed: 'var(--color-discovery)',
  accepted: 'var(--color-creation)',
  superseded: 'var(--color-validation)',
  deprecated: 'var(--color-text-muted)',
  archived: 'var(--color-text-muted)',
  experimental: 'var(--color-discovery)',
};

export function getPhaseColor(phase: string): string {
  return phaseColors[phase] || 'var(--color-border)';
}

export function getStatusColor(status: string): string {
  return statusColors[status] || 'var(--color-border)';
}
