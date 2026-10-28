import "./brand-mark.css";

/** The supplied Qofeno PNG is an alpha mask, so its original shape follows the theme. */
export default function BrandMark() {
  return <span className="brand-mark qofeno-mark" aria-hidden="true" />;
}
