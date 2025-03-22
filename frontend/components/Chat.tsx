"use client";
import useChat from "./useChat";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import { useRef, useEffect, useState } from "react";

export default function Chat() {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;
  
    const handleScroll = () => {
      const distanceFromBottom =
        chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
      setShouldAutoScroll(distanceFromBottom < 100); // adjust threshold if needed
    };
  
    chatBox.addEventListener("scroll", handleScroll);
    return () => chatBox.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (chatBox && shouldAutoScroll) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-box" ref={chatBoxRef}>
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
