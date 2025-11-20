'use client';

import { signIn, signOut } from "next-auth/react";
import styles from "../page.module.css";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className={styles.primaryAction}
    >
      <span>Sign in with Google</span>
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M3 8h10m-4-4 4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth" })}
      className={styles.primaryAction}
    >
      <span>Sign out</span>
    </button>
  );
}

