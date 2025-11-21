import { Link } from 'react-router-dom';

export interface EngineeringNote {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  publishedOn: string;
  readingTimeMinutes: number;
}

export const engineeringNotes: Record<string, EngineeringNote> = {
  'distilling-intelligence': {
    slug: 'distilling-intelligence',
    title: 'Distilling Intelligence',
    subtitle: 'How I reduced inference cost by 97% while preserving 96% quality',
    author: 'Suchit Jain',
    publishedOn: 'November 21, 2025',
    readingTimeMinutes: 15
  }
};

export function EngineeringNotesPage() {
  return (
    <div className="min-h-screen bg-panel-50 text-content font-sans">
      <header className="border-b border-outline-subtle/30 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 space-y-6 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl tracking-tight font-light text-content">
            Engineering Notes
          </h1>
          <p className="text-xl md:text-2xl text-content-muted font-light whitespace-nowrap">
            Deep dives into the technical decisions, experiments, and learnings that shape AlgoIRL.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="space-y-8">
          {Object.values(engineeringNotes).map((note) => (
            <Link
              key={note.slug}
              to={`/engineering-notes/${note.slug}`}
              className="block group"
            >
              <article className="rounded-2xl border border-outline-subtle/40 bg-white p-8 transition-all hover:border-primary/40 hover:shadow-lg">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-content-muted">
                    <span>{note.author}</span>
                    <span>·</span>
                    <span>{note.publishedOn}</span>
                    <span>·</span>
                    <span>{note.readingTimeMinutes} min read</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-playfair text-2xl md:text-3xl tracking-tight font-light text-content group-hover:text-primary transition-colors">
                      {note.title}
                    </h2>
                    <p className="text-xl md:text-l text-content-muted font-light">
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
