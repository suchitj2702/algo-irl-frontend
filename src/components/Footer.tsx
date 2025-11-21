import { Link } from 'react-router-dom';

interface FooterProps {
  minimal?: boolean;
}

export function Footer({ minimal = false }: FooterProps) {
  if (minimal) {
    return (
      <footer className="py-8">
        <p className="text-center text-xs text-content-muted">
          &copy; 2025 <span className="font-playfair">AlgoIRL</span>
        </p>
      </footer>
    );
  }

  return (
    <footer className="bg-surface dark:bg-surface-elevated border-t border-outline-subtle/40">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <Link
            to="/engineering-notes"
            className="text-sm text-content-muted dark:text-content-subtle hover:text-primary transition-colors"
          >
            Engineering Notes
          </Link>
          <p className="text-sm text-content-muted dark:text-content-subtle">
            &copy; 2025 <span className="font-playfair">AlgoIRL</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
