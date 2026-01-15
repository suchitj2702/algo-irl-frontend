import { Link } from 'react-router-dom';
import { LinkedInIcon } from '../icons/LinkedInIcon';

export interface EngineeringNote {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  linkedinUrl?: string;
  publishedOn: string;
  readingTimeMinutes: number;
}

export const engineeringNotes: Record<string, EngineeringNote> = {
  'distilling-intelligence': {
    slug: 'distilling-intelligence',
    title: 'Distilling Intelligence',
    subtitle: 'How I reduced inference cost by 97% while preserving 96% quality',
    author: 'Suchit Jain',
    linkedinUrl: 'https://www.linkedin.com/in/suchit-jain/',
    publishedOn: 'November 21, 2025',
    readingTimeMinutes: 15
  }
};

export function EngineeringNotesPage() {
  return (
    <div className="min-h-screen bg-panel-50 dark:bg-background text-content font-sans">
      <header className="border-b border-outline-subtle/30 dark:border-panel-200 bg-white dark:bg-panel-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-[clamp(2.5rem,5vw,4rem)] space-y-3 sm:space-y-4 text-center">
          <h1 className="font-playfair text-3xl sm:text-4xl tracking-tight font-light text-content">
            Engineering Notes
          </h1>
          <p className="text-sm sm:text-base text-content-muted font-light">
            Deep dives into the technical decisions, experiments, and learnings that shape AlgoIRL.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-[clamp(2.5rem,5vw,4rem)]">
        <div className="space-y-4 sm:space-y-6">
          {Object.values(engineeringNotes).map((note) => (
            <Link
              key={note.slug}
              to={`/engineering-notes/${note.slug}`}
              className="block group"
            >
              <article className="rounded-xl sm:rounded-2xl border border-outline-subtle/40 dark:border-panel-200 bg-white dark:bg-panel-50 p-4 sm:p-6 transition-all hover:border-primary/40 hover:shadow-lg">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-content-muted">
                    <div className="flex items-center gap-1.5">
                      <span>{note.author}</span>
                      {note.linkedinUrl && (
                        <a
                          href={note.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-content-muted hover:text-primary transition-colors"
                          aria-label="Connect on LinkedIn"
                        >
                          <LinkedInIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                      )}
                    </div>
                    <span>·</span>
                    <span>{note.publishedOn}</span>
                    <span>·</span>
                    <span>{note.readingTimeMinutes} min read</span>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h2 className="font-playfair text-lg sm:text-xl tracking-tight font-light text-content group-hover:text-primary transition-colors">
                      {note.title}
                    </h2>
                    <p className="text-sm sm:text-base text-content-muted font-light">
                      {note.subtitle}
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
