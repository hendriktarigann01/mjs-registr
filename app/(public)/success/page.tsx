import { Suspense } from "react";
import RegistrationForm from "@/components/RegistrationForm";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationForm />;
    </Suspense>
  );
}
