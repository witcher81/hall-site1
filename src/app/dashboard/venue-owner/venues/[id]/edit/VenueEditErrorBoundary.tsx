"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; venueId: number };
type State = { error: Error | null };

export default class VenueEditErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
          <main className="mx-auto max-w-3xl px-4 py-12 text-right">
            <h1 className="text-lg font-semibold text-[#0F3B2E]">
              לא הצלחנו לטעון את טופס העריכה
            </h1>
            <p className="mt-2 text-sm text-[#2A261F]">
              אירעה שגיאה בדפדפן. נסו לרענן את הדף; אם הבעיה נמשכת, פנו לתמיכה.
            </p>
            <p className="mt-4 rounded-lg border border-[#E0D4C3] bg-white/80 px-3 py-2 font-mono text-[11px] text-[#6B6560]">
              {this.state.error.message}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-[#0F3B2E] px-4 py-2 text-sm font-semibold text-white"
              >
                רענון הדף
              </button>
              <a
                href={`/dashboard/venue-owner/venues/${this.props.venueId}`}
                className="rounded-full border border-[#0F3B2E] px-4 py-2 text-sm font-semibold text-[#0F3B2E]"
              >
                חזרה לאולם
              </a>
            </div>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}
