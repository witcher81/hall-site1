import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        © {new Date().getFullYear()} Halls Hub – חיפוש אולמות ושירותי אירועים
      </p>
      <p className="mt-3 flex justify-center gap-6">
        <Link href="/terms">תנאי שימוש</Link>
        <Link href="/privacy">פרטיות</Link>
      </p>
    </footer>
  );
}
