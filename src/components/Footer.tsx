import { LogoWordmark } from './Logo';

interface FooterProps {
  minimal?: boolean;
}

export function Footer({ minimal = false }: FooterProps) {
  if (minimal) {
    return (
      <footer className="py-8">
        <p className="text-center text-xs text-content-muted">
          &copy; 2025 <LogoWordmark className="inline-block h-[0.9em] w-auto align-[-0.22em]" />
        </p>
      </footer>
    );
  }

  return (
    <footer className="bg-surface dark:bg-surface-elevated border-t border-outline-subtle/40">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <p className="text-sm text-content-muted dark:text-content-subtle text-center">
          &copy; 2025 <LogoWordmark className="inline-block h-[0.9em] w-auto align-[-0.22em]" />. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
