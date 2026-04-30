"use client";

import { useState, useEffect } from "react";

interface Violation {
  ruleId: string;
  ruleType: string;
  name: string;
  message: string;
  severity: string;
}

interface Suggestion {
  original: string;
  suggested: string;
  reason: string;
}

interface AuditResult {
  audit_id: string;
  ui_type_detected: string;
  violations: Violation[];
  suggestions: Suggestion[];
  combined_suggestion: string | null;
  pass: boolean;
}

export default function TestPage() {
  const [text, setText] = useState("");
  const [uiType, setUiType] = useState("");
  const [uiTypes, setUiTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [showJson, setShowJson] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [badReason, setBadReason] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        const patterns = data.rules
          .filter((r: { ruleType: string }) => r.ruleType === "ui_pattern")
          .map((r: { name: string; pattern: { ui_type: string } }) => ({
            value: r.pattern.ui_type,
            label: r.name.replace(/\s*\(.*?\)\s*$/, ""),
          }));
        setUiTypes(patterns);
      });
  }, []);

  async function handleAudit() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setFeedback(null);
    setBadReason("");
    setFeedbackSent(false);

    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ui_type: uiType || undefined }),
    });
    const data = await res.json();
    setResult(data);
    setRawJson(JSON.stringify(data, null, 2));
    setLoading(false);
  }

  const ruleViolations = result?.violations.filter((v) => v.ruleId !== "ai") || [];
  const aiViolations = result?.violations.filter((v) => v.ruleId === "ai") || [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">문구 테스트</h1>
      <p className="text-gray-500 mb-6">
        문구를 입력하면 라이팅 규칙에 따라 검사합니다.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="검사할 문구를 입력하세요"
        className="w-full border border-gray-300 rounded-lg p-4 text-sm resize-none h-32 focus:outline-none focus:border-gray-500"
      />

      <div className="mt-3 flex items-center gap-3">
        <select
          value={uiType}
          onChange={(e) => setUiType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-500 bg-white"
        >
          <option value="">UI 유형 (자동 감지)</option>
          {uiTypes.map((ut) => (
            <option key={ut.value} value={ut.value}>{ut.label}</option>
          ))}
        </select>
        <button
          onClick={handleAudit}
          disabled={loading || !text.trim()}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {loading ? "검사 중..." : "테스트하기"}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          {/* 통과/위반 요약 */}
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              result.pass
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {result.pass
              ? "통과 - 위반 사항이 없어요."
              : `위반 ${result.violations.length}건 발견`}
            {result.ui_type_detected && result.ui_type_detected !== "auto" && (
              <span className="ml-2 text-xs opacity-70">
                UI 유형: {result.ui_type_detected}
              </span>
            )}
          </div>

          {/* 최종 수정 문구 */}
          {result.combined_suggestion && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-600 mb-3">
                최종 수정 제안
              </p>
              <p className="text-sm text-red-400 line-through mb-1">{text}</p>
              <p className="text-sm text-green-700 font-medium">
                {result.combined_suggestion}
              </p>
            </div>
          )}

          {/* 적용된 규칙 */}
          {result.violations.length > 0 && (
            <div className="space-y-3">
              {ruleViolations.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-gray-100 text-gray-600">
                      규칙
                    </span>
                  </div>
                  <ul className="ml-10 space-y-1">
                    {ruleViolations.map((v, i) => (
                      <li key={`r-${i}`} className="text-gray-600">
                        {v.name} <span className="text-gray-400">— {v.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiViolations.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-blue-100 text-blue-700">
                      AI
                    </span>
                  </div>
                  <ul className="ml-10 space-y-1">
                    {aiViolations.map((v, i) => (
                      <li key={`a-${i}`} className="text-gray-600">
                        {v.name} <span className="text-gray-400">— {v.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 피드백 */}
          <div className="pt-4 border-t border-gray-100">
            {feedbackSent ? (
              <p className="text-xs text-gray-400">피드백 완료 {feedback === "good" ? "👍" : "👎"}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">이 결과가 도움이 됐나요?</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setFeedback("good");
                      setFeedbackSent(true);
                      await fetch(`/api/audit/${result.audit_id}/feedback`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ feedback: "good" }),
                      });
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      feedback === "good" ? "bg-green-50 border-green-300 text-green-700" : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    👍 Good
                  </button>
                  <button
                    onClick={() => setFeedback("bad")}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      feedback === "bad" ? "bg-red-50 border-red-300 text-red-700" : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    👎 Bad
                  </button>
                </div>
                {feedback === "bad" && !feedbackSent && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={badReason}
                      onChange={(e) => setBadReason(e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400"
                      placeholder="어떤 점이 문제였나요?"
                    />
                    <button
                      onClick={async () => {
                        setFeedbackSent(true);
                        await fetch(`/api/audit/${result.audit_id}/feedback`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ feedback: "bad", feedbackReason: badReason }),
                        });
                      }}
                      className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      전송
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* JSON 토글 */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowJson(!showJson)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showJson ? "JSON 숨기기" : "JSON 보기"}
            </button>

            {showJson && (
              <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 overflow-x-auto">
                {rawJson}
              </pre>
            )}
          </div>
        </div>
      )}
      {/* 예시 문구 */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-4">예시 문구 (클릭하면 복사)</p>
        <div className="space-y-5">
          {[
            { label: "종결어미 — 평서형(~다 체)", samples: [
              "공룡은 사용할 수 없다.",
              "결제가 완료되었다.",
              "배송 중이다.",
              "로그인이 필요하다.",
            ]},
            { label: "종결어미 — 합쇼체/해요체 판단", samples: [
              "현재는 서비스 점검 중입니다.",
              "로그인이 필요합니다.",
              "환율 100% 우대입니다.",
              "중요한 변경사항을 알려드립니다.",
              "서비스 점검 안내드립니다.",
            ]},
            { label: "잡초뽑기", samples: [
              "현재는 오픈뱅킹 점검시간입니다.",
              "혹시 궁금한 점이 있으시면 문의해주세요.",
              "물론 가능합니다.",
              "현재 대기중인 인원이 5명 있습니다.",
            ]},
            { label: "구체적 숫자 / 능동태", samples: [
              "빠른 시일 내에 처리하겠습니다.",
              "신청이 필요합니다.",
            ]},
            { label: "날짜/숫자 형식", samples: [
              "3/4 이벤트 오픈!",
              "2026.04.25 업데이트 예정",
              "1000원 할인 적용",
            ]},
            { label: "용어집 (L5)", samples: [
              "visa 카드로 결제하세요.",
              "농장 추천 서비스를 이용해보세요.",
              "정기배송을 신청하세요.",
            ]},
            { label: "에러 메시지", samples: [
              "오류가 발생했습니다.",
              "Error: invalid input",
              "네트워크 연결에 실패했습니다.",
            ]},
            { label: "성공 메시지", samples: [
              "처리가 완료되었습니다.",
              "축하합니다!!! 대단해요!!!",
            ]},
            { label: "빈 상태", samples: [
              "데이터가 없습니다.",
              "No results found.",
            ]},
            { label: "헤드라인", samples: [
              "간단한 절차를 거치시면 됩니다.",
            ]},
            { label: "버튼", samples: [
              "신청",
              "Submit",
              "매칭 받기 클릭",
            ]},
          ].map((group) => (
            <div key={group.label}>
              <p className="text-xs text-gray-300 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.samples.map((sample) => (
                  <div
                    key={sample}
                    onClick={() => navigator.clipboard.writeText(sample)}
                    className="flex items-center justify-between group text-sm text-gray-500 hover:text-gray-700 py-1 cursor-pointer"
                  >
                    <span>{sample}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-gray-300 transition-opacity flex-shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
