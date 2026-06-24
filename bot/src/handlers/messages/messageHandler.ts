import { Message } from "discord.js";

export default function handleMessage(message: Message): void {
  if (!message.author.bot && message.content.toLowerCase().includes("quoi")) {
    try {
      if (message.channel && 'send' in message.channel && typeof message.channel.send === 'function') {
        message.channel.send("quoicoubeh");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
    }
  }
}
