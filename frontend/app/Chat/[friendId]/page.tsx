'use client'
import { useParams } from 'next/navigation';
import ConversationView from '@/components/chat/ConversationView';

export default function ChatConversation() {
    const { friendId } = useParams<{ friendId: string }>();
    // key resets all conversation state when switching between friends
    return <ConversationView key={friendId} friendId={friendId} />;
}
