"use client";

import { createClient } from "@/lib/supabase/client";
import type { CreationRow, CommentRow } from "@/lib/creations";
import { Camera, ImagePlus, X, Trash2, Globe, Lock, User, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const BUCKET = "creation-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

// ── Post card (square grid tile) ─────────────────────────────────────────────

function PostCard({
  post,
  isMine,
  onOpen,
  onDelete,
  onLike,
}: {
  post: CreationRow;
  isMine: boolean;
  onOpen: (p: CreationRow) => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
}) {
  const likesCount = post.likes_count ?? 0;
  const commentsCount = post.comments_count ?? 0;
  const hasLiked = post.user_has_liked ?? false;

  return (
    <li className="group relative overflow-hidden rounded-2xl border-[3px] border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-all hover:-translate-y-1 hover:border-secondary/60 hover:shadow-[0_6px_0_var(--secondary)]">
      <button
        type="button"
        className="relative block w-full"
        onClick={() => onOpen(post)}
        aria-label={`View ${post.title}`}
      >
        <div className="relative aspect-square overflow-hidden bg-surface">
          <Image
            src={post.image_url}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="line-clamp-2 text-left text-sm font-extrabold leading-tight text-white">
              {post.title}
            </p>
            {post.details ? (
              <p className="mt-0.5 line-clamp-1 text-left text-xs text-white/70">
                {post.details}
              </p>
            ) : null}
          </div>

          {/* Private badge */}
          {post.is_public === false ? (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
              <Lock size={10} className="text-white/80" />
              <span className="text-[10px] font-extrabold text-white/80">Private</span>
            </div>
          ) : null}

          {/* Like and comment counts overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            {likesCount > 0 || commentsCount > 0 ? (
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
                {likesCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <Heart size={12} className="fill-red-500 text-red-500" />
                    <span className="text-[11px] font-extrabold text-white">{likesCount}</span>
                  </div>
                ) : null}
                {commentsCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <MessageCircle size={12} className="text-white" />
                    <span className="text-[11px] font-extrabold text-white">{commentsCount}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {/* Like button */}
      {onLike ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
          className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-red-600/80"
          aria-label={hasLiked ? "Unlike post" : "Like post"}
        >
          <Heart size={14} className={hasLiked ? "fill-red-500 text-red-500" : ""} />
        </button>
      ) : null}

      {/* Delete button (my posts only) */}
      {isMine && onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(post.id)}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-red-600/80"
          aria-label="Delete post"
        >
          <Trash2 size={13} />
        </button>
      ) : null}
    </li>
  );
}

// ── Post detail modal ─────────────────────────────────────────────────────────

function PostDetailModal({
  post,
  isMine,
  userId,
  userEmail,
  onClose,
  onDelete,
  onLike,
}: {
  post: CreationRow;
  isMine: boolean;
  userId: string | null;
  userEmail: string | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const likesCount = post.likes_count ?? 0;
  const hasLiked = post.user_has_liked ?? false;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const supabase = createClient();
        if (!supabase) { setComments([]); setLoadingComments(false); return; }
        const { data, error } = await supabase
          .from("creation_comments")
          .select("*")
          .eq("creation_id", post.id)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setComments((data ?? []) as CommentRow[]);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };
    void loadComments();
  }, [post.id]);

  const handleAddComment = useCallback(async () => {
    if (!userId || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const author_label = userEmail?.split("@")[0]?.slice(0, 40) ?? "Chef";
      const { data: row, error } = await supabase
        .from("creation_comments")
        .insert({
          creation_id: post.id,
          user_id: userId,
          author_label,
          comment_text: newComment.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      setComments((prev) => [...prev, row as CommentRow]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  }, [userId, userEmail, post.id, newComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.from("creation_comments").delete().eq("id", commentId);
    } catch {
      // silently fail
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Modal: stacked on mobile, side-by-side on md+ */}
      <div
        className="flex h-[90dvh] max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border-2 border-edge bg-card shadow-[0_8px_0_var(--edge)] sm:h-[min(92dvh,880px)] sm:rounded-3xl md:h-auto md:max-h-[90vh] md:min-h-[min(85vh,720px)] md:max-w-6xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: image (fills entire height) ── */}
        <div className="relative flex-1 min-h-[50vh] w-full shrink-0 bg-surface md:flex-initial md:min-h-0 md:w-[min(46vw,560px)] md:self-stretch">
          <Image
            src={post.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </div>

        {/* ── Right: info + comments ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:border-l-2 md:border-edge">
          {/* Header: title, author, action buttons — X lives here, never floats */}
          <div className="shrink-0 border-b-2 border-edge p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold leading-tight text-foreground">
                  {post.title}
                </h2>
                <p className="mt-0.5 text-xs font-bold text-muted">
                  {post.author_label ?? "Chef"} · {formatDate(post.created_at)}
                </p>
              </div>
              {/* Action buttons: Delete (if mine) + Close */}
              <div className="flex shrink-0 items-center gap-2">
                {isMine && onDelete ? (
                  <button
                    type="button"
                    onClick={() => { onDelete(post.id); onClose(); }}
                    className="flex items-center gap-1.5 rounded-xl border-2 border-edge px-2.5 py-1.5 text-xs font-extrabold text-muted transition hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-muted transition hover:bg-edge hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {post.details ? (
              <p className="mt-2 text-sm leading-relaxed text-muted whitespace-pre-wrap">
                {post.details}
              </p>
            ) : null}

            {/* Recipe link */}
            {post.recipe_id ? (
              <div className="mt-2 rounded-xl border-2 border-secondary/40 bg-secondary/5 p-3">
                <p className="mb-2 text-xs font-extrabold text-muted">
                  📖 Recipe used: <span className="text-foreground">{post.recipe_title || `Recipe #${post.recipe_id}`}</span>
                </p>
                <Link
                  href={`/cook?id=${encodeURIComponent(post.recipe_id)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-secondary/60 bg-secondary/10 px-3 py-1.5 text-xs font-extrabold text-secondary-dark shadow-[0_2px_0_rgba(255,133,52,0.2)] transition-all hover:bg-secondary hover:text-white hover:border-secondary-dark hover:shadow-[0_2px_0_var(--secondary-dark)] active:translate-y-0.5 active:shadow-none"
                >
                  🪿 Cook with Gordon
                </Link>
              </div>
            ) : null}

            {/* Like */}
            <div className="mt-3">
              {userId && onLike ? (
                <button
                  type="button"
                  onClick={() => onLike(post.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold transition-all hover:shadow-sm active:translate-y-0.5 ${
                    hasLiked
                      ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                      : "border-edge bg-surface text-muted hover:border-edge-hover"
                  }`}
                >
                  <Heart size={13} className={hasLiked ? "fill-red-500 text-red-500" : ""} />
                  {likesCount > 0 ? likesCount : "Like"}
                </button>
              ) : likesCount > 0 ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted">
                  <Heart size={13} className="fill-red-500 text-red-500" />
                  {likesCount}
                </div>
              ) : null}
            </div>
          </div>

          {/* Comments list — scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-muted">
              Comments{comments.length > 0 ? ` · ${comments.length}` : ""}
            </p>

            {loadingComments ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-1.5">
                    <div className="h-2.5 w-16 rounded-full bg-surface" />
                    <div className="h-2.5 w-full rounded-full bg-surface" />
                    <div className="h-2.5 w-3/4 rounded-full bg-surface" />
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No comments yet. Be the first!</p>
            ) : (
              <ul className="space-y-2.5">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-2xl border-2 border-edge bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold text-muted">
                          {comment.author_label ?? "Chef"} · {formatDate(comment.created_at)}
                        </p>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
                          {comment.comment_text}
                        </p>
                      </div>
                      {comment.user_id === userId ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="shrink-0 text-muted transition hover:text-red-600"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comment input — pinned to bottom */}
          <div className="shrink-0 border-t-2 border-edge p-4">
            {userId ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleAddComment();
                    }
                  }}
                  placeholder="Add a comment…"
                  rows={1}
                  maxLength={500}
                  className="flex-1 resize-none rounded-2xl border-2 border-edge bg-card px-3 py-2 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="shrink-0 rounded-2xl border-2 border-primary-dark bg-primary px-3 py-2 text-xs font-extrabold text-white shadow-[0_3px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
                >
                  {submittingComment ? "…" : "Post"}
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-muted">
                <Link href="/login" className="font-extrabold text-primary-dark hover:underline">
                  Sign in
                </Link>{" "}
                to leave a comment
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New post modal ────────────────────────────────────────────────────────────

function NewPostModal({
  userId,
  userEmail,
  onClose,
  onPosted,
}: {
  userId: string;
  userEmail: string | null;
  onClose: () => void;
  onPosted: (row: CreationRow) => void;
}) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [recipeId, setRecipeId] = useState("");
  const [recipeTitle, setRecipeTitle] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeResults, setRecipeResults] = useState<Array<{id: string; title: string}>>([]);
  const [searchingRecipes, setSearchingRecipes] = useState(false);
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recipeSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close recipe dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (recipeSearchRef.current && !recipeSearchRef.current.contains(e.target as Node)) {
        setShowRecipeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search recipes
  useEffect(() => {
    const q = recipeSearch.trim();
    if (!q || q.length < 2) {
      setRecipeResults([]);
      setShowRecipeDropdown(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setSearchingRecipes(true);
      try {
        const res = await fetch(`/api/recipes/search?s=${encodeURIComponent(q)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as { meals?: Array<{ idMeal: string; strMeal: string }> | null };
        if (cancelled) return;
        const meals = data.meals || [];
        setRecipeResults(meals.slice(0, 8).map(m => ({ id: m.idMeal, title: m.strMeal })));
        setShowRecipeDropdown(meals.length > 0);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setSearchingRecipes(false);
      }
    }, 400); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [recipeSearch]);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("File must be an image."); return; }
    if (f.size > MAX_BYTES) { setError("Image must be 5 MB or smaller."); return; }
    setError(null);
    setFile(f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    if (!t) { setError("Add a title for your dish."); return; }
    if (!file) { setError("Choose a photo."); return; }
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) { setError("Not connected"); setSubmitting(false); return; }
      const ext = file.name.split(".").pop()?.slice(0, 8) || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const author_label = userEmail?.split("@")[0]?.slice(0, 40) ?? "Chef";
      const recipe_id = recipeId.trim() || null;

      const { data: row, error: insErr } = await supabase
        .from("creations")
        .insert({
          user_id: userId,
          title: t,
          details: details.trim() || null,
          image_url: publicUrl,
          author_label,
          is_public: isPublic,
        })
        .select("id, user_id, title, details, image_url, author_label, created_at, is_public")
        .single();
      if (insErr) {
        console.error("Insert error:", insErr);
        throw insErr;
      }

      // Store recipe info locally for this session (not in DB)
      if (row && recipe_id) {
        (row as CreationRow).recipe_id = recipe_id;
        if (recipeTitle) {
          (row as CreationRow).recipe_title = recipeTitle;
        }
      }
      onPosted(row as CreationRow);
      onClose();
    } catch (err) {
      console.error("Post creation error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [userId, userEmail, title, details, file, isPublic, recipeId, recipeTitle, onClose, onPosted]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-t-3xl border-2 border-edge bg-card shadow-[0_-4px_0_var(--edge)] sm:rounded-3xl sm:shadow-[0_8px_0_var(--edge)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-edge px-5 py-4">
          <h2 className="text-sm font-extrabold text-foreground">New post</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-muted transition hover:text-foreground"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-4 p-5">
            {/* Photo drop zone */}
            <div>
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">
                Photo
              </p>
              {previewUrl ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-edge bg-surface shadow-[0_3px_0_var(--edge)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    aria-label="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 transition-all ${
                    dragging
                      ? "border-primary bg-primary-light"
                      : "border-edge bg-surface hover:border-edge-hover"
                  }`}
                >
                  <ImagePlus
                    size={28}
                    className={dragging ? "text-primary-dark" : "text-muted"}
                  />
                  <span className={`text-sm font-extrabold ${dragging ? "text-primary-dark" : "text-muted"}`}>
                    {dragging ? "Drop it!" : "Tap to upload or drag a photo"}
                  </span>
                  <span className="text-xs text-muted/60">JPEG, PNG, WebP, GIF · max 5 MB</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="post-title"
                className="block text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                Title
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Sunday roast with herbs"
                className="mt-1.5 w-full rounded-2xl border-2 border-edge bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
              />
            </div>

            {/* Details */}
            <div>
              <label
                htmlFor="post-details"
                className="block text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                Caption
              </label>
              <textarea
                id="post-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="What did you change, how did it turn out…"
                className="mt-1.5 w-full resize-none rounded-2xl border-2 border-edge bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
              />
            </div>

            {/* Recipe search (optional) */}
            <div>
              <label
                htmlFor="post-recipe"
                className="block text-xs font-extrabold uppercase tracking-wide text-muted"
              >
                Recipe used <span className="font-normal text-muted/60">(optional)</span>
              </label>
              {recipeId ? (
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border-2 border-secondary/40 bg-secondary/5 px-3 py-2.5 shadow-[0_2px_0_rgba(255,133,52,0.2)]">
                  <span className="flex-1 text-sm font-extrabold text-foreground">
                    {recipeTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipeId("");
                      setRecipeTitle("");
                      setRecipeSearch("");
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-muted transition hover:bg-edge hover:text-foreground"
                    aria-label="Remove recipe"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div ref={recipeSearchRef} className="relative mt-1.5">
                  <input
                    id="post-recipe"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    onFocus={() => recipeResults.length > 0 && setShowRecipeDropdown(true)}
                    placeholder="Search for a recipe..."
                    className="w-full rounded-2xl border-2 border-edge bg-card px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
                  />
                  {searchingRecipes && (
                    <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface border-t-primary" />
                    </div>
                  )}
                  {showRecipeDropdown && recipeResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-2xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
                      {recipeResults.map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => {
                            setRecipeId(recipe.id);
                            setRecipeTitle(recipe.title);
                            setRecipeSearch("");
                            setShowRecipeDropdown(false);
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-bold text-foreground transition-colors hover:bg-primary/10 first:rounded-t-2xl last:rounded-b-2xl"
                        >
                          {recipe.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-muted">
                Link to the recipe you used from the explore page
              </p>
            </div>

            {/* Visibility toggle */}
            <div>
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">
                Visibility
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-extrabold transition-all ${
                    isPublic
                      ? "border-primary bg-primary-light text-primary-dark shadow-[0_2px_0_var(--primary)]"
                      : "border-edge bg-card text-muted hover:border-edge-hover hover:text-foreground"
                  }`}
                >
                  <Globe size={15} />
                  Community
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-sm font-extrabold transition-all ${
                    !isPublic
                      ? "border-primary bg-primary-light text-primary-dark shadow-[0_2px_0_var(--primary)]"
                      : "border-edge bg-card text-muted hover:border-edge-hover hover:text-foreground"
                  }`}
                >
                  <Lock size={15} />
                  Private
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {isPublic ? "Visible to everyone in the community feed." : "Only visible to you."}
              </p>
            </div>

            {error ? (
              <p className="text-sm font-bold text-red-600" role="alert">{error}</p>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-edge px-5 py-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl border-2 border-primary-dark bg-primary py-3 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? "Publishing…" : (isPublic ? "Publish to Community" : "Save Privately")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Section empty state ───────────────────────────────────────────────────────

function EmptyGrid({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="col-span-full rounded-3xl border-2 border-dashed border-edge bg-surface py-10 text-center shadow-[0_3px_0_var(--edge)]">
      <p className="font-extrabold text-foreground">{message}</p>
      {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreationsClient() {
  const [posts, setPosts] = useState<CreationRow[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedPost, setExpandedPost] = useState<CreationRow | null>(null);

  // Load feed with likes and comments counts
  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const supabase = createClient();
      if (!supabase) { setFeedError("Not connected"); setFeedLoading(false); return; }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Fetch creations - only select columns that exist in DB
      const { data: creations, error } = await supabase
        .from("creations")
        .select("id, user_id, title, details, image_url, author_label, created_at, is_public")
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) {
        console.error("Creations fetch error:", error);
        throw error;
      }

      // Fetch likes counts and user's likes
      const creationIds = creations?.map((c) => c.id) ?? [];
      const { data: likesData } = await supabase
        .from("creation_likes")
        .select("creation_id, user_id")
        .in("creation_id", creationIds);

      // Fetch comments counts
      const { data: commentsData } = await supabase
        .from("creation_comments")
        .select("creation_id")
        .in("creation_id", creationIds);

      // Build counts maps
      const likesCounts = new Map<string, number>();
      const userLikes = new Set<string>();

      likesData?.forEach((like) => {
        likesCounts.set(like.creation_id, (likesCounts.get(like.creation_id) ?? 0) + 1);
        if (like.user_id === currentUserId) {
          userLikes.add(like.creation_id);
        }
      });

      const commentsCounts = new Map<string, number>();
      commentsData?.forEach((comment) => {
        commentsCounts.set(comment.creation_id, (commentsCounts.get(comment.creation_id) ?? 0) + 1);
      });

      // Enrich posts with counts
      const enrichedPosts = creations?.map((post) => ({
        ...post,
        likes_count: likesCounts.get(post.id) ?? 0,
        comments_count: commentsCounts.get(post.id) ?? 0,
        user_has_liked: userLikes.has(post.id),
      })) as CreationRow[];

      setPosts(enrichedPosts);
    } catch (e) {
      setFeedError(
        e instanceof Error ? e.message : "Could not load posts.",
      );
      setPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  // Auth
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.from("creations").delete().eq("id", id);
    } catch {
      // silently fail — the optimistic remove is fine
    }
  }, []);

  const handlePosted = useCallback((row: CreationRow) => {
    setPosts((prev) => [row, ...prev]);
  }, []);

  const handleLike = useCallback(async (creationId: string) => {
    if (!userId) return;

    const supabase = createClient();
    if (!supabase) return;
    const post = posts.find((p) => p.id === creationId);
    if (!post) return;

    const hasLiked = post.user_has_liked ?? false;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === creationId
          ? {
              ...p,
              likes_count: hasLiked ? (p.likes_count ?? 1) - 1 : (p.likes_count ?? 0) + 1,
              user_has_liked: !hasLiked,
            }
          : p
      )
    );

    // Update expanded post if it's open
    if (expandedPost?.id === creationId) {
      setExpandedPost((prev) =>
        prev
          ? {
              ...prev,
              likes_count: hasLiked ? (prev.likes_count ?? 1) - 1 : (prev.likes_count ?? 0) + 1,
              user_has_liked: !hasLiked,
            }
          : null
      );
    }

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from("creation_likes")
          .delete()
          .eq("creation_id", creationId)
          .eq("user_id", userId);
      } else {
        // Like
        await supabase
          .from("creation_likes")
          .insert({ creation_id: creationId, user_id: userId });
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert optimistic update on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === creationId
            ? {
                ...p,
                likes_count: hasLiked ? (p.likes_count ?? 0) + 1 : (p.likes_count ?? 1) - 1,
                user_has_liked: hasLiked,
              }
            : p
        )
      );
      if (expandedPost?.id === creationId) {
        setExpandedPost((prev) =>
          prev
            ? {
                ...prev,
                likes_count: hasLiked ? (prev.likes_count ?? 0) + 1 : (prev.likes_count ?? 1) - 1,
                user_has_liked: hasLiked,
              }
            : null
        );
      }
    }
  }, [userId, posts, expandedPost]);

  const myPosts = posts.filter((p) => p.user_id === userId && p.is_public === false);
  const communityPosts = posts.filter((p) => p.is_public !== false);

  return (
    <div className="mx-auto w-full max-w-8xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-8">
      {/* Modals */}
      {showNewPost && userId ? (
        <NewPostModal
          userId={userId}
          userEmail={userEmail}
          onClose={() => setShowNewPost(false)}
          onPosted={handlePosted}
        />
      ) : null}
      {expandedPost ? (
        <PostDetailModal
          post={expandedPost}
          isMine={expandedPost.user_id === userId}
          userId={userId}
          userEmail={userEmail}
          onClose={() => setExpandedPost(null)}
          onDelete={handleDelete}
          onLike={handleLike}
        />
      ) : null}

      {/* ── Page header ── */}
      <header className="mb-8 flex items-center justify-between gap-4 rounded-3xl border-2 border-primary/40 bg-primary/5 px-6 py-5 shadow-[0_4px_0_var(--primary)]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Posts
          </h1>
          <p className="mt-1 text-sm text-foreground">
            Share your kitchen wins with the community.
          </p>
        </div>
        {userId ? (
          <button
            type="button"
            onClick={() => setShowNewPost(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border-2 border-primary-dark bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
          >
            <Camera size={16} />
            Share
          </button>
        ) : null}
      </header>

      {/* ── Your posts ── */}
      {userId ? (
        <section className="mb-10 rounded-3xl border-2 border-edge bg-card/50 p-5 shadow-[0_3px_0_var(--edge)]" aria-labelledby="my-posts-heading">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={15} className="text-muted" />
              <h2
                id="my-posts-heading"
                className="text-xs font-extrabold uppercase tracking-widest text-muted"
              >
                Private posts
              </h2>
            </div>
            {myPosts.length > 0 ? (
              <span className="rounded-full border-2 border-edge bg-card px-2.5 py-0.5 text-[11px] font-extrabold text-muted shadow-[0_2px_0_var(--edge)]">
                {myPosts.length}
              </span>
            ) : null}
          </div>

          {feedLoading ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="aspect-square animate-pulse rounded-2xl bg-surface" />
              ))}
            </ul>
          ) : myPosts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-edge bg-surface py-10 text-center shadow-[0_3px_0_var(--edge)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light shadow-[0_3px_0_var(--primary)]">
                <Camera size={24} className="text-primary-dark" />
              </div>
              <div>
                <p className="font-extrabold text-foreground">No private posts</p>
                <p className="mt-0.5 text-sm text-muted">Posts saved privately will appear here.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPost(true)}
                className="rounded-2xl border-2 border-primary-dark bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5"
              >
                Share your first post
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
              {myPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  isMine
                  onOpen={setExpandedPost}
                  onDelete={handleDelete}
                  onLike={userId ? handleLike : undefined}
                />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="mb-10 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-edge bg-surface py-10 text-center shadow-[0_3px_0_var(--edge)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light shadow-[0_3px_0_var(--primary)]">
            <Camera size={24} className="text-primary-dark" />
          </div>
          <div>
            <p className="font-extrabold text-foreground">Share your creations</p>
            <p className="mt-0.5 text-sm text-muted">Sign in to post photos of your cooking.</p>
          </div>
          <Link
            href="/login"
            className="rounded-2xl border-2 border-primary-dark bg-primary px-5 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* ── Community feed ── */}
      <section className="rounded-3xl border-2 border-edge bg-card/50 p-5 shadow-[0_3px_0_var(--edge)]" aria-labelledby="community-heading">
        <div className="mb-4 flex items-center gap-2">
          <Globe size={15} className="text-muted" />
          <h2
            id="community-heading"
            className="text-xs font-extrabold uppercase tracking-widest text-muted"
          >
            Community
          </h2>
        </div>

        {feedLoading ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="aspect-square animate-pulse rounded-2xl bg-surface" />
            ))}
          </ul>
        ) : feedError ? (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-[0_3px_0_#fcd34d]">
            ⚠️ {feedError}
          </div>
        ) : communityPosts.length === 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            <EmptyGrid
              message="Nothing from the community yet"
              sub="Be the first to inspire others!"
            />
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            {communityPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                isMine={p.user_id === userId}
                onOpen={setExpandedPost}
                onDelete={p.user_id === userId ? handleDelete : undefined}
                onLike={userId ? handleLike : undefined}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
