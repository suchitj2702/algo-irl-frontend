import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useActiveSection } from '@/hooks/useActiveSection';

export interface TocItem {
  title: string;
  slug: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const allHeadingIds = useMemo(() => items.map((item) => item.slug), [items]);
  const activeId = useActiveSection(allHeadingIds);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${slug}`);
    }
  };

  return (
    <aside className={cn('hidden lg:block', className)}>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = activeId === item.slug;
          const isH2 = item.level === 2;

          return (
            <a
              key={item.slug}
              href={`#${item.slug}`}
              onClick={(e) => handleLinkClick(e, item.slug)}
              className={cn(
                'block transition-colors duration-150',
                isH2 ? 'text-sm font-medium py-1.5' : 'text-[13px] pl-3 py-1 text-content-muted',
                isActive
                  ? 'text-primary'
                  : isH2
                    ? 'text-content hover:text-primary'
                    : 'hover:text-content'
              )}
            >
              {item.title}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

/**
 * Parses markdown content and extracts a flat TOC structure (H2 and H3 only)
 */
export function parseTableOfContents(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3}) (.+)$/gm;
  const matches = Array.from(markdown.matchAll(headingRegex));

  return matches.map((match) => ({
    title: match[2].trim(),
    slug: slugify(match[2].trim()),
    level: match[1].length as 2 | 3,
  }));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
