import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context, SessionFlavor } from "grammy";

// Define the shape of our session.
export interface SessionData {
  userId?: number;
  name: string;
  isAdmin: boolean;
  isNotifications?: boolean;
}

export type MyContext = Context &
  ConversationFlavor &
  SessionFlavor<SessionData>;
export type MyConversation = Conversation<MyContext>;

export function createInitialSessionData(): SessionData {
  return {
    isAdmin: false,
    name: "not found",
    isNotifications: false,
  };
}
