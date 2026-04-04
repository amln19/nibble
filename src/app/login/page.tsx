import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = {
  title: "Sign in",
};

function LoginFormFallback() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-pink-100 bg-white p-8 shadow-sm">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-100" />
      <div className="mt-4 h-24 w-full animate-pulse rounded bg-zinc-50" />
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
