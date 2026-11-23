"use client";

import { ErrorScreen } from "@/components/common/ErrorScreen";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <ErrorScreen {...props} variant="customer" />
    </div>
  );
}
