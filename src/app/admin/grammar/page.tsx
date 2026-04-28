"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

interface Rule {
  id: string;
  name: string;
  description: string;
  severity: string;
  pattern: {
    detect?: string;
    replacements?: Array<{ from: string; to: string }>;
    exception?: string | string[];
    [key: string]: unknown;
  };
}

export default function AdminGrammarPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [uiTypes, setUiTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        setRules(
          data.rules.filter(
            (r: { ruleType: string }) => r.ruleType === "grammar"
          )
        );
        setUiTypes(
          data.rules
            .filter((r: { ruleType: string }) => r.ruleType === "ui_pattern")
            .map((r: { pattern: { ui_type: string } }) => r.pattern.ui_type)
        );
      });
  }, []);

  async function handleAdd() {
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType: "grammar",
        name: "새 규칙",
        description: "",
        severity: "warning",
        pattern: {},
      }),
    });
    const data = await res.json();
    setRules([...rules, data.rule]);
  }

  async function handleSave(rule: Rule) {
    setSaving(rule.id);
    await fetch(`/api/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        pattern: rule.pattern,
      }),
    });
    setSaving(null);
  }

  function updateRule(id: string, updates: Partial<Rule>) {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function addReplacement(ruleId: string) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const reps = rule.pattern.replacements || [];
    updateRule(ruleId, {
      pattern: {
        ...rule.pattern,
        replacements: [...reps, { from: "", to: "" }],
      },
    });
  }

  function updateReplacement(
    ruleId: string,
    index: number,
    field: "from" | "to",
    value: string
  ) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || !rule.pattern.replacements) return;
    const reps = [...rule.pattern.replacements];
    reps[index] = { ...reps[index], [field]: value };
    updateRule(ruleId, { pattern: { ...rule.pattern, replacements: reps } });
  }

  function removeReplacement(ruleId: string, index: number) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule || !rule.pattern.replacements) return;
    const reps = rule.pattern.replacements.filter((_, i) => i !== index);
    updateRule(ruleId, { pattern: { ...rule.pattern, replacements: reps } });
  }

  function addExample(ruleId: string) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const examples = (rule.pattern.examples as Array<{ do: string; dont: string; context?: string }>) || [];
    updateRule(ruleId, {
      pattern: { ...rule.pattern, examples: [...examples, { do: "", dont: "", context: "" }] },
    });
  }

  function updateExample(ruleId: string, index: number, field: "do" | "dont" | "context", value: string) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const examples = [...((rule.pattern.examples as Array<{ do: string; dont: string; context?: string }>) || [])];
    examples[index] = { ...examples[index], [field]: value };
    updateRule(ruleId, { pattern: { ...rule.pattern, examples } });
  }

  function removeExample(ruleId: string, index: number) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const examples = ((rule.pattern.examples as Array<{ do: string; dont: string; context?: string }>) || []).filter((_, i) => i !== index);
    updateRule(ruleId, { pattern: { ...rule.pattern, examples: examples.length > 0 ? examples : undefined } });
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제할까요?")) return;
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules(rules.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 py-8 px-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Grammar & Mechanics 편집</h1>
            <p className="text-gray-500">Layer 3: 문법/형식 규칙</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            + 규칙 추가
          </button>
        </div>

        <div className="space-y-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="pb-6 mb-6 border-b border-gray-100 last:border-0 space-y-4"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={rule.name}
                  onChange={(e) =>
                    updateRule(rule.id, { name: e.target.value })
                  }
                  className="font-semibold text-sm border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -ml-1"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={rule.severity}
                    onChange={(e) =>
                      updateRule(rule.id, { severity: e.target.value })
                    }
                    className="text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    <option value="error">필수 (반드시 수정)</option>
                    <option value="warning">권장 (수정 권장)</option>
                    <option value="info">참고 (알림만)</option>
                  </select>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={rule.description}
                onChange={(e) =>
                  updateRule(rule.id, { description: e.target.value })
                }
                className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                placeholder="설명"
              />

              {/* Do/Don't 예시 */}
              {((rule.pattern.examples as Array<{ do: string; dont: string; context?: string }>) || []).length > 0 && (
                <div className="space-y-2">
                  {(rule.pattern.examples as Array<{ do: string; dont: string; context?: string }>).map((ex, i) => {
                    const hasContext = (rule.pattern.examples as Array<{ context?: string }>).some((e) => e.context !== undefined);
                    return (
                      <div key={i}>
                        <div className={`grid ${hasContext ? "grid-cols-[1fr_1fr_1fr_auto]" : "grid-cols-[1fr_1fr_auto]"} gap-2 items-start`}>
                          <div>
                            {i === 0 && <label className="text-xs text-green-600 font-medium mb-1 block">Do</label>}
                            <input
                              type="text"
                              value={ex.do}
                              onChange={(e) => updateExample(rule.id, i, "do", e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                              placeholder="좋은 예시"
                            />
                          </div>
                          <div>
                            {i === 0 && <label className="text-xs text-red-500 font-medium mb-1 block">Don&apos;t</label>}
                            <input
                              type="text"
                              value={ex.dont}
                              onChange={(e) => updateExample(rule.id, i, "dont", e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-red-400"
                              placeholder="나쁜 예시"
                            />
                          </div>
                          {hasContext && (
                            <div>
                              {i === 0 && <label className="text-xs text-gray-400 font-medium mb-1 block">맥락</label>}
                              <input
                                type="text"
                                value={ex.context || ""}
                                onChange={(e) => updateExample(rule.id, i, "context", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                                placeholder="예: 일반 안내"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => removeExample(rule.id, i)}
                            className={`text-xs text-red-400 hover:text-red-600 ${i === 0 ? "mt-6" : "mt-1.5"}`}
                          >
                            x
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div>
                <button
                  onClick={() => addExample(rule.id)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  + Do/Don&apos;t 추가
                </button>
              </div>

              {/* exception — 해당 데이터가 있는 규칙에만 표시 */}
              {rule.pattern.exception !== undefined && uiTypes.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">예외 UI 유형 (이 규칙을 적용하지 않는 유형)</label>
                  <div className="flex gap-2 flex-wrap">
                    {uiTypes.map((ut) => {
                      const exceptions = (rule.pattern.exception as unknown as string[]) || [];
                      const checked = exceptions.includes(ut);
                      return (
                        <button
                          key={ut}
                          onClick={() => {
                            const next = checked
                              ? exceptions.filter((e) => e !== ut)
                              : [...exceptions, ut];
                            updateRule(rule.id, {
                              pattern: { ...rule.pattern, exception: next.length > 0 ? next : undefined },
                            });
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            checked
                              ? "bg-gray-100 border-gray-300 text-gray-700"
                              : "border-gray-200 text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          {ut}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <button
                  onClick={() => handleSave(rule)}
                  disabled={saving === rule.id}
                  className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-40"
                >
                  {saving === rule.id ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
