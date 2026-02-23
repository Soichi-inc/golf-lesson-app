import type { Metadata } from "next";
import { CustomerHeader } from "@/components/customer/Header";
import { CustomerFooter } from "@/components/customer/Footer";

export const metadata: Metadata = {
  title: {
    template: "%s | Golf Lesson",
    default: "Golf Lesson",
  },
  description: "プロゴルファーによるレッスン予約サイト",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <CustomerHeader />
      <div className="flex-1">{children}</div>
      <CustomerFooter />
    </div>
  );
}
