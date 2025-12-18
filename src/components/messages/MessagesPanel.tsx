import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useMessages, useSendMessage, Conversation, Message } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MessagesPanel() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedConversation || '');
  const sendMessage = useSendMessage();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversation,
        content: messageInput,
      });
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.user_id !== user?.id)?.profile;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loadingConversations) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border rounded-lg overflow-hidden bg-card">
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Mensagens</h2>
        </div>
        
        <ScrollArea className="flex-1">
          {conversations?.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conversa ainda</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations?.map((conv) => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv.id}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-accent text-left transition-colors",
                      selectedConversation === conv.id && "bg-accent"
                    )}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <Avatar>
                      <AvatarImage src={other?.avatar_url || undefined} />
                      <AvatarFallback>{other?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{other?.full_name || 'Usuário'}</p>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {conversations && (
                (() => {
                  const conv = conversations.find(c => c.id === selectedConversation);
                  const other = conv ? getOtherParticipant(conv) : null;
                  return (
                    <>
                      <Avatar>
                        <AvatarImage src={other?.avatar_url || undefined} />
                        <AvatarFallback>{other?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{other?.full_name || 'Usuário'}</p>
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages?.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={msg.sender?.avatar_url || undefined} />
                            <AvatarFallback>{msg.sender?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            isOwn 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn(
                            "text-xs mt-1 opacity-70",
                            isOwn ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={sendMessage.isPending || !messageInput.trim()}>
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground">Escolha uma conversa para visualizar as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
