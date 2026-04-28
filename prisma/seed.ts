import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.rule.deleteMany();

  // Layer 1: Voice
  await prisma.rule.create({
    data: {
      ruleType: "brand_voice",
      name: "Voice",
      description: "브랜드 성격 정의",
      severity: "info",
      pattern: JSON.stringify({
        persona: "생활속 친구같은 금융 동반자",
        north_star: "알뜰살뜰 똑똑한 소비습관을 위한 서비스",
        traits: ["따뜻한", "쉬운", "구체적인", "안심되는", "가족적인"],
        anti_traits: ["전문적인", "사무적인", "차가운", "형식적인"],
      }),
    },
  });

  // Layer 2: Writing Principles
  const principles = [
    { name: "한 문장 한 메시지", description: "한 문장에 두 가지 정보를 합치지 않는다", pattern: {} },
    { name: "잡초뽑기", description: "의미 없는 단어 제거", pattern: { weeds: ["현재", "혹시", "물론", "실제로", "기본적으로"], examples: [{ do: "서비스 점검 중이에요.", dont: "현재는 서비스 점검 중입니다." }] } },
    { name: "능동태 + 권유형", description: "능동태와 권유형 문장을 사용한다", pattern: { examples: [{ do: "신청해보세요", dont: "신청이 필요합니다" }] } },
    { name: "구체적 숫자", description: "숫자와 기간으로 구체적으로 말한다", pattern: { examples: [{ do: "1~2일 내에", dont: "빠른 시일 내에" }] } },
    { name: "~해드려요 패턴", description: "서비스가 하는 일은 '~해드려요'로 표현한다", pattern: { examples: [{ do: "3일 이내로 적립 해드려요", dont: "3일 내 적립예정" }] } },
  ];
  for (const p of principles) {
    await prisma.rule.create({
      data: { ruleType: "writing_principle", name: p.name, description: p.description, severity: "warning", pattern: JSON.stringify(p.pattern) },
    });
  }

  // Layer 3: Grammar
  const grammars = [
    { name: "종결어미 통일", description: "일반 안내는 해요체, 중요 공지/법적 안내/공식 알림은 합쇼체(~ㅂ니다)", severity: "error", pattern: { examples: [{ do: "배송 중이에요.", dont: "배송 중이다.", context: "일반 안내" }, { do: "결제가 완료됐어요.", dont: "결제가 완료되었다.", context: "일반 결과" }, { do: "서비스 점검 안내드립니다.", dont: "서비스 점검 안내드려요.", context: "공식 안내/공지" }, { do: "중요한 변경사항을 알려드립니다.", dont: "중요한 변경사항을 알려드려요.", context: "공식 알림" }], exception: ["label", "button", "placeholder"] } },
    { name: "숫자 표기", description: "4자리 이상은 콤마, 단위 붙임", severity: "warning", pattern: { examples: [{ do: "1,000원", dont: "1000원" }, { do: "3개", dont: "3 개" }, { do: "5명", dont: "다섯 명" }, { do: "30초", dont: "30 초" }, { do: "1~2일", dont: "1에서 2일" }] } },
    { name: "날짜 형식", description: "M월 D일 (요일) 형태", severity: "warning", pattern: { examples: [{ do: "4월 25일 (금)", dont: "4/25 (금)" }, { do: "4월 25일", dont: "4.25" }, { do: "2026년 4월 25일", dont: "2026.04.25" }, { do: "오후 2시 30분", dont: "14:30" }, { do: "오전 9시", dont: "09:00" }] } },
    { name: "이모지 사용 지양", description: "이모지 사용을 지양한다. 텍스트만으로 의미를 전달할 것.", severity: "info", pattern: {} },
  ];
  for (const g of grammars) {
    await prisma.rule.create({
      data: { ruleType: "grammar", name: g.name, description: g.description, severity: g.severity, pattern: JSON.stringify(g.pattern) },
    });
  }

  // Layer 4: Component Patterns
  const patterns = [
    { name: "버튼 (button)", pattern: { ui_type: "button", tone: null, pattern_rule: "행동동사 + ~하기/~받기", skip_rules: [], examples: [{ do: "신청하기", dont: "신청" }, { do: "적립받기", dont: "적립받기 클릭" }, { do: "참여하기", dont: "Submit" }] } },
    { name: "라벨 (label)", pattern: { ui_type: "label", tone: null, pattern_rule: null, skip_rules: ["ALL"], examples: [], note: "라벨은 건드리지 않는다. 명사형 유지." } },
    { name: "에러 메시지 (error_message)", pattern: { ui_type: "error_message", tone: "공감하되 가볍지 않게. 해결 방법을 함께 제시.", pattern_rule: "공감 + 해결책", skip_rules: [], examples: [{ do: "연락처 형식을 확인해주세요 (010-0000-0000)", dont: "오류가 발생했습니다" }, { do: "잠시 문제가 생겼어요. 다시 시도해주세요.", dont: "걱정 마세요~! 금방 될 거예요!!" }] } },
    { name: "성공 메시지 (success_message)", pattern: { ui_type: "success_message", tone: "축하하되 과하지 않게. 다음 단계를 함께 안내.", pattern_rule: "완료 + 다음 예상", skip_rules: [], examples: [{ do: "신청 완료! 1~2일 내에 연락드릴게요.", dont: "축하합니다!!! 대단해요!!!" }, { do: "저장했어요.", dont: "처리가 완료되었습니다." }] } },
    { name: "헤드라인 (heading)", pattern: { ui_type: "heading", tone: "쉽고 구체적으로. 가치제안을 숫자와 함께.", pattern_rule: "감성 후킹 + 가치제안", skip_rules: [], examples: [{ do: "하나머니 계좌연결, 30초면 신청 끝!", dont: "간단한 절차를 거치시면 됩니다." }] } },
    { name: "빈 상태 (empty_state)", pattern: { ui_type: "empty_state", tone: "비어있는 이유 + 다음 행동 제안.", pattern_rule: "상태 설명 + 행동 유도", skip_rules: [], examples: [{ do: "아직 신청 내역이 없어요. 첫 신청을 해보세요.", dont: "데이터가 없습니다." }, { do: "검색 결과가 없어요. 다른 키워드로 시도해보세요.", dont: "No results found." }] } },
    { name: "플레이스홀더 (placeholder)", pattern: { ui_type: "placeholder", tone: null, pattern_rule: null, skip_rules: ["ALL"], examples: [], note: "placeholder는 예시 데이터. 건드리지 않는다." } },
  ];
  for (const p of patterns) {
    await prisma.rule.create({
      data: { ruleType: "ui_pattern", name: p.name, description: "", severity: "warning", pattern: JSON.stringify(p.pattern) },
    });
  }

  // Layer 5: Word List
  const words = [
    { term: "하나페이", definition: "하나카드 공식 어플리케이션 이름", aliases: ["원큐페이", "하나pay"] },
    { term: "VISA", definition: "VISA 브랜드 공식 명칭", aliases: ["Visa", "visa"] },
  ];
  for (const w of words) {
    await prisma.rule.create({
      data: { ruleType: "word_list", name: w.term, description: w.definition, severity: "info", pattern: JSON.stringify({ term: w.term, definition: w.definition, aliases: w.aliases }) },
    });
  }

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
