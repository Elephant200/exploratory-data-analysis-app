import { Suspense } from "react";
import type { Metadata } from "next";

import { Chat } from "@/components/chat/chat";

export const metadata: Metadata = {
  title: "Analysis | EDA Agent",
};

export default function ChatPage() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}
