import { useState } from "react";

interface Part {
  text?: string;
  code_execution?: any;
}

interface ChatMessage {
  role: "user" | "assistant";
  parts: Part[];
}

export default function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async (input: string) => {
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", parts: [{ text: input }] },
    ];

    setMessages(updatedMessages);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMessages),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let assistantMessage: ChatMessage = {
      role: "assistant",
      parts: [],
    };

    setMessages((prev) => [...prev, assistantMessage]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true }).trim();
      if (!chunk) continue;

      try {
        const part: Part = JSON.parse(chunk);
        assistantMessage.parts.push(part);

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...assistantMessage },
        ]);
      } catch (err) {
        console.error("Streaming JSON parse error:", err);
      }
    }
  };

  return { messages, sendMessage };
}
