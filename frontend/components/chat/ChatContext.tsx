'use client'
import { createContext, useContext } from 'react';
import type { Conversation, Message } from './types';

export type ChatContextValue = {
    token: string;
    myId: string;
    conversations: Conversation[];
    /** Update the sidebar with a new/sent message (deduplicated by id). */
    applyMessage: (message: Message) => void;
    clearUnread: (friendId: string) => void;
    api: (path: string, init?: RequestInit) => Promise<Response>;
};

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used inside the Chat layout');
    return ctx;
}
