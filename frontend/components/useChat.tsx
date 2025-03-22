import { useState } from "react";

interface Part {
  text?: string;
  code_execution?: any;
}

interface ChatMessage {
  role: "user" | "model";
  parts: Part[];
}

export default function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async (input: string) => {
    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        parts: [{ text: input }]
      } as ChatMessage
    ];

    setMessages(updatedMessages);
    console.log("updatedMessages", updatedMessages);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMessages),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let assistantMessage: ChatMessage = { role: "model", parts: [] };
    setMessages((prev) => [...prev, assistantMessage]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true }).trim();
      if (!chunk) continue;
      console.log("chunk", chunk);
      try {
        const part: Part = JSON.parse(chunk);

        if (part.text?.trim() === "") return;

        assistantMessage.parts.push(part);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...assistantMessage },
        ]);
      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }
  };

  return { messages, sendMessage };
}
