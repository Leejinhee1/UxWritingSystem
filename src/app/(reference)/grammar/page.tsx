import { prisma } from "@/lib/db";

export default async function GrammarPage() {
  const rules = await prisma.rule.findMany({
    where: { ruleType: "grammar" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Grammar & Mechanics</h1>
      <p className="text-gray-500 mb-8">
        기계적으로 체크 가능한 문법/형식 규칙.
      </p>

      <div>
        {rules.map((rule) => {
          const pattern = JSON.parse(rule.pattern);
          const examples = (pattern.examples as Array<{ do: string; dont: string; context?: string }>) || [];

          return (
            <div
              key={rule.id}
              className="pb-5 mb-5 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    rule.severity === "error"
                      ? "bg-red-100 text-red-700"
                      : rule.severity === "warning"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {rule.severity === "error" ? "필수" : rule.severity === "warning" ? "권장" : "참고"}
                </span>
                <h3 className="font-semibold">{rule.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{rule.description}</p>

              {/* Do / Don't 쌍별 비교 */}
              {examples.length > 0 && (
                <div className="space-y-2">
                  {examples.map((ex, i) => (
                    <div key={i}>
                      {ex.context && (
                        <p className="text-xs text-gray-400 mb-1">{ex.context}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-sm bg-green-50 px-3 py-2 rounded border-l-2 border-green-400">
                          {i === 0 && <p className="text-xs font-medium text-green-600 mb-1">Do</p>}
                          {ex.do}
                        </div>
                        <div className="text-sm bg-red-50 px-3 py-2 rounded border-l-2 border-red-400">
                          {i === 0 && <p className="text-xs font-medium text-red-500 mb-1">Don&apos;t</p>}
                          {ex.dont}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pattern.detect && (
                <p className="text-xs text-gray-400 mt-3 font-mono">
                  detect: {pattern.detect}
                </p>
              )}
              {pattern.exception && (
                <p className="text-xs text-gray-400 mt-1">
                  예외: {Array.isArray(pattern.exception) ? pattern.exception.join(", ") : pattern.exception}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
