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
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">
            חיפוש פרילנסרים
          </h1>
          <p className="mt-1 text-sm text-[#6B6560]">
            צלמים, DJ, קייטרינג, עיצוב ועוד – אנשי מקצוע עצמאיים ליום האירוע. סננו לפי קטגוריה
            ומחיר ושלחו בקשה למי שבחרתם.
          </p>
        </header>
        <ProvidersSearchClient />
      </main>
    </div>
  );
}
