import { Suspense } from "react";
import RegisterForm from "../RegisterForm";

function RegisterFallback() {
  return (
    <div className="site-page px-4 py-12 text-center text-sm text-neutral-600">
      טוען...
    </div>
  );
}

export default function BusinessRegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm variant="business" />
    </Suspense>
  );
}
