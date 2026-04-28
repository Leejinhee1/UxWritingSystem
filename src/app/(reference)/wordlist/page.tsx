import { prisma } from "@/lib/db";

export default async function WordListPage() {
  const rules = await prisma.rule.findMany({
    where: { ruleType: "word_list" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Word List</h1>
      <p className="text-gray-500 mb-8">
        서비스에서 사용하는 공식 용어 목록.
      </p>

      <div className="space-y-4">
        {rules.map((rule) => {
          const p = JSON.parse(rule.pattern);
          return (
            <div
              key={rule.id}
              className="pb-5 mb-5 border-b border-gray-100 last:border-0"
            >
              <h3 className="font-semibold text-lg mb-1">{p.term}</h3>
              <p className="text-sm text-gray-600 mb-3">{p.definition}</p>

              {p.aliases?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-2">
                    이렇게 쓰지 마세요
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {p.aliases.map((alias: string) => (
                      <span
                        key={alias}
                        className="px-2.5 py-1 bg-red-50 text-red-600 text-sm rounded-full border border-red-200"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
