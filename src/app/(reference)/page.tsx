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

      <div className="flex items-center gap-2 flex-wrap mb-8 text-sm">
        {auditProcess.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium whitespace-nowrap">
              <span className="text-xs text-gray-400">{i + 1}</span>
              {step.title}
            </span>
            {i < auditProcess.length - 1 && (
              <span className="text-gray-300">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4 text-sm">
        {auditProcess.map((step, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-gray-400 shrink-0 w-4 text-right">{i + 1}.</span>
            <div>
              <span className="font-medium text-gray-900">{step.title}</span>
              <span className="text-gray-500"> — {step.description}</span>
              {step.layers && (
                <span className="inline-flex items-center ml-1.5 px-2 py-0.5 bg-gray-900 text-white text-xs rounded font-mono">
                  {step.layers}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-700">2레이어 감사 구조</p>
        <p>규칙 기반 (L3 + L5): 종결어미, 금지 표현, 용어집 aliases 매칭. 정확도 ~100%</p>
        <p>AI 기반 (L1 + L2 + L4): 카테고리 분류, 톤 판단, 수정안 생성. 정확도 ~80%</p>
      </div>
    </div>
  );
}

const auditProcess = [
  { title: "텍스트 수집", description: "검사할 문구를 입력받는다.", layers: null },
  { title: "텍스트 유형 분류", description: "문구가 버튼인지, 라벨인지, 에러 메시지인지 먼저 분류한다.", layers: "L4" },
  { title: "skip_rules 적용", description: "유형별로 적용하지 않을 규칙을 제외한다.", layers: "L4" },
  { title: "규칙 기반 감사", description: "패턴 매칭으로 종결어미, 금지 표현, 용어집 aliases를 체크한다.", layers: "L3 + L5" },
  { title: "AI 기반 감사", description: "Voice, Writing Principles, 해당 UI 유형의 tone과 예시를 AI가 판단한다.", layers: "L1 + L2 + L4" },
  { title: "결과 제시", description: "위반 항목만 표시. 사용자는 적용 또는 무시를 선택.", layers: "L1~L5" },
  { title: "학습 루프", description: "무시하면 예외로 기록. 적용하면 좋은 예시로 축적.", layers: "L4 + L5" },
];

const layers = [
  { number: 1, name: "Voice", href: "/voice", ruleType: "brand_voice", description: "브랜드 성격 정의" },
  { number: 2, name: "Writing Principles", href: "/principles", ruleType: "writing_principle", description: "글쓰기 원칙" },
  { number: 3, name: "Grammar & Mechanics", href: "/grammar", ruleType: "grammar", description: "문법/형식 규칙" },
  { number: 4, name: "Component Patterns", href: "/patterns", ruleType: "ui_pattern", description: "UI 요소별 패턴 + 톤" },
  { number: 5, name: "Word List", href: "/wordlist", ruleType: "word_list", description: "용어집" },
];
