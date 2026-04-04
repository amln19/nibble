"use client";

import { createClient } from "@/lib/supabase/client";
import type { CreationRow } from "@/lib/creations";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const BUCKET = "creation-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function CreationsClient() {
  const [posts, setPosts] = useState<CreationRow[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("creations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;
      setPosts((data ?? []) as CreationRow[]);
    } catch (e) {
      setFeedError(
        e instanceof Error
          ? e.message
          : "Could not load posts. Run the SQL in supabase/migrations/002_creations.sql if you haven't yet.",
      );
      setPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDetails("");
    setFile(null);
    setFormError(null);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      setFormOk(null);

      if (!userId) {
        setFormError("Sign in to share a creation.");
        return;
      }
      const t = title.trim();
      if (!t) {
        setFormError("Add a title for your dish.");
        return;
      }
      if (!file) {
        setFormError("Choose a photo.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setFormError("File must be an image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setFormError("Image must be 5MB or smaller.");
        return;
      }

      setSubmitting(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.slice(0, 8) || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (upErr) throw upErr;

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path);

        const author_label =
          userEmail?.split("@")[0]?.slice(0, 40) ?? "Chef";

        const { data: row, error: insErr } = await supabase
          .from("creations")
          .insert({
            user_id: userId,
            title: t,
            details: details.trim() || null,
            image_url: publicUrl,
            author_label,
          })
          .select()
          .single();

        if (insErr) throw insErr;

        setPosts((prev) => [row as CreationRow, ...prev]);
        resetForm();
        setFormOk("Posted! Your creation is live.");
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [userId, userEmail, title, details, file, resetForm],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 sm:px-6 lg:max-w-5xl lg:px-8 md:pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Your Creations
        </h1>
        <p className="mt-1 text-sm text-muted">
          Share a photo and the story behind what you cooked.
        </p>
      </header>

      {/* ── New post form ── */}
      <section
        aria-labelledby="post-form-heading"
        className="mb-10 rounded-3xl border-2 border-edge bg-card p-5 shadow-[0_4px_0_var(--edge)] sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" aria-hidden>📸</span>
          <h2
            id="post-form-heading"
            className="text-sm font-extrabold text-foreground"
          >
            New post
          </h2>
        </div>
        {!userId ? (
          <p className="text-sm text-muted">
            <Link
              href="/login"
              className="font-extrabold text-primary-dark hover:text-primary"
            >
              Sign in
            </Link>{" "}
            to upload a photo and post details.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="creation-title"
                className="block text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                Title
              </label>
              <input
                id="creation-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Sunday roast with herbs"
                className="mt-1.5 w-full rounded-2xl border-2 border-edge bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="creation-details"
                className="block text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                Details
              </label>
              <textarea
                id="creation-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What did you change, how did it turn out\u2026"
                className="mt-1.5 w-full resize-y rounded-2xl border-2 border-edge bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="creation-photo"
                className="block text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                Photo
              </label>
              <input
                id="creation-photo"
                type="file"
                accept={ACCEPT}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-2 file:border-edge file:bg-surface file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-foreground hover:file:bg-edge"
              />
              <p className="mt-1 text-xs text-muted">
                JPEG, PNG, WebP, or GIF · max 5MB
              </p>
              {previewUrl ? (
                <div className="relative mt-3 aspect-video w-full max-w-md overflow-hidden rounded-2xl border-2 border-edge bg-surface shadow-[0_3px_0_var(--edge)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
            {formError ? (
              <p className="text-sm font-bold text-red-600" role="alert">
                {formError}
              </p>
            ) : null}
            {formOk ? (
              <p className="text-sm font-bold text-primary-dark">{formOk}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl border-2 border-primary-dark bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? "Posting\u2026" : "Publish"}
            </button>
          </form>
        )}
      </section>

      {/* ── Community feed ── */}
      <section aria-labelledby="feed-heading">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg" aria-hidden>🌍</span>
          <h2
            id="feed-heading"
            className="text-lg font-extrabold text-foreground"
          >
            Community feed
          </h2>
        </div>
        {feedLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface border-t-primary" />
          </div>
        ) : feedError ? (
          <p className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-[0_3px_0_#fcd34d]">
            ⚠️ {feedError}
          </p>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-edge bg-surface px-6 py-12 text-center shadow-[0_4px_0_var(--edge)]">
            <p className="text-3xl mb-2">📸</p>
            <p className="text-sm font-extrabold text-foreground">No posts yet!</p>
            <p className="mt-1 text-sm text-muted">Be the first to share a creation.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-all hover:shadow-[0_6px_0_var(--edge)] hover:-translate-y-0.5"
              >
                <div className="relative aspect-4/3 bg-surface">
                  <Image
                    src={p.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold text-foreground">{p.title}</h3>
                  {p.details ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {p.details}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-bold text-muted/60">
                    {p.author_label ? `${p.author_label} \u00B7 ` : ""}
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
