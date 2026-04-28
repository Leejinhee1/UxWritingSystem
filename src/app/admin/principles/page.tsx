"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

interface Example {
  do: string;
  dont: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  severity: string;
  pattern: {
    weeds?: string[];
    examples?: Example[];
  };
}

export default function AdminPrinciplesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        setRules(
          data.rules.filter(
            (r: { ruleType: string }) => r.ruleType === "writing_principle"
          )
        );
      });
  }, []);

  async function handleAdd() {
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType: "writing_principle",
        name: "새 원칙",
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

  async function handleDelete(id: string) {
    if (!confirm("삭제할까요?")) return;
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules(rules.filter((r) => r.id !== id));
  }

  function updateRule(id: string, updates: Partial<Rule>) {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function updatePattern(id: string, updates: Partial<Rule["pattern"]>) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    updateRule(id, { pattern: { ...rule.pattern, ...updates } });
  }

  function addWeed(id: string, weed: string) {
    if (!weed.trim()) return;
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    updatePattern(id, { weeds: [...(rule.pattern.weeds || []), weed.trim()] });
  }

  function removeWeed(id: string, index: number) {
    const rule = rules.find((r) => r.id === id);
    if (!rule || !rule.pattern.weeds) return;
    updatePattern(id, { weeds: rule.pattern.weeds.filter((_, i) => i !== index) });
  }

  function addExample(id: string) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    updatePattern(id, { examples: [...(rule.pattern.examples || []), { do: "", dont: "" }] });
  }

  function updateExample(id: string, index: number, field: "do" | "dont", value: string) {
    const rule = rules.find((r) => r.id === id);
    if (!rule || !rule.pattern.examples) return;
    const examples = [...rule.pattern.examples];
    examples[index] = { ...examples[index], [field]: value };
    updatePattern(id, { examples });
  }

  function removeExample(id: string, index: number) {
    const rule = rules.find((r) => r.id === id);
    if (!rule || !rule.pattern.examples) return;
    const examples = rule.pattern.examples.filter((_, i) => i !== index);
    updatePattern(id, { examples: examples.length > 0 ? examples : undefined });
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 py-8 px-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Writing Principles 편집</h1>
            <p className="text-gray-500">Layer 2: 글쓰기 원칙</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            + 원칙 추가
          </button>
        </div>

        <div>
          {rules.map((rule) => (
            <PrincipleItem
              key={rule.id}
              rule={rule}
              saving={saving === rule.id}
              onSave={() => handleSave(rule)}
              onDelete={() => handleDelete(rule.id)}
              onUpdateName={(v) => updateRule(rule.id, { name: v })}
              onUpdateDescription={(v) => updateRule(rule.id, { description: v })}
              onUpdateSeverity={(v) => updateRule(rule.id, { severity: v })}
              onAddWeed={(v) => addWeed(rule.id, v)}
              onRemoveWeed={(i) => removeWeed(rule.id, i)}
              onAddExample={() => addExample(rule.id)}
              onUpdateExample={(i, f, v) => updateExample(rule.id, i, f, v)}
              onRemoveExample={(i) => removeExample(rule.id, i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrincipleItem({
  rule, saving, onSave, onDelete,
  onUpdateName, onUpdateDescription, onUpdateSeverity,
  onAddWeed, onRemoveWeed,
  onAddExample, onUpdateExample, onRemoveExample,
}: {
  rule: Rule;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onUpdateName: (v: string) => void;
  onUpdateDescription: (v: string) => void;
  onUpdateSeverity: (v: string) => void;
  onAddWeed: (v: string) => void;
  onRemoveWeed: (i: number) => void;
  onAddExample: () => void;
  onUpdateExample: (i: number, f: "do" | "dont", v: string) => void;
  onRemoveExample: (i: number) => void;
}) {
  const [newWeed, setNewWeed] = useState("");
  const hasWeeds = rule.pattern.weeds !== undefined;
  const examples = rule.pattern.examples || [];

  return (
    <div className="pb-6 mb-6 border-b border-gray-100 last:border-0 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={rule.name}
          onChange={(e) => onUpdateName(e.target.value)}
          className="font-semibold text-sm border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -ml-1"
        />
        <div className="flex items-center gap-2">
          <select
            value={rule.severity}
            onChange={(e) => onUpdateSeverity(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1"
          >
            <option value="error">필수 (반드시 수정)</option>
            <option value="warning">권장 (수정 권장)</option>
            <option value="info">참고 (알림만)</option>
          </select>
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">삭제</button>
        </div>
      </div>

      <input
        type="text"
        value={rule.description}
        onChange={(e) => onUpdateDescription(e.target.value)}
        className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
        placeholder="이 원칙에 대한 설명"
      />

      {/* 잡초 단어 태그 (weeds가 있는 원칙에만 표시) */}
      {hasWeeds && (
        <div>
          <label className="text-xs text-gray-400 mb-2 block">
            잡초 단어 ({rule.pattern.weeds?.length || 0}개)
          </label>
          <p className="text-xs text-gray-300 mb-2">텍스트에 이 단어가 있으면 AI가 맥락을 보고 삭제 여부를 판단합니다.</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {rule.pattern.weeds?.map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-sm rounded-full border border-red-200"
              >
                {w}
                <button onClick={() => onRemoveWeed(i)} className="text-red-400 hover:text-red-600">x</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={newWeed}
            onChange={(e) => setNewWeed(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onAddWeed(newWeed); setNewWeed(""); }
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
            placeholder="단어 추가 (Enter)"
          />
        </div>
      )}

      {/* Do/Don't 예시 */}
      {examples.length > 0 && (
        <div className="space-y-2">
          {examples.map((ex, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
              <div>
                {i === 0 && <label className="text-xs text-green-600 font-medium mb-1 block">Do</label>}
                <input
                  type="text"
                  value={ex.do}
                  onChange={(e) => onUpdateExample(i, "do", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                  placeholder="좋은 예시"
                />
              </div>
              <div>
                {i === 0 && <label className="text-xs text-red-500 font-medium mb-1 block">Don&apos;t</label>}
                <input
                  type="text"
                  value={ex.dont}
                  onChange={(e) => onUpdateExample(i, "dont", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-red-400"
                  placeholder="나쁜 예시"
                />
              </div>
              <button
                onClick={() => onRemoveExample(i)}
                className={`text-xs text-red-400 hover:text-red-600 ${i === 0 ? "mt-6" : "mt-1.5"}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAddExample}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        + Do/Don&apos;t 추가
      </button>

      <div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
