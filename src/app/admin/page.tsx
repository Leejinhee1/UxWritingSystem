"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/rules").then((res) => {
      if (res.ok) {
        // Check if admin cookie exists by trying a simple test
        setAuthenticated(document.cookie.includes("admin_session"));
      }
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/voice");
    } else {
      setError("비밀번호가 틀렸어요.");
    }
  }

  if (authenticated) {
    router.push("/admin/voice");
    return null;
  }

  return (
    <div className="max-w-sm mx-auto py-16 px-6">
      <h1 className="text-2xl font-bold mb-2 text-center">관리자 인증</h1>
      <p className="text-gray-500 text-center mb-8">
        비밀번호를 입력하세요
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          확인
        </button>
      </form>
    </div>
  );
}
