type Props = {
  message: string;
  onRetry?: () => void;
};

export default function AdminErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="admin-error flex flex-wrap items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="admin-btn admin-btn--ghost shrink-0"
        >
          נסה שוב
        </button>
      ) : null}
    </div>
  );
}
