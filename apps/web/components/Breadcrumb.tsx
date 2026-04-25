import { Fragment } from "react";
import { Link } from "../i18n/navigation";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

// The "›" separator is a Bidi-mirrored character (U+203A). In RTL contexts
// the Unicode Bidi algorithm renders it as "‹", which is exactly what we want
// here: the chevron should always point in the reading direction. This is the
// deliberate, opposite case to CLAUDE.md Rule 10 — mirroring is desired.
const SEPARATOR = "›";

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-400">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 rounded-sm"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-gray-600">
                  {SEPARATOR}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
