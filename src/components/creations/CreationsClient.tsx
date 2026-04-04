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
          : "Could not load posts. Run the SQL in supabase/migrations/002_creations.sql if you haven’t yet.",
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
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 sm:px-6 lg:max-w-5xl lg:px-8 md:pb-12">
      <header className="mb-8 text-center md:text-left">
        <h1 className="font-serif text-2xl font-semibold text-zinc-900 md:text-3xl">
          Your creations
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Share a photo and the story behind what you cooked.
        </p>
      </header>

      <section
        aria-labelledby="post-form-heading"
        className="mb-10 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2
          id="post-form-heading"
          className="text-sm font-semibold text-zinc-900"
        >
          New post
        </h2>
        {!userId ? (
          <p className="mt-3 text-sm text-zinc-600">
            <Link
              href="/login"
              className="font-medium text-green-600 hover:text-green-700"
            >
              Sign in
            </Link>{" "}
            to upload a photo and post details.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="creation-title"
                className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Title
              </label>
              <input
                id="creation-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Sunday roast with herbs"
                className="mt-1.5 w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              />
            </div>
            <div>
              <label
                htmlFor="creation-details"
                className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Details
              </label>
              <textarea
                id="creation-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What did you change, how did it turn out, tips for next time…"
                className="mt-1.5 w-full resize-y rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              />
            </div>
            <div>
              <label
                htmlFor="creation-photo"
                className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Photo
              </label>
              <input
                id="creation-photo"
                type="file"
                accept={ACCEPT}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-pink-100"
              />
              <p className="mt-1 text-xs text-zinc-400">
                JPEG, PNG, WebP, or GIF · max 5MB
              </p>
              {previewUrl ? (
                <div className="relative mt-3 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-green-100 bg-pink-50">
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
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
            {formOk ? (
              <p className="text-sm text-zinc-900">{formOk}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Publish"}
            </button>
          </form>
        )}
      </section>

      <section aria-labelledby="feed-heading">
        <h2
          id="feed-heading"
          className="mb-4 font-serif text-lg font-semibold text-zinc-900"
        >
          Community feed
        </h2>
        {feedLoading ? (
          <p className="text-sm text-zinc-500">Loading posts…</p>
        ) : feedError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {feedError}
          </p>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-green-200 bg-white px-6 py-10 text-center text-sm text-zinc-600">
            No posts yet. Be the first to share a creation.
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li
                key={p.id}
                className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-pink-50">
                  <Image
                    src={p.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900">{p.title}</h3>
                  {p.details ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                      {p.details}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-zinc-400">
                    {p.author_label ? `${p.author_label} · ` : ""}
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
