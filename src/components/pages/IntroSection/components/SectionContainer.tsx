interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
