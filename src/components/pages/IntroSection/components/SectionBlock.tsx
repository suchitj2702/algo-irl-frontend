import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../../../../lib/utils';
import SectionContainer from './SectionContainer';

type SectionSurface = 'base' | 'tinted' | 'muted';

interface SectionBlockProps extends ComponentPropsWithoutRef<'section'> {
  children: ReactNode;
  containerClassName?: string;
  surface?: SectionSurface;
}

const surfaceClassNames: Record<SectionSurface, string> = {
  base: 'bg-background',
  tinted:
    'bg-gradient-to-b from-background via-panel-50/70 to-background dark:from-background dark:via-panel-100 dark:to-background',
  muted: 'bg-panel-50/60 dark:bg-panel-100',
};

export default function SectionBlock({
  children,
  className,
  containerClassName,
  surface = 'base',
  ...rest
}: SectionBlockProps) {
  return (
    <section
      className={cn(
        'relative isolate py-[clamp(3.5rem,6vw,6.25rem)] transition-colors duration-300',
        surfaceClassNames[surface],
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-16 before:-translate-y-full before:bg-gradient-to-b before:from-transparent before:via-background/80 before:to-background/0 before:content-[\'\']',
        'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-16 after:translate-y-full after:bg-gradient-to-t after:from-transparent after:via-background/80 after:to-background/0 after:content-[\'\']',
        className,
      )}
      {...rest}
    >
      <SectionContainer className={cn('flex flex-col gap-[clamp(2rem,4vw,3.25rem)]', containerClassName)}>
        {children}
      </SectionContainer>
    </section>
  );
}
