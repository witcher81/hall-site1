import {
  parseServiceRequestMessage,
  serviceRequestSeekerNoteLabel,
} from "@/lib/serviceRequestMessageDisplay";

type Props = {
  message: string;
  className?: string;
};

export default function ServiceRequestMessageBody({ message, className = "" }: Props) {
  const parsed = parseServiceRequestMessage(message);
  const noteText = serviceRequestSeekerNoteLabel(parsed);

  return (
    <div className={`mt-3 space-y-2 ${className}`}>
      {parsed.venueName ? (
        <div className="rounded-xl border border-emerald-950/12 bg-emerald-50/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-emerald-950">מקור הבקשה</p>
          <p className="mt-1 text-xs text-neutral-800">
            הזמנת אולם: <strong>{parsed.venueName}</strong>
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/80 px-3 py-2.5">
        <p className="text-[10px] font-semibold text-neutral-700">הודעה מהמזמין</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
          {noteText}
        </p>
      </div>
    </div>
  );
}
