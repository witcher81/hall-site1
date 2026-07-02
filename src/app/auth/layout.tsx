import AuthThemeToggle from "@/components/auth/AuthThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthThemeToggle />
      {children}
    </>
  );
}
