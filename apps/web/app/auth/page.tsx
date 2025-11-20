import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";
import styles from "../page.module.css";
import { GoogleSignInButton, SignOutButton } from "./auth-buttons";

const containerStyle = {
  maxWidth: 420,
  margin: "0 auto",
  minHeight: "60vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
  padding: 24,
  textAlign: "center",
} as const;

const buttonStyle = {
  borderRadius: 6,
  padding: "10px 18px",
  border: "none",
  backgroundColor: "#111827",
  color: "#fff",
  cursor: "pointer",
} as const;

interface AuthPageProps {
  searchParams?: {
    from?: string;
    callbackUrl?: string;
  };
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const session = await getServerSession(authOptions);
  const callbackUrl = searchParams?.callbackUrl ?? searchParams?.from ?? "/";
  const year = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <main className={styles.surface}>
        <section className={styles.hero}>
          <span className={styles.tag}>Backpacking Assistant</span>
          <h1 className={styles.heroTitle}>
            Secure your gear and get back to the trail
          </h1>
          <p className={styles.heroBody}>
            {session
              ? "You're signed in. Manage your account or sign out here."
              : "Sign in to sync your checklists, permits, and packing iterations across devices."}
          </p>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.overline}>
              {session ? "Account" : "Welcome back"}
            </p>
            <h2>
              {session
                ? `Signed in as ${session.user?.name ?? session.user?.email ?? "Unknown user"
                }`
                : "Access your pack in seconds"}
            </h2>
            <p className={styles.helper}>
              {session
                ? "You can now access all your synchronized trip data."
                : "Use your Google account to keep every route, checklist, and insight safely in one place."}
            </p>
          </div>

          {session ? (
            <div className={styles.cardCtas}>
              <SignOutButton />
            </div>
          ) : (
            <div className={styles.cardCtas}>
              <GoogleSignInButton callbackUrl={callbackUrl} />
            </div>
          )}
        </section>
      </main>
      <footer className={styles.footer}>
        <span>© {year} Backpacking Assistant</span>
        <div className={styles.footerLinks}>
          <a href="mailto:privacy@backpackingassistant.app">Privacy</a>
          <a href="mailto:legal@backpackingassistant.app">Terms</a>
        </div>
      </footer>
    </div>
  );
}
