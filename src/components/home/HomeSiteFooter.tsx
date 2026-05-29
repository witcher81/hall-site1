import Link from "next/link";

export default function HomeSiteFooter() {
  return (
    <footer className="mt-4 border-t border-neutral-200 bg-neutral-950 px-4 py-10 text-center text-sm text-neutral-400 sm:px-6">
      <p className="text-neutral-300">
        © {new Date().getFullYear()} Halls Hub – חיפוש אולמות ושירותי אירועים
      </p>
      <p className="mt-3 flex justify-center gap-6">
        <Link href="/terms" className="text-amber-400/90 hover:text-amber-300">
          תנאי שימוש
        </Link>
        <Link href="/privacy" className="text-amber-400/90 hover:text-amber-300">
          פרטיות
        </Link>
      </p>
    </footer>
  );
}
