import styles from "./page.module.css";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <main className={styles.surface}>
        <section className={styles.hero}>
          <span className={styles.tag}>Backpacking Assistant</span>
          <h1 className={styles.heroTitle}>Plan lighter. Move faster.</h1>
          <p className={styles.heroBody}>
            A minimal hub for teams who obsess over beta, weight, and weather.
            The Backpacking Assistant distills your prep into calm, actionable
            cards so you can spend more time outside—not inside another app.
          </p>
          <ul className={styles.highlights}>
            <li>
              <span aria-hidden="true" />
              Snapshot itineraries you can share in one link
            </li>
            <li>
              <span aria-hidden="true" />
              Gear presets tuned to alpine, desert, and jungle climates
            </li>
            <li>
              <span aria-hidden="true" />
              Focus cues that surface only the next critical task
            </li>
          </ul>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgePulse} aria-hidden="true" />
            Field-tested on 40+ unsupported expeditions
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.overline}>Trail operations</p>
            <h2>Keep every trek brief and breathable</h2>
            <p className={styles.helper}>
              Assemble routes, dial in packs, and sync crew context without
              juggling five tools or forcing a login before you&rsquo;re ready.
            </p>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Routes templated</span>
              <span className={styles.statValue}>340+</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Gear profiles</span>
              <span className={styles.statValue}>58</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Offline playbooks</span>
              <span className={styles.statValue}>12</span>
            </div>
          </div>
          <ul className={styles.cardList}>
            <li>Drag-and-drop checklist blocks tuned to mileage and elevation.</li>
            <li>Drop zone heatmaps so crews know exactly where the risk lives.</li>
            <li>One push export to PDF, GPX, and laminated field cards.</li>
          </ul>
          <div className={styles.cardCtas}>
            <a
              className={styles.primaryAction}
              href="https://github.com/kohkihatori/Backpacking-Assistant-Agent"
              target="_blank"
              rel="noreferrer"
            >
              Browse the playbook
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
            </a>
            <a
              className={styles.secondaryAction}
              href="mailto:support@backpackingassistant.app?subject=Trail%20ops%20inquiry"
            >
              Talk to our team
            </a>
          </div>
          <p className={styles.meta}>
            No accounts required to explore. We&rsquo;ll invite you to a shared
            workspace when you&rsquo;re trail-ready.
          </p>
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
