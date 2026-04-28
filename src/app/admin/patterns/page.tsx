"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

interface PatternData {
  ui_type: string;
  text_type: string;
  tone: string | null;
  pattern_rule: string | null;
  skip_rules: string[];
  examples?: Array<{ do: string; dont: string }>;
  note?: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  pattern: PatternData;
}

interface SkipOption {
  id: string;
  name: string;
  ruleType: string;
}

export default function AdminPatternsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [skipOptions, setSkipOptions] = useState<SkipOption[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        setRules(
          data.rules.filter(
            (r: { ruleType: string }) => r.ruleType === "ui_pattern"
          )
        );
        setSkipOptions(
          data.rules
            .filter((r: { ruleType: string }) =>
              r.ruleType === "writing_principle" || r.ruleType === "grammar"
            )
            .map((r: { id: string; name: string; ruleType: string }) => ({
              id: r.id,
              name: r.name,
              ruleType: r.ruleType,
            }))
        );
      });
  }, []);

  async function handleAdd() {
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType: "ui_pattern",
        name: "새 패턴",
        description: "",
        severity: "warning",
        pattern: {
          ui_type: "new_type",
          text_type: "sentence",
          tone: null,
          pattern_rule: null,
          skip_rules: [],
          examples: [],
        },
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
        pattern: rule.pattern,
      }),
    });
    setSaving(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제할까요?")) return;
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules(rules.filter((r) => r.id !== id));
  }

  function updateRule(id: string, updates: Partial<Rule>) {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function updatePattern(id: string, updates: Partial<PatternData>) {
    setRules(
      rules.map((r) =>
        r.id === id ? { ...r, pattern: { ...r.pattern, ...updates } } : r
      )
    );
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 py-8 px-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Component Patterns 편집</h1>
            <p className="text-gray-500">Layer 4: UI 요소별 패턴 + 톤</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            + 패턴 추가
          </button>
        </div>

        <div>
          {rules.map((rule) => (
            <PatternItem
              key={rule.id}
              rule={rule}
              skipOptions={skipOptions}
              saving={saving === rule.id}
              onSave={() => handleSave(rule)}
              onDelete={() => handleDelete(rule.id)}
              onUpdateRule={(u) => updateRule(rule.id, u)}
              onUpdatePattern={(u) => updatePattern(rule.id, u)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PatternItem({
  rule, skipOptions, saving, onSave, onDelete, onUpdateRule, onUpdatePattern,
}: {
  rule: Rule;
  skipOptions: SkipOption[];
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onUpdateRule: (u: Partial<Rule>) => void;
  onUpdatePattern: (u: Partial<PatternData>) => void;
}) {
  const [open, setOpen] = useState(false);
  const p = rule.pattern;

  return (
    <div className="pb-6 mb-6 border-b border-gray-100 last:border-0">
      {/* 헤더 - 항상 보임 */}
      <div
        className="flex items-center justify-between cursor-pointer py-1"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">{open ? "▼" : "▶"}</span>
          <span className="font-semibold text-sm">{rule.name.replace(/\s*\(.*?\)\s*$/, "")}</span>
          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.ui_type}</span>
          {p.tone && <span className="text-xs text-gray-400 truncate max-w-48">{p.tone}</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-red-400 hover:text-red-600"
        >삭제</button>
      </div>

      {!open && null}
      {open && <div className="mt-4 space-y-4">

      <div className="flex items-center justify-between">
        <input
          type="text"
          value={rule.name}
          onChange={(e) => onUpdateRule({ name: e.target.value })}
          className="font-semibold text-sm border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -ml-1"
        />
      </div>

      {/* ui_type */}
      <div>
        <label className="text-xs text-gray-400">UI 유형</label>
        <input
          type="text"
          value={p.ui_type}
          onChange={(e) => onUpdatePattern({ ui_type: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-gray-400"
          placeholder="예: error_message, button, heading"
        />
        <p className="text-xs text-gray-300 mt-1">테스트 시 선택하는 UI 유형과 동일. 해당 유형의 문구에 이 패턴이 적용됩니다.</p>
      </div>

      {/* description */}
      <div>
        <label className="text-xs text-gray-400">설명</label>
        <input
          type="text"
          value={rule.description}
          onChange={(e) => onUpdateRule({ description: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-gray-400"
          placeholder="이 패턴에 대한 설명"
        />
      </div>

      {/* tone */}
      <div>
        <label className="text-xs text-gray-400">톤</label>
        <input
          type="text"
          value={p.tone || ""}
          onChange={(e) => onUpdatePattern({ tone: e.target.value || null })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-gray-400"
          placeholder="톤 설명 (없으면 비워두세요)"
        />
        <p className="text-xs text-gray-300 mt-1">이 UI 유형에서 사용해야 할 말투를 설명하세요.</p>
      </div>

      {/* pattern_rule */}
      <div>
        <label className="text-xs text-gray-400">패턴 규칙</label>
        <input
          type="text"
          value={p.pattern_rule || ""}
          onChange={(e) => onUpdatePattern({ pattern_rule: e.target.value || null })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-gray-400"
          placeholder="예: 공감 + 해결책"
        />
        <p className="text-xs text-gray-300 mt-1">이 UI 유형의 문구가 갖춰야 할 구조.</p>
      </div>

      {/* skip_rules */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">예외 규칙 (이 UI 유형에서 건너뛸 규칙)</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              const isAll = p.skip_rules.includes("ALL");
              onUpdatePattern({ skip_rules: isAll ? [] : ["ALL"] });
            }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              p.skip_rules.includes("ALL")
                ? "bg-gray-800 border-gray-800 text-white"
                : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            전체 건너뛰기
          </button>
          {!p.skip_rules.includes("ALL") && skipOptions.map((opt) => {
            const checked = p.skip_rules.includes(opt.id);
            const layerLabel = opt.ruleType === "writing_principle" ? "L2" : "L3";
            return (
              <button
                key={opt.id}
                onClick={() => {
                  const next = checked
                    ? p.skip_rules.filter((id) => id !== opt.id)
                    : [...p.skip_rules, opt.id];
                  onUpdatePattern({ skip_rules: next });
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  checked
                    ? "bg-gray-100 border-gray-300 text-gray-700"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {layerLabel} {opt.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* note */}
      <div>
        <label className="text-xs text-gray-400">메모</label>
        <input
          type="text"
          value={p.note || ""}
          onChange={(e) => onUpdatePattern({ note: e.target.value || undefined })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-gray-400"
          placeholder="내부 메모 (선택)"
        />
      </div>

      {/* Do/Don't 예시 */}
      {(p.examples?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {p.examples?.map((ex, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
              <div>
                {i === 0 && <label className="text-xs text-green-600 font-medium mb-1 block">Do</label>}
                <input
                  type="text"
                  value={ex.do}
                  onChange={(e) => {
                    const examples = [...(p.examples || [])];
                    examples[i] = { ...examples[i], do: e.target.value };
                    onUpdatePattern({ examples });
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                  placeholder="좋은 예시"
                />
              </div>
              <div>
                {i === 0 && <label className="text-xs text-red-500 font-medium mb-1 block">Don&apos;t</label>}
                <input
                  type="text"
                  value={ex.dont}
                  onChange={(e) => {
                    const examples = [...(p.examples || [])];
                    examples[i] = { ...examples[i], dont: e.target.value };
                    onUpdatePattern({ examples });
                  }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-red-400"
                  placeholder="나쁜 예시"
                />
              </div>
              <button
                onClick={() => {
                  const examples = (p.examples || []).filter((_, idx) => idx !== i);
                  onUpdatePattern({ examples });
                }}
                className={`text-xs text-red-400 hover:text-red-600 ${i === 0 ? "mt-6" : "mt-1.5"}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <button
          onClick={() => {
            const examples = [...(p.examples || []), { do: "", dont: "" }];
            onUpdatePattern({ examples });
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          + Do/Don&apos;t 추가
        </button>
      </div>

      <div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      </div>}
    </div>
  );
}

