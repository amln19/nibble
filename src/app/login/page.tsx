import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = {
  title: "Sign in",
};

function LoginFormFallback() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border-2 border-edge bg-card p-8 shadow-[0_4px_0_var(--edge)]">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-surface" />
      <div className="mt-4 h-24 w-full animate-pulse rounded-xl bg-surface" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
