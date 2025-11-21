import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import distillingIntelligence from '../../content/engineering-notes/distilling-intelligence.md?raw';
import { Footer } from '../Footer';
import { cn } from '@/lib/utils';
import { getDiagramComponent } from './diagrams/CaseStudyDiagrams';
import type { Components } from 'react-markdown';
import { engineeringNotes } from './EngineeringNotesPage';
import { TableOfContents, parseTableOfContents } from './TableOfContents';

const noteData = engineeringNotes['distilling-intelligence'];

const firstHeadingIndex = distillingIntelligence.indexOf('## ');
const heroMarkdown =
  firstHeadingIndex === -1 ? distillingIntelligence : distillingIntelligence.slice(0, firstHeadingIndex);
const bodyMarkdown = firstHeadingIndex === -1 ? '' : distillingIntelligence.slice(firstHeadingIndex);

// Parse the TOC from the markdown content
const tocItems = parseTableOfContents(bodyMarkdown);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((child) => extractText(child)).join('');
  }
  if (typeof children === 'object' && children !== null && 'props' in children) {
    // @ts-expect-error children typing
    return extractText(children.props?.children ?? '');
  }
  return '';
}

const createMarkdownComponents = (variant: 'hero' | 'body'): Components => ({
  h2: ({ children }) => (
    <h2
      id={variant === 'body' ? slugify(extractText(children)) : undefined}
      className={cn(
        'font-playfair tracking-tight font-light scroll-mt-24',
        variant === 'hero'
          ? 'text-4xl md:text-5xl text-content mb-5'
          : 'text-3xl md:text-4xl text-content mb-5'
      )}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={variant === 'body' ? slugify(extractText(children)) : undefined}
      className={cn(
        'font-light scroll-mt-24',
        variant === 'hero' ? 'text-xl text-content mt-6 mb-3' : 'text-2xl text-content mt-4 mb-3'
      )}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      id={variant === 'body' ? slugify(extractText(children)) : undefined}
      className={cn('font-semibold text-base tracking-wide text-primary mb-3 scroll-mt-24')}
    >
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p
      className={cn(
        'leading-relaxed',
        variant === 'hero' ? 'text-content-muted text-sm sm:text-base mb-5' : 'text-content-muted text-sm sm:text-base mb-5'
      )}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul
      className={cn(
        'space-y-3 pl-5 marker:text-primary list-disc text-sm sm:text-base',
        variant === 'hero' ? 'text-content-muted' : 'text-content-muted'
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className={cn(
        'space-y-3 pl-6 list-decimal text-sm sm:text-base',
        variant === 'hero' ? 'text-content-muted' : 'text-content-muted'
      )}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed text-sm sm:text-base">
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className={cn('font-semibold text-content')}>
      {children}
    </strong>
  ),
  hr: () => <hr className="my-12 border-outline-subtle/30" />,
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded-md bg-panel-100 px-2 py-0.5 text-sm text-content">{children}</code>
    ) : (
      <code className="block whitespace-pre-wrap rounded-2xl bg-panel-100 p-4 text-sm text-content">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-2xl border border-outline-subtle/40 bg-panel-50 p-6 text-sm text-content">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline-offset-4 hover:opacity-80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 -mx-6 sm:mx-0 overflow-x-auto rounded-none sm:rounded-2xl border-y sm:border border-outline-subtle/30 bg-white">
      <table className="min-w-[600px] w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-panel-100 text-xs uppercase text-content-muted tracking-widest">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-outline-subtle/20">{children}</tbody>,
  th: ({ children }) => <th className="px-3 sm:px-4 py-3 font-semibold text-content whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-3 sm:px-4 py-3 text-content-muted text-sm">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/60 pl-4 italic text-content text-sm sm:text-base">{children}</blockquote>
  ),
  img: ({ alt }) => {
    const diagram = getDiagramComponent(alt);
    if (diagram) {
      return (
        <figure className="mt-4 mb-4">
          <div>{diagram}</div>
        </figure>
      );
    }
    return null;
  }
});

export function DistillingIntelligencePage() {
  return (
    <div className="bg-panel-50 text-content font-sans">
      {/* Header spans full width */}
      <header className="border-b border-outline-subtle/30 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="font-playfair text-4xl md:text-5xl tracking-tight font-light text-content">
                {noteData.title}
              </h1>
              <p className="text-xl md:text-2xl text-content-muted font-light">
                {noteData.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-content-muted">
              <span>{noteData.author}</span>
              <span>·</span>
              <span>{noteData.publishedOn}</span>
              <span>·</span>
              <span>{noteData.readingTimeMinutes} min read</span>
            </div>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents('hero')}>
            {heroMarkdown}
          </ReactMarkdown>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[240px_1fr_240px]">
        {/* Sidebar - sticky on left */}
        <div className="hidden lg:block">
          <TableOfContents
            items={tocItems}
            className="sticky top-24 pl-6 pr-4 pt-16 pb-8 max-h-[calc(100vh-6rem)] overflow-y-auto"
          />
        </div>

        {/* Article content - centered in middle column */}
        <main className="px-6 py-16">
          <article className="prose max-w-none text-content prose-h2:text-3xl prose-h3:text-2xl prose-strong:text-content prose-code:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents('body')}>
              {bodyMarkdown}
            </ReactMarkdown>
          </article>
        </main>
      </div>

      <Footer />
    </div>
  );
}
