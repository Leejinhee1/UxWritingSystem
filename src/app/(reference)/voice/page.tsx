export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

export default async function VoicePage() {
  const rule = await prisma.rule.findFirst({
    where: { ruleType: "brand_voice" },
  });

  if (!rule) {
    return <p className="text-gray-500">Voice 데이터가 아직 없어요.</p>;
  }

  const voice = JSON.parse(rule.pattern);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Voice</h1>
      <p className="text-gray-500 mb-8">
        우리 브랜드가 &quot;누구&quot;인가를 정의합니다.
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          페르소나
        </h2>
        <p className="text-lg">{voice.persona}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          북극성
        </h2>
        <p className="text-lg font-medium">&quot;{voice.north_star}&quot;</p>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Do
          </h2>
          <div className="space-y-2">
            {voice.traits?.map((t: string) => (
              <span
                key={t}
                className="inline-block mr-2 mb-2 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Don&apos;t
          </h2>
          <div className="space-y-2">
            {voice.anti_traits?.map((t: string) => (
              <span
                key={t}
                className="inline-block mr-2 mb-2 px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full border border-red-200"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
