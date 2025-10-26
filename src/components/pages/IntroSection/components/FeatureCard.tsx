import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className = ''
}: FeatureCardProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Icon className="h-6 w-6 text-mint" />
      <h3 className="text-lg font-semibold text-content">{title}</h3>
      <p className="text-sm text-content-muted">{description}</p>
    </div>
  );
}
