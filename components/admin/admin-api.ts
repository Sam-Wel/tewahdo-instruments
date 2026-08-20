"use client";

import type { Mezmur } from "@/lib/constants";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const PASSWORD_STORAGE_KEY = "zimare_admin_pw";

export function getStoredPassword(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PASSWORD_STORAGE_KEY) || "";
}

export function setStoredPassword(pw: string): void {
  localStorage.setItem(PASSWORD_STORAGE_KEY, pw);
}

// GET isn't a supported method on /api/mezmur, but the handler checks the
// password before checking the method — so a wrong password still 401s,
// while a right one falls through to a harmless 405. No data is touched.
export async function verifyPassword(pw: string): Promise<boolean> {
  const resp = await fetch("/api/mezmur", { headers: { "x-admin-password": pw } });
  return resp.status !== 401;
}

export async function apiCall<T>(
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
  idForDelete?: number
): Promise<T | null> {
  const url = idForDelete ? `/api/mezmur?id=${encodeURIComponent(idForDelete)}` : "/api/mezmur";
  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-password": getStoredPassword() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (resp.status === 401) throw new Error("Wrong password");
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${resp.status})`);
  }
  return resp.status === 204 ? null : resp.json();
}

export async function fetchAllMezmur(search: string): Promise<Mezmur[]> {
  const params = new URLSearchParams({ select: "*", order: "title.asc" });
  if (search) params.set("title", `ilike.*${search}*`);
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?${params.toString()}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  return resp.json();
}
