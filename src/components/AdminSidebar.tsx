"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { label: "Voice", href: "/admin/voice", layer: 1 },
  { label: "Writing Principles", href: "/admin/principles", layer: 2 },
  { label: "Grammar & Mechanics", href: "/admin/grammar", layer: 3 },
  { label: "Component Patterns", href: "/admin/patterns", layer: 4 },
  { label: "Word List", href: "/admin/wordlist", layer: 5 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 py-6 px-4 overflow-y-auto flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        규칙 관리
      </h3>
      <ul className="space-y-0.5 flex-1">
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
              <span className="text-[10px] font-mono text-gray-400 w-4 shrink-0">
                L{item.layer}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors"
      >
        로그아웃
      </button>
    </aside>
  );
}
