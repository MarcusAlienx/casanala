;"use client";

import { Icons } from "@/components/icons";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';
import { useState } from 'react';

const DynamicMap = dynamic(() => import('../components/GeofencingMap'), {
  ssr: false,
});

export default function Home() {
  const [messages, setMessages] = useState([
    { text: "Welcome to CasaNala! How can I help you?", sender: "bot" },
  ]);

  const handleSendMessage = (newMessage: string) => {
    setMessages([...messages, { text: newMessage, sender: "user" }]);
    // Simulate bot response
    setTimeout(() => {
      setMessages([...messages, { text: newMessage, sender: "user" }, { text: "Thanks for your message!", sender: "bot" }]);
    }, 500);
  };

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        <header className="p-4 border-b">
          <Icons.casaNalaLogo className="h-6 w-auto" />
          <h1 className="text-2xl font-bold">CasaNala.com.mx</h1>
        </header>

        <main className="flex flex-1">
          <section className="w-1/2 p-4">
            <h2 className="text-xl font-semibold mb-2">Interactive Menu</h2>
            <p>TODO: Implement Interactive Menu</p>
          </section>

          <section className="w-1/2 p-4">
            <h2 className="text-xl font-semibold mb-2">Geofencing Map</h2>
            <DynamicMap />
          </section>
        </main>

        <footer className="p-4 border-t">
          <Chatbot messages={messages} onSendMessage={handleSendMessage} />
        </footer>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}

function Chatbot({ messages, onSendMessage }: { messages: { text: string; sender: string; }[]; onSendMessage: (newMessage: string) => void; }) {
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}
