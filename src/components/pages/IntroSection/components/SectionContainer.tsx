interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
  return (
    <div className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 ${className}`}>
      {children}
    </div>
  );
}
