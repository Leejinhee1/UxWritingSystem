import { prisma } from "@/lib/db";

export default async function PatternsPage() {
  const rules = await prisma.rule.findMany({
    where: { ruleType: "ui_pattern" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Component Patterns</h1>
      <p className="text-gray-500 mb-8">
        UI 요소 유형별 패턴 + 톤.
      </p>

      <div>
        {rules.map((rule) => {
          const p = JSON.parse(rule.pattern);
          const examples = (p.examples as Array<{ do: string; dont: string }>) || [];

          return (
            <div
              key={rule.id}
              className="pb-6 mb-6 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{rule.name.replace(/\s*\(.*?\)\s*$/, "")}</h3>
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                  {p.ui_type}
                </span>
              </div>

              {p.tone && (
                <p className="text-sm text-gray-600 mb-3 bg-blue-50 px-3 py-2 rounded">
                  톤: {p.tone}
                </p>
              )}

              {p.pattern_rule && (
                <p className="text-sm text-gray-600 mb-3">
                  패턴: {p.pattern_rule}
                </p>
              )}

              {/* Do / Don't 쌍별 비교 */}
              {examples.length > 0 && (
                <div className="space-y-2 mt-3">
                  {examples.map((ex, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <div className="text-sm bg-green-50 px-3 py-2 rounded border-l-2 border-green-400">
                        {i === 0 && <p className="text-xs font-medium text-green-600 mb-1">Do</p>}
                        {ex.do}
                      </div>
                      <div className="text-sm bg-red-50 px-3 py-2 rounded border-l-2 border-red-400">
                        {i === 0 && <p className="text-xs font-medium text-red-500 mb-1">Don&apos;t</p>}
                        {ex.dont}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {p.note && (
                <p className="text-sm text-gray-500 mt-3 italic">{p.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
