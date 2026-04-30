"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "문구 테스트", href: "/test" },
  { label: "일괄 감사", href: "/test/bulk" },
];

export function TestSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 py-6 px-4 overflow-y-auto">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        테스트
      </h3>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                pathname === item.href
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
