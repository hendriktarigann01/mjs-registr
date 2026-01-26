import { Suspense } from "react";
import RegistrationForm from "@/components/RegistrationForm";

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationForm />
    </Suspense>
  );
}
