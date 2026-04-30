export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { LayerOverview } from "@/components/LayerOverview";

export default async function HomePage() {
  const rules = await prisma.rule.findMany({
    orderBy: [{ ruleType: "asc" }, { createdAt: "asc" }],
  });

  const parsed = rules.map((r) => ({
    ...r,
    pattern: JSON.parse(r.pattern),
  }));

  const ruleCount = rules.length;

  // Group by ruleType
  const grouped: Record<string, typeof parsed> = {};
  for (const r of parsed) {
    if (!grouped[r.ruleType]) grouped[r.ruleType] = [];
    grouped[r.ruleType].push(r);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">UX Writing System</h1>
      <p className="text-gray-500 mb-8">
        앱의 UI 문구를 일관되게 관리하기 위한 라이팅 규칙 시스템.
      </p>

      <h2 className="text-lg font-semibold mb-3">
        5계층 구조
        <span className="ml-2 text-sm font-normal text-gray-400">
          전체 {ruleCount}개 규칙
        </span>
      </h2>

      <LayerOverview layers={layers} grouped={grouped} />

      {/* 검토 프로세스 */}
      <h2 className="text-lg font-semibold mb-6 mt-10">문구 검토 프로세스</h2>

      {/* 흐름 요약 */}
      <div className="flex items-center gap-2 flex-wrap mb-8 text-sm">
        <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">문구 입력</span>
        <span className="text-gray-300">→</span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">규칙 기반 감사</span>
        <span className="text-gray-300">+</span>
        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">AI 기반 감사</span>
        <span className="text-gray-300">→</span>
        <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">결과 병합</span>
      </div>

      {/* 2레이어 상세 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 규칙 기반 */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-emerald-800">규칙 기반</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-mono">L5</span>
          </div>
          <ul className="space-y-2 text-sm text-emerald-900/70">
            <li>용어집 aliases 매칭 (deterministic)</li>
            <li>틀린 표현 → 올바른 용어 제안</li>
            <li className="text-xs text-emerald-600 pt-1">정확도 ~100%. AI 없이 동작.</li>
          </ul>
        </div>

        {/* AI 기반 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-sm font-semibold text-blue-800">AI 기반</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-mono">L1 + L2 + L3 + L4</span>
          </div>
          <ul className="space-y-2 text-sm text-blue-900/70">
            <li>UI 유형 자동 분류 + 예외 규칙 적용</li>
            <li>종결어미 판단 (해요체/합쇼체)</li>
            <li>잡초뽑기, 날짜/숫자 형식</li>
            <li>톤/구조 판단 + 수정안 생성</li>
            <li className="text-xs text-blue-600 pt-1">정확도 ~80%. gpt-4o 기반.</li>
          </ul>
        </div>
      </div>

      {/* 병합 설명 */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-700">결과 병합</p>
        <p>두 레이어의 위반을 합산하고, 모든 규칙을 반영한 최종 수정 문구를 제안합니다.</p>
        <p>AI 서비스 불가 시 규칙 기반(L5 용어집)만 동작합니다.</p>
      </div>
    </div>
  );
}

const layers = [
  { number: 1, name: "Voice", href: "/voice", ruleType: "brand_voice", description: "브랜드 성격 정의" },
  { number: 2, name: "Writing Principles", href: "/principles", ruleType: "writing_principle", description: "글쓰기 원칙" },
  { number: 3, name: "Grammar & Mechanics", href: "/grammar", ruleType: "grammar", description: "문법/형식 규칙" },
  { number: 4, name: "Component Patterns", href: "/patterns", ruleType: "ui_pattern", description: "UI 요소별 패턴 + 톤" },
  { number: 5, name: "Word List", href: "/wordlist", ruleType: "word_list", description: "용어집" },
];
