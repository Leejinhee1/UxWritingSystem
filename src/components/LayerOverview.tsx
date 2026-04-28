"use client";

import { useState } from "react";
import Link from "next/link";

interface Rule {
  id: string;
  ruleType: string;
  name: string;
  description: string;
  pattern: Record<string, unknown>;
}

interface Layer {
  number: number;
  name: string;
  href: string;
  ruleType: string;
  description: string;
}

export function LayerOverview({
  layers,
  grouped,
}: {
  layers: Layer[];
  grouped: Record<string, Rule[]>;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  function toggle(layerNumber: number) {
    setExpanded((prev) => ({ ...prev, [layerNumber]: !prev[layerNumber] }));
  }

  return (
    <div className="divide-y divide-gray-100">
      {layers.map((layer) => {
        const rules = grouped[layer.ruleType] || [];
        const isOpen = expanded[layer.number] || false;

        return (
          <div key={layer.number}>
            <div
              className="flex items-baseline gap-3 py-3 -mx-2 px-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggle(layer.number)}
            >
              <span className="text-xs font-mono text-gray-400 shrink-0 w-6">
                L{layer.number}
              </span>
              <span className="font-medium text-sm">{layer.name}</span>
              <span className="text-xs text-gray-400">{layer.description}</span>
              <span className="text-xs text-gray-400 ml-auto shrink-0">
                {rules.length}개
              </span>
              <span className="text-gray-300 text-xs shrink-0">
                {isOpen ? "▼" : "▶"}
              </span>
            </div>

            {isOpen && (
              <div className="ml-8 mb-3 space-y-1">
                {rules.map((rule) => (
                  <RuleSummary key={rule.id} rule={rule} layer={layer} />
                ))}
                <Link
                  href={layer.href}
                  className="inline-block text-xs text-gray-400 hover:text-gray-600 mt-1"
                >
                  상세 보기 →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RuleSummary({ rule, layer }: { rule: Rule; layer: Layer }) {
  const p = rule.pattern;

  if (layer.ruleType === "brand_voice") {
    return (
      <div className="text-sm text-gray-600 py-1">
        <span className="text-gray-900">페르소나:</span> {p.persona as string}
        <span className="mx-2 text-gray-300">|</span>
        <span className="text-gray-900">북극성:</span> &quot;{p.north_star as string}&quot;
      </div>
    );
  }

  if (layer.ruleType === "word_list") {
    const aliases = (p.aliases as string[]) || [];
    return (
      <div className="flex items-center gap-2 text-sm py-1">
        <span className="font-medium text-gray-700">{p.term as string}</span>
        {aliases.length > 0 && (
          <span className="text-xs text-gray-400">
            ← {aliases.slice(0, 3).join(", ")}
            {aliases.length > 3 && ` 외 ${aliases.length - 3}개`}
          </span>
        )}
      </div>
    );
  }

  if (layer.ruleType === "ui_pattern") {
    return (
      <div className="flex items-center gap-2 text-sm py-1">
        <span className="text-xs font-mono text-gray-400">{p.ui_type as string}</span>
        <span className="text-gray-600">{rule.name}</span>
        {p.tone ? <span className="text-xs text-gray-400">— {String(p.tone).slice(0, 30)}...</span> : null}
      </div>
    );
  }

  // writing_principle, grammar
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className="text-gray-700">{rule.name}</span>
      <span className="text-xs text-gray-400">{rule.description.slice(0, 40)}{rule.description.length > 40 ? "..." : ""}</span>
    </div>
  );
}
