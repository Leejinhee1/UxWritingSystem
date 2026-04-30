"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "테스트", href: "/test" },
  { label: "관리", href: "/admin" },
];

export function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14">
        <Link href="/" className="font-semibold text-sm text-gray-900 shrink-0 hover:text-gray-600 transition-colors">
          UX Writing System
        </Link>
        <nav className="flex gap-1 ml-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive(tab.href)
                  ? "text-gray-900 font-bold"
                  : "text-gray-600 hover:text-gray-900"
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
