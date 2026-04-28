"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "라이팅 시스템",
    items: [
      { label: "개요", href: "/", layer: null },
      { label: "Voice", href: "/voice", layer: 1 },
      { label: "Writing Principles", href: "/principles", layer: 2 },
      { label: "Grammar & Mechanics", href: "/grammar", layer: 3 },
      { label: "Component Patterns", href: "/patterns", layer: 4 },
      { label: "Word List", href: "/wordlist", layer: 5 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 py-6 px-4 overflow-y-auto">
      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.layer !== null && (
                    <span className="text-[10px] font-mono text-gray-400 w-4 shrink-0">
                      L{item.layer}
                    </span>
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
