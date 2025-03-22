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
    
    let leftover = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
    
      const chunk = decoder.decode(value, { stream: true });
      console.log("chunk", chunk);
      const lines = (leftover + chunk).split("\n");
      leftover = lines.pop() ?? ""; // hold onto last partial line
    
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
    
        try {
          const part: Part = JSON.parse(trimmed);
    
          if (part.text?.trim() === "") continue;
    
          assistantMessage.parts.push(part);
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { ...assistantMessage },
          ]);
        } catch (err) {
          console.error("JSON parse error:", err, trimmed);
        }
      }
    }
  };

  return { messages, sendMessage };
}
