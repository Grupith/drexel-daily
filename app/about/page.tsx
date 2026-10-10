import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Drexel Daily",
};

export default function AboutPage() {
  return (
    <div className="daily-page landing-page">
      <main className="daily-main">
        <div className="play-layout">
          <Link href="/" className="play-home">
            Back to home
          </Link>
          <section className="play-card" aria-labelledby="about-title">
            <p className="play-eyebrow">A little sharper, every day</p>
            <h1 id="about-title">About Drexel Daily</h1>
            <p className="play-instruction">
              A quick daily challenge for the Drexel Building Supply team. Three
              questions, a little Drexel know-how, and something new to learn.
            </p>
            <p className="play-instruction">
              Fresh challenges arrive every weekday, covering products, vendors,
              company knowledge, safety, and more.
            </p>
            <Link href="/" className="play-home">
              Click to play now!
            </Link>
            <footer className="about-credit">
              <span className="about-credit-avatar" aria-hidden="true">
                DK
              </span>
              <div>
                <p className="about-credit-label">Built by</p>
                <p className="about-credit-name">Dylan Koss</p>
                <p className="about-credit-team">Kewaskum Fulfillment</p>
                <a
                  className="about-credit-email"
                  href="mailto:dylan.koss@drexelteam.com"
                >
                  dylan.koss@drexelteam.com
                </a>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
