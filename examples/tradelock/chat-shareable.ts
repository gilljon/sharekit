/**
 * Example: Coach chat sharing definition for a trading journal
 *
 * Maps Tradelock's simpler all-or-nothing chat sharing pattern.
 * Chat sharing has no granular toggles -- the entire conversation is shared
 * or not. We model this with a single "conversation" field.
 */
import { shareable } from "./shareable.config";

declare function getChatMessages(
  userId: string,
  chatId: string,
): Promise<Array<{ role: string; content: string; createdAt: Date }>>;

export const chatShare = shareable.define("chat", {
  fields: {
    conversation: { label: "Full Conversation", default: true },
  },

  getData: async ({ ownerId, params }) => {
    const chatId = params.chatId as string;
    const messages = await getChatMessages(ownerId, chatId);
    return {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  },

  ogImage: ({ data, ownerName }) => {
    const d = data as { messages: Array<{ role: string }> };
    return {
      title: `${ownerName}'s Coaching Session`,
      subtitle: `${d.messages.length} messages`,
    };
  },
});
