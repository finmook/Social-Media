export type ChatUser = {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
};

export type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    readAt: string | null;
    createdAt: string;
    /** Client-only: optimistic messages that haven't been confirmed by the server yet */
    status?: 'sending' | 'failed';
};

export type Conversation = {
    friend: ChatUser;
    lastMessage: Message | null;
    unreadCount: number;
};
