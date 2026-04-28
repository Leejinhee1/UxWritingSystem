"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

interface WordData {
  term: string;
  definition: string;
  aliases: string[];
}

interface Rule {
  id: string;
  name: string;
  description: string;
  pattern: WordData;
}

export default function AdminWordListPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        setRules(
          data.rules.filter(
            (r: { ruleType: string }) => r.ruleType === "word_list"
          )
        );
      });
  }, []);

  async function handleSave(rule: Rule) {
    setSaving(rule.id);
    await fetch(`/api/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: rule.pattern.term,
        description: rule.pattern.definition,
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

  async function handleAdd() {
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType: "word_list",
        name: "새 용어",
        description: "",
        pattern: { term: "새 용어", definition: "", aliases: [] },
      }),
    });
    const data = await res.json();
    setRules([...rules, data.rule]);
  }

  function updateWord(id: string, updates: Partial<WordData>) {
    setRules(
      rules.map((r) =>
        r.id === id ? { ...r, pattern: { ...r.pattern, ...updates } } : r
      )
    );
  }

  function addAlias(id: string, alias: string) {
    if (!alias.trim()) return;
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    updateWord(id, { aliases: [...rule.pattern.aliases, alias.trim()] });
  }

  function removeAlias(id: string, index: number) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    updateWord(id, {
      aliases: rule.pattern.aliases.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 py-8 px-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Word List 편집</h1>
            <p className="text-gray-500">Layer 5: 용어집</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            + 용어 추가
          </button>
        </div>

        <div className="space-y-4">
          {rules.map((rule) => (
            <WordCard
              key={rule.id}
              rule={rule}
              saving={saving === rule.id}
              onSave={() => handleSave(rule)}
              onDelete={() => handleDelete(rule.id)}
              onUpdateTerm={(v) => updateWord(rule.id, { term: v })}
              onUpdateDefinition={(v) => updateWord(rule.id, { definition: v })}
              onAddAlias={(v) => addAlias(rule.id, v)}
              onRemoveAlias={(i) => removeAlias(rule.id, i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WordCard({
  rule,
  saving,
  onSave,
  onDelete,
  onUpdateTerm,
  onUpdateDefinition,
  onAddAlias,
  onRemoveAlias,
}: {
  rule: Rule;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onUpdateTerm: (v: string) => void;
  onUpdateDefinition: (v: string) => void;
  onAddAlias: (v: string) => void;
  onRemoveAlias: (i: number) => void;
}) {
  const [newAlias, setNewAlias] = useState("");

  return (
    <div className="pb-6 mb-6 border-b border-gray-100 last:border-0 space-y-3">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={rule.pattern.term}
          onChange={(e) => onUpdateTerm(e.target.value)}
          className="font-semibold text-lg border-0 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-1 -ml-1"
        />
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-600"
        >
          삭제
        </button>
      </div>

      <input
        type="text"
        value={rule.pattern.definition}
        onChange={(e) => onUpdateDefinition(e.target.value)}
        className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
        placeholder="정의"
      />

      <div>
        <label className="text-xs text-gray-400 mb-2 block">
          틀린 표현 {rule.pattern.aliases.length}개
        </label>
        <div className="flex gap-2 flex-wrap mb-2">
          {rule.pattern.aliases.map((alias, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-sm rounded-full border border-red-200"
            >
              {alias}
              <button
                onClick={() => onRemoveAlias(i)}
                className="text-red-400 hover:text-red-600"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddAlias(newAlias);
                setNewAlias("");
              }
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 flex-1"
            placeholder="틀린 표현 추가 (Enter)"
          />
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-40"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
