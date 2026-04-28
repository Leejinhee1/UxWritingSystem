export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

export default async function PrinciplesPage() {
  const rules = await prisma.rule.findMany({
    where: { ruleType: "writing_principle" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Writing Principles</h1>
      <p className="text-gray-500 mb-8">모든 상황에 적용되는 글쓰기 원칙.</p>

      <div>
        {rules.map((rule) => {
          const pattern = JSON.parse(rule.pattern);
          return (
            <div
              key={rule.id}
              className="pb-5 mb-5 border-b border-gray-100 last:border-0"
            >
              <h3 className="font-semibold mb-1">{rule.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{rule.description}</p>

              {pattern.examples?.length > 0 && (
                <div className="space-y-2">
                  {pattern.examples.map((ex: { do: string; dont: string }, i: number) => (
                    <div key={i} className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-green-50 rounded-lg px-4 py-3 border-l-2 border-green-400">
                        {i === 0 && <p className="text-xs font-medium text-green-600 mb-1">Do</p>}
                        <p className="text-green-800">{ex.do}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg px-4 py-3 border-l-2 border-red-400">
                        {i === 0 && <p className="text-xs font-medium text-red-500 mb-1">Don&apos;t</p>}
                        <p className="text-red-700">{ex.dont}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pattern.weeds && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {pattern.weeds.map((w: string) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
