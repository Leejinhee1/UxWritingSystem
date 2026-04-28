"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

interface VoiceData {
  persona: string;
  north_star: string;
  traits: string[];
  anti_traits: string[];
}

export default function AdminVoicePage() {
  const [ruleId, setRuleId] = useState("");
  const [voice, setVoice] = useState<VoiceData>({
    persona: "",
    north_star: "",
    traits: [],
    anti_traits: [],
  });
  const [newTrait, setNewTrait] = useState("");
  const [newAntiTrait, setNewAntiTrait] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        const rule = data.rules.find(
          (r: { ruleType: string }) => r.ruleType === "brand_voice"
        );
        if (rule) {
          setRuleId(rule.id);
          setVoice(rule.pattern);
        }
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/rules/${ruleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: voice }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addTrait() {
    if (!newTrait.trim()) return;
    setVoice({ ...voice, traits: [...voice.traits, newTrait.trim()] });
    setNewTrait("");
  }

  function removeTrait(t: string) {
    setVoice({ ...voice, traits: voice.traits.filter((x) => x !== t) });
  }

  function addAntiTrait() {
    if (!newAntiTrait.trim()) return;
    setVoice({
      ...voice,
      anti_traits: [...voice.anti_traits, newAntiTrait.trim()],
    });
    setNewAntiTrait("");
  }

  function removeAntiTrait(t: string) {
    setVoice({
      ...voice,
      anti_traits: voice.anti_traits.filter((x) => x !== t),
    });
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 py-8 px-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">Voice 편집</h1>
        <p className="text-gray-500 mb-8">Layer 1: 브랜드 성격 정의</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              페르소나
            </label>
            <input
              type="text"
              value={voice.persona}
              onChange={(e) =>
                setVoice({ ...voice, persona: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              북극성
            </label>
            <input
              type="text"
              value={voice.north_star}
              onChange={(e) =>
                setVoice({ ...voice, north_star: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성격 (traits)
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {voice.traits.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
                >
                  {t}
                  <button
                    onClick={() => removeTrait(t)}
                    className="text-green-400 hover:text-green-600"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTrait())}
                placeholder="추가할 성격"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
              />
              <button
                onClick={addTrait}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
              >
                추가
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              안티 성격 (anti_traits)
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {voice.anti_traits.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full border border-red-200"
                >
                  {t}
                  <button
                    onClick={() => removeAntiTrait(t)}
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
                value={newAntiTrait}
                onChange={(e) => setNewAntiTrait(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAntiTrait())
                }
                placeholder="추가할 안티 성격"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
              />
              <button
                onClick={addAntiTrait}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
              >
                추가
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {saving ? "저장 중..." : saved ? "저장됨" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
