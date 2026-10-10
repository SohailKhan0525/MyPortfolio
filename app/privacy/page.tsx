import Link from "next/link";

export default function PrivacyPage() {
  return <main className="not-found"><p className="eyebrow">Privacy</p><h1>Privacy policy</h1><p>This portfolio does not collect personal data through forms. It counts page views and unique visitors using a random anonymous ID stored in your browser, with no names, emails, or IP addresses saved. External services linked from this site may process data under their own policies.</p><Link className="button button-primary" href="/">Back to portfolio</Link></main>;
}
