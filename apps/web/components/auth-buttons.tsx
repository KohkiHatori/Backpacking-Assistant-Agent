"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@mui/material";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M3 8h10m-4-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      onClick={() => signIn("google", { callbackUrl })}
      endIcon={<GoogleIcon />}
    >
      Sign in with Google
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => signOut({ callbackUrl: "/auth" })}
    >
      Sign out
    </Button>
  );
}
