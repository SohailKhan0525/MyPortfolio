import Link from "next/link";

export default function PrivacyPage() {
  return <main className="not-found"><p className="eyebrow">Privacy</p><h1>Privacy policy</h1><p>This portfolio does not collect personal data directly through forms. External services linked from this site may process data under their own policies.</p><Link className="button button-primary" href="/">Back to portfolio</Link></main>;
}
