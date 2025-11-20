import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import styles from "../page.module.css";
import { submitOnboarding } from "./actions";
import CitizenshipSelect from "./citizenship-select";
import CurrencySelect from "./currency-select";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className={styles.page}>
      <main className={styles.surface}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Welcome! Let's get you set up.</h2>
            <p className={styles.helper}>
              Tell us a bit about your preferences to help us plan your trips.
            </p>
          </div>

          <form action={submitOnboarding} className={styles.cardCtas} style={{ flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <label className={styles.statLabel} htmlFor="name">Name</label>
              <input
                name="name"
                defaultValue={session.user?.name ?? ""}
                className={styles.secondaryAction}
                style={{ textAlign: 'left', paddingLeft: 20 }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <label className={styles.statLabel} htmlFor="citizenship">Citizenship</label>
              <CitizenshipSelect defaultValue="" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <label className={styles.statLabel} htmlFor="currency">Preferred Currency</label>
              <CurrencySelect defaultValue="USD" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              <label className={styles.statLabel} htmlFor="food_dietary">Dietary Restrictions</label>
              <input
                name="food_dietary"
                placeholder="e.g. Vegan, None"
                className={styles.secondaryAction}
                style={{ textAlign: 'left', paddingLeft: 20 }}
              />
            </div>

            <button type="submit" className={styles.primaryAction}>
              <span>Complete Setup</span>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
