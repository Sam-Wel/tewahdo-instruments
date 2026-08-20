"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrnamentDivider } from "@/components/layout/ornament-divider";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminList } from "@/components/admin/admin-list";
import { getStoredPassword, setStoredPassword, verifyPassword } from "@/components/admin/admin-api";
import type { Mezmur } from "@/lib/constants";

function AdminHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-xl text-primary">ዝማሬ</span>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground">
            ADMIN
          </span>
        </Link>
      </div>
      <OrnamentDivider />
    </header>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [password, setPassword] = useState("");
  const [lockError, setLockError] = useState("");
  const [editingEntry, setEditingEntry] = useState<Mezmur | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    // Reading localStorage (a browser-only external system, unavailable
    // during SSR) has to happen post-mount to avoid a hydration mismatch
    // — this isn't the "copy a prop into state" case set-state-in-effect
    // targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getStoredPassword()) setUnlocked(true);
    setCheckedStorage(true);
  }, []);

  async function handleUnlock() {
    const ok = await verifyPassword(password);
    if (!ok) {
      setLockError("Wrong password.");
      return;
    }
    setStoredPassword(password);
    setUnlocked(true);
  }

  if (!checkedStorage) return null;

  if (!unlocked) {
    return (
      <>
        <AdminHeader />
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <Lock className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Enter the admin password to manage mezmur entries.
          </p>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          />
          <Button onClick={handleUnlock} className="w-full">
            Unlock
          </Button>
          {lockError && <p className="text-sm text-destructive">{lockError}</p>}
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8"
      >
        <AdminForm
          key={editingEntry?.id ?? "new"}
          editingEntry={editingEntry}
          onSaved={() => {
            setEditingEntry(null);
            setRefreshToken((t) => t + 1);
          }}
          onCancelEdit={() => setEditingEntry(null)}
        />
        <AdminList onEdit={setEditingEntry} refreshToken={refreshToken} />
      </motion.main>
    </>
  );
}
