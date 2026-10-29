/** The Pepea mark: a dotted crossing between two points. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className={className} fill="none">
      <path d="M3 21C8 5 20 5 25 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 4.6" />
      <circle cx="3" cy="21" r="2.4" fill="currentColor" />
      <circle cx="25" cy="21" r="2.4" fill="currentColor" />
    </svg>
  );
}
