"use client";
import { useState } from "react";
import useChat from "./useChat";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

export default function Chat() {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} text={msg.parts[0]?.text || ""} />
          ) : (
            <AssistantMessage key={i} parts={msg.parts} />
          )
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex mt-2">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
}
