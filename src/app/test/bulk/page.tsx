"use client";

import { useState, useEffect } from "react";

interface Violation {
  ruleId: string;
  ruleType: string;
  name: string;
  message: string;
  severity: string;
}

interface BulkResult {
  audit_id: string;
  text: string;
  ui_type_detected: string;
  violations: Violation[];
  combined_suggestion: string | null;
  pass: boolean;
}

interface Summary {
  total: number;
  pass: number;
  fail: number;
  passRate: number;
  violationsByLayer: Record<string, number>;
}

interface FeedbackState {
  feedback: "good" | "bad" | null;
  badReason: string;
  sent: boolean;
}

export default function BulkTestPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<(BulkResult | null)[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [uiTypes, setUiTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [feedbacks, setFeedbacks] = useState<Record<number, FeedbackState>>({});

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

  async function handleBulkAudit() {
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setLoading(true);
    setResults([]);
    setSummary(null);
    setFeedbacks({});
    setUiTypeOverrides({});
    setRetrying({});
    setProgress(`${lines.length}개 문구 검사 중...`);

    try {
      const res = await fetch("/api/audit/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((text) => ({ text })),
        }),
      });
      const data = await res.json();
      setResults(data.results);
      setSummary(data.summary);
    } catch {
      setProgress("검사 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  // UI 유형 오버라이드 (드롭다운 변경 시 저장만)
  const [uiTypeOverrides, setUiTypeOverrides] = useState<Record<number, string>>({});
  const [retrying, setRetrying] = useState<Record<number, boolean>>({});

  async function handleRetry(index: number) {
    const item = results[index];
    if (!item) return;

    const uiType = uiTypeOverrides[index] || item.ui_type_detected;

    setRetrying((prev) => ({ ...prev, [index]: true }));

    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: item.text, ui_type: uiType }),
    });
    const data = await res.json();

    // 피드백 초기화
    setFeedbacks((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    setRetrying((prev) => ({ ...prev, [index]: false }));

    setResults((prev) => {
      const next = [...prev];
      next[index] = {
        audit_id: data.audit_id,
        text: item.text,
        ui_type_detected: data.ui_type_detected,
        violations: data.violations,
        combined_suggestion: data.combined_suggestion,
        pass: data.pass,
      };
      return next;
    });
  }

  function updateFeedback(index: number, update: Partial<FeedbackState>) {
    setFeedbacks((prev) => ({
      ...prev,
      [index]: { ...{ feedback: null, badReason: "", sent: false }, ...prev[index], ...update },
    }));
  }

  async function sendFeedback(index: number, feedback: "good" | "bad", reason?: string) {
    const item = results[index];
    if (!item) return;

    updateFeedback(index, { feedback, sent: true });

    await fetch(`/api/audit/${item.audit_id}/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, feedbackReason: reason }),
    });
  }

  const lineCount = input.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">일괄 감사</h1>
      <p className="text-gray-500 mb-6 text-sm">
        여러 문구를 한번에 검사합니다. 줄바꿈으로 구분하세요.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"검사할 문구를 입력하세요 (줄바꿈으로 구분)\n\n예시:\n결제가 완료되었다.\nvisa 카드로 결제하세요.\n3/4 이벤트 오픈!"}
        className="w-full border border-gray-300 rounded-lg p-4 text-sm resize-none h-48 focus:outline-none focus:border-gray-500"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {lineCount > 0 ? `${lineCount}개 문구` : ""}
        </span>
        <button
          onClick={handleBulkAudit}
          disabled={loading || lineCount === 0}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {loading ? progress || "검사 중..." : "일괄 테스트"}
        </button>
      </div>

      {/* 요약 */}
      {summary && (
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">전체</span>{" "}
              <span className="font-medium">{summary.total}건</span>
            </div>
            <div>
              <span className="text-green-600">통과</span>{" "}
              <span className="font-medium">{summary.pass}건</span>
            </div>
            <div>
              <span className="text-red-500">위반</span>{" "}
              <span className="font-medium">{summary.fail}건</span>
            </div>
            <div>
              <span className="text-gray-400">통과율</span>{" "}
              <span className={`font-medium ${summary.passRate >= 80 ? "text-green-600" : summary.passRate >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                {summary.passRate}%
              </span>
            </div>
          </div>
          {Object.keys(summary.violationsByLayer).length > 0 && (
            <div className="mt-3 flex gap-3 text-xs text-gray-500">
              <span>위반 분포:</span>
              {Object.entries(summary.violationsByLayer)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([layer, count]) => (
                  <span key={layer} className="bg-gray-100 px-2 py-0.5 rounded">
                    {layer} {count}건
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 결과 목록 */}
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r, i) => {
            if (!r) return null;
            return (
              <div key={`${r.audit_id}-${i}`} className="border-b border-gray-100 pb-3">
                <div className="flex items-start gap-3">
                  {/* 통과/위반 뱃지 */}
                  <span
                    className={`mt-0.5 shrink-0 text-xs px-2 py-0.5 rounded font-medium ${
                      r.pass
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {r.pass ? "통과" : `위반 ${r.violations.length}`}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* 원문 */}
                    <p className={`text-sm ${r.combined_suggestion ? "text-red-400 line-through" : "text-gray-700"}`}>
                      {r.text}
                    </p>

                    {/* 수정 제안 */}
                    {r.combined_suggestion && (
                      <p className="text-sm text-green-700 font-medium mt-0.5">
                        {r.combined_suggestion}
                      </p>
                    )}

                    {/* 위반 상세 */}
                    {r.violations.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {r.violations.map((v, vi) => (
                          <li key={vi} className="text-xs text-gray-400">
                            <span className={`inline-block px-1 py-0.5 rounded mr-1 ${
                              v.ruleId === "ai" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                            }`}>
                              {v.ruleId === "ai" ? "AI" : "규칙"}
                            </span>
                            {v.name} — {v.message}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 피드백 */}
                    {(() => {
                      const fb = feedbacks[i] || { feedback: null, badReason: "", sent: false };
                      if (fb.sent) {
                        return (
                          <p className="mt-2 text-xs text-gray-400">
                            피드백 완료 {fb.feedback === "good" ? "👍" : "👎"}
                          </p>
                        );
                      }
                      return (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => sendFeedback(i, "good")}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                fb.feedback === "good"
                                  ? "bg-green-50 border-green-300 text-green-700"
                                  : "border-gray-200 text-gray-400 hover:border-gray-300"
                              }`}
                            >
                              👍
                            </button>
                            <button
                              onClick={() => updateFeedback(i, { feedback: "bad" })}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                fb.feedback === "bad"
                                  ? "bg-red-50 border-red-300 text-red-700"
                                  : "border-gray-200 text-gray-400 hover:border-gray-300"
                              }`}
                            >
                              👎
                            </button>
                          </div>
                          {fb.feedback === "bad" && !fb.sent && (
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={fb.badReason}
                                onChange={(e) => updateFeedback(i, { badReason: e.target.value })}
                                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-gray-400"
                                placeholder="어떤 점이 문제였나요?"
                              />
                              <button
                                onClick={() => sendFeedback(i, "bad", fb.badReason)}
                                className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                              >
                                전송
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* UI 유형 + 재검사 */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <select
                      value={uiTypeOverrides[i] ?? r.ui_type_detected}
                      onChange={(e) =>
                        setUiTypeOverrides((prev) => ({ ...prev, [i]: e.target.value }))
                      }
                      className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-500 bg-white focus:outline-none focus:border-gray-400"
                    >
                      <option value={r.ui_type_detected}>{r.ui_type_detected}</option>
                      {uiTypes
                        .filter((ut) => ut.value !== r.ui_type_detected)
                        .map((ut) => (
                          <option key={ut.value} value={ut.value}>
                            {ut.value}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleRetry(i)}
                      disabled={retrying[i]}
                      className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
                    >
                      {retrying[i] ? "..." : "재검사"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 테스트 묶음 */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-4">테스트 묶음 (클릭하면 입력창에 붙여넣기)</p>
        <div className="space-y-4">
          {[
            {
              label: "결제 완료 페이지",
              lines: [
                "결제가 완료되었다.",
                "주문번호: 20260501-001",
                "배송 예정일: 5/3",
                "visa 카드로 결제되었습니다.",
                "주문 상세 보기",
                "홈으로 돌아가기",
              ],
            },
            {
              label: "에러/빈 상태 모음",
              lines: [
                "오류가 발생했습니다.",
                "Error: invalid input",
                "네트워크 연결에 실패했습니다.",
                "데이터가 없습니다.",
                "No results found.",
                "잠시 후 다시 시도해주세요.",
              ],
            },
            {
              label: "회원가입 폼",
              lines: [
                "회원가입",
                "이메일을 입력해주세요",
                "비밀번호는 8자 이상이어야 한다.",
                "이미 가입된 이메일입니다.",
                "가입 완료! 축하합니다!!!",
                "로그인하기",
              ],
            },
            {
              label: "안내/공지 영역",
              lines: [
                "서비스 점검 안내드립니다.",
                "현재는 오픈뱅킹 점검시간입니다.",
                "2026.05.10 업데이트 예정",
                "중요한 변경사항을 알려드립니다.",
                "환율 100% 우대입니다.",
                "자세히 보기",
              ],
            },
            {
              label: "상품 상세 페이지",
              lines: [
                "정기배송을 신청하세요.",
                "농장 추천 서비스를 이용해보세요.",
                "1000원 할인 적용",
                "빠른 시일 내에 처리하겠습니다.",
                "혹시 궁금한 점이 있으시면 문의해주세요.",
                "장바구니 담기",
                "바로 구매하기",
              ],
            },
            {
              label: "종결어미 혼합 (해요체/합쇼체)",
              lines: [
                "결제가 완료되었습니다.",
                "로그인이 필요합니다.",
                "배송이 시작되었습니다.",
                "포인트가 적립되었어요.",
                "신청이 필요합니다.",
                "공룡은 사용할 수 없다.",
              ],
            },
            {
              label: "잡초뽑기 테스트",
              lines: [
                "현재는 서비스 점검 중입니다.",
                "혹시 궁금한 점이 있으시면 문의해주세요.",
                "물론 가능합니다.",
                "현재 대기중인 인원이 5명 있습니다.",
                "간단한 절차를 거치시면 됩니다.",
              ],
            },
          ].map((bundle) => (
            <div
              key={bundle.label}
              onClick={() => setInput(bundle.lines.join("\n"))}
              className="group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  {bundle.label}
                  <span className="text-xs text-gray-300 ml-2">{bundle.lines.length}개</span>
                </p>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-gray-300 transition-opacity shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 truncate">
                {bundle.lines.slice(0, 3).join(" / ")}...
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
