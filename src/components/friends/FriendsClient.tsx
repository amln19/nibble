"use client";

import { createClient } from "@/lib/supabase/client";
import type { CreationRow } from "@/lib/creations";
import {
  Check,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
  Trophy,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Leaderboard } from "./Leaderboard";

// ── Types ────────────────────────────────────────────────────────────────────

type Friend = { id: string; username: string };
type FriendRequest = {
  id: string;
  from_user: string;
  from_username: string;
  status: string;
  created_at: string;
};
type LeaderboardEntry = {
  id: string;
  username: string;
  isMe: boolean;
  totalPoints: number;
  stats: {
    savedCount: number;
    postsCount: number;
    cookSessions: number;
    likesReceived: number;
  };
};

// ── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "leaderboard" | "friends" | "posts";

// ── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

// ── Main component ───────────────────────────────────────────────────────────

export function FriendsClient() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("leaderboard");

  // Friend management
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Friend posts
  const [posts, setPosts] = useState<CreationRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // ── Auth check ────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
      setLoading(false);
    });
  }, []);

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends ?? []);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/friends/requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(
        (data.requests ?? []).map((r: any) => ({
          id: r.id,
          from_user: r.from_user,
          from_username: r.from_username,
          status: r.status,
          created_at: r.created_at,
        }))
      );
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    const res = await fetch("/api/friends/leaderboard");
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data.leaderboard ?? []);
    }
    setLeaderboardLoading(false);
  }, []);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    const res = await fetch("/api/friends/posts");
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts ?? []);
    }
    setPostsLoading(false);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    void loadFriends();
    void loadRequests();
    void loadLeaderboard();
  }, [loggedIn, loadFriends, loadRequests, loadLeaderboard]);

  useEffect(() => {
    if (!loggedIn || tab !== "posts") return;
    void loadPosts();
  }, [loggedIn, tab, loadPosts]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendRequest = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchStatus(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: searchQuery.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.status === "accepted") {
        setSearchStatus(`Now friends with ${data.friend?.username ?? searchQuery}!`);
        void loadFriends();
        void loadLeaderboard();
      } else {
        setSearchStatus("Friend request sent!");
      }
      setSearchQuery("");
    } else {
      setSearchStatus(data.error ?? "Something went wrong");
    }
  }, [searchQuery, loadFriends, loadLeaderboard]);

  const handleAccept = useCallback(
    async (requestId: string) => {
      await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "accept" }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      void loadFriends();
      void loadLeaderboard();
    },
    [loadFriends, loadLeaderboard]
  );

  const handleReject = useCallback(async (requestId: string) => {
    await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "reject" }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const handleRemove = useCallback(
    async (friendId: string) => {
      setRemovingId(null);
      await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      void loadLeaderboard();
    },
    [loadLeaderboard]
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-8xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-8">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-surface" />
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  // ── Logged out ────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <div className="mx-auto flex w-full max-w-8xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/50 bg-primary-light shadow-[0_4px_0_var(--primary)]">
          <Users size={24} className="text-primary-dark" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Friends &amp; Leaderboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to add friends and compete on the leaderboard.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-2xl border-2 border-primary-dark bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; Icon: typeof Trophy }[] = [
    { id: "leaderboard", label: "Leaderboard", Icon: Trophy },
    { id: "friends", label: "Friends", Icon: Users },
    { id: "posts", label: "Friend Posts", Icon: LayoutGrid },
  ];

  return (
    <div className="mx-auto w-full max-w-8xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-8">
      {/* Header */}
      <header className="mb-6 rounded-3xl border-2 border-primary/40 bg-primary/5 px-6 py-5 shadow-[0_4px_0_var(--primary)]">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Friends &amp; Leaderboard
        </h1>
        <p className="mt-1 text-sm text-foreground">
          {friends.length} friend{friends.length !== 1 ? "s" : ""} ·{" "}
          {requests.length > 0
            ? `${requests.length} pending request${requests.length !== 1 ? "s" : ""}`
            : "No pending requests"}
        </p>
      </header>

      {/* Tab bar */}
      <div className="mb-6 flex gap-2">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-2xl border-2 px-4 py-2 text-xs font-extrabold transition-all active:translate-y-0.5 active:shadow-none ${
              tab === id
                ? "border-primary bg-primary-light text-primary-dark shadow-[0_3px_0_var(--primary)]"
                : "border-edge bg-card text-muted shadow-[0_3px_0_var(--edge)] hover:border-edge-hover hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
            {id === "friends" && requests.length > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-white tabular-nums">
                {requests.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Leaderboard Tab ── */}
      {tab === "leaderboard" && (
        <div>
          {leaderboardLoading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface border-t-primary" />
              <p className="text-sm font-extrabold text-muted">Loading leaderboard…</p>
            </div>
          ) : (
            <Leaderboard entries={leaderboard} />
          )}
        </div>
      )}

      {/* ── Friends Tab ── */}
      {tab === "friends" && (
        <div className="space-y-6">
          {/* Add friend */}
          <div className="rounded-2xl border-2 border-edge bg-card p-4 shadow-[0_3px_0_var(--edge)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <UserPlus size={15} /> Add Friend
            </h3>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
                  <Search size={14} />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchStatus(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendRequest();
                    }
                  }}
                  placeholder="Search by username…"
                  className="w-full rounded-2xl border-2 border-edge bg-card py-2.5 pr-3 pl-9 text-sm font-bold text-foreground placeholder:font-normal placeholder:text-muted shadow-[0_2px_0_var(--edge)] transition-all focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => void sendRequest()}
                disabled={!searchQuery.trim()}
                className="shrink-0 rounded-2xl border-2 border-primary-dark bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_3px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
              >
                Send
              </button>
            </div>
            {searchStatus && (
              <p className="mt-2 text-xs font-bold text-muted">
                {searchStatus}
              </p>
            )}
          </div>

          {/* Pending requests */}
          {requests.length > 0 && (
            <div className="rounded-2xl border-2 border-edge bg-card p-4 shadow-[0_3px_0_var(--edge)]">
              <h3 className="mb-3 text-sm font-extrabold text-foreground">
                Pending Requests
              </h3>
              <ul className="space-y-2">
                {requests.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-edge bg-surface px-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-edge bg-card text-xs font-extrabold text-muted">
                      {req.from_username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate text-sm font-bold text-foreground">
                      {req.from_username}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleAccept(req.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-primary bg-primary-light text-primary-dark transition hover:bg-primary hover:text-white"
                      aria-label="Accept"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(req.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-edge bg-surface text-muted transition hover:border-red-300 hover:text-red-600"
                      aria-label="Reject"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Friend list */}
          <div className="rounded-2xl border-2 border-edge bg-card p-4 shadow-[0_3px_0_var(--edge)]">
            <h3 className="mb-3 text-sm font-extrabold text-foreground">
              Your Friends ({friends.length})
            </h3>
            {friends.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No friends yet. Search by username above to add some!
              </p>
            ) : (
              <ul className="space-y-2">
                {friends.map((friend) => (
                  <li
                    key={friend.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-edge bg-surface px-3 py-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-edge bg-card text-xs font-extrabold text-muted">
                      {friend.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate text-sm font-bold text-foreground">
                      {friend.username}
                    </span>

                    {removingId === friend.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted">
                          Remove?
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleRemove(friend.id)}
                          className="rounded-lg border-2 border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-600 transition hover:bg-red-100"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemovingId(null)}
                          className="rounded-lg border-2 border-edge bg-surface px-2 py-0.5 text-[10px] font-extrabold text-muted transition hover:text-foreground"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemovingId(friend.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-edge bg-surface text-muted transition hover:border-red-300 hover:text-red-600"
                        aria-label="Remove friend"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Posts Tab ── */}
      {tab === "posts" && (
        <div>
          {postsLoading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface border-t-primary" />
              <p className="text-sm font-extrabold text-muted">Loading posts…</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-edge bg-surface py-12 text-center shadow-[0_3px_0_var(--edge)]">
              <LayoutGrid size={28} className="mx-auto text-muted" />
              <p className="mt-3 font-extrabold text-foreground">
                No friend posts yet
              </p>
              <p className="mt-1 text-sm text-muted">
                When your friends share their creations, they&apos;ll appear
                here.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="group relative overflow-hidden rounded-2xl border-[3px] border-edge bg-card shadow-[0_4px_0_var(--edge)] transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_6px_0_var(--primary)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-surface">
                    <Image
                      src={post.image_url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <p className="line-clamp-2 text-left text-sm font-extrabold leading-tight text-white">
                        {post.title}
                      </p>
                      <p className="mt-0.5 text-left text-xs text-white/70">
                        {post.author_label ?? "Chef"} ·{" "}
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
