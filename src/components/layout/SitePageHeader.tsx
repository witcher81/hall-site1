type SitePageHeaderProps = {
  kicker?: string;
  hideKicker?: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function SitePageHeader({
  kicker = "HALLS HUB",
  hideKicker = false,
  title,
  description,
  children,
}: SitePageHeaderProps) {
  return (
    <header className="site-page-header">
      {!hideKicker ? <p className="site-kicker">{kicker}</p> : null}
      <h1 className="site-page-title">{title}</h1>
      {description ? <p className="site-page-lead">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
