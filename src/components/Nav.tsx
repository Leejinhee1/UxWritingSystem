"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "UX Writing System", href: "/" },
  { label: "테스트", href: "/test" },
  { label: "관리", href: "/admin" },
];

export function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
        <span className="font-semibold text-sm text-gray-900 shrink-0">
          UX Writing System
        </span>
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive(tab.href)
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
