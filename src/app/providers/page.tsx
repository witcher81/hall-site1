import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/admin";
import HomeHeader from "@/components/HomeHeader";
import ProvidersSearchClient from "./ProvidersSearchClient";

export default async function ProvidersPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-[#E0D4C3] pb-6 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">שירותי ספקים</h1>
          <p className="mt-2 text-sm font-semibold text-[#2A261F]">
            כאן תוכלו להפוך את האירוע שלכם לבלתי נשכח!
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6B6560]">
            מאגר ספקים מקצועיים לאירועים — צילום, DJ, קייטרינג, עיצוב, איפור ועוד. בוחרים
            קטגוריה וטווח מחיר, רואים מי מציע את השירות, נכנסים לפרטים ושולחים בקשה ישירות
            לספקים שנראים לכם מתאימים — הכול במקום אחד, בלי ריצות מיותרות.
          </p>
        </header>
        <ProvidersSearchClient />
      </main>
    </div>
  );
}
