export function IconPanel({ close, className = "h-5 w-5" }: { close?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.75" />
      {close ? (
        <path
          d="M16.25 9.5 13.75 12l2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M13.75 9.5 16.25 12l-2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function IconSearch({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.2 16.2 20.5 20.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconHome({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4.5 11.5 12 5l7.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 10.5V19a1 1 0 0 0 1 1h3.5v-5h2v5H16.5a1 1 0 0 0 1-1v-8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevron({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-bas-hairline px-1 text-[10px] font-medium text-bas-muted">
      {children}
    </kbd>
  );
}
