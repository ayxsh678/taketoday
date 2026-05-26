import type { ReactNode } from "react";

type SectionShellProps = {
  children: ReactNode;
  id?: string;
  labelledBy?: string;
  ariaHidden?: true;
};

export function SectionShell({ children, id, labelledBy, ariaHidden }: SectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-hidden={ariaHidden}
      className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28 border-t border-ink-200/70"
    >
      {children}
    </section>
  );
}
