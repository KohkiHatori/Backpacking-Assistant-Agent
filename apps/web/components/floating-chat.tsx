"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Fab,
  CircularProgress,
  Collapse,
  Badge
} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import Markdown from 'react-markdown';

interface FloatingChatProps {
  tripId: string;
}

export default function FloatingChat({ tripId }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  console.log('tripId in floating chat:', tripId);

  const { messages, sendMessage, isLoading } = useChat({
    api: "/api/chat",
    body: { tripId },
    initialMessages: [{
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! How can I help with your trip?'
    }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage({ text: input }, { body: { tripId } });
    setInput("");
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Debug log
  console.log('Current messages:', messages.map(m => ({
    role: m.role,
    content: m.content,
    parts: m.parts,
    id: m.id
  })));

  return (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
      <Collapse in={isOpen} unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            width: 350,
            height: 500,
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }}
        >
          {/* Header */}
          <Box sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight="bold">Trip Assistant</Typography>
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, opacity: 0.7 }}>
                <SmartToyIcon sx={{ fontSize: 48, mb: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary" align="center">
                  Hi! I can help you modify your itinerary or find accommodations. What do you need?
                </Typography>
              </Box>
            )}

            {messages.map((m) => (
              <Box
                key={m.id}
                sx={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  gap: 1,
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: m.role === 'user' ? 'secondary.main' : 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  mt: 0.5,
                  flexShrink: 0,
                  fontSize: 12
                }}>
                  {m.role === 'user' ? <PersonIcon sx={{ fontSize: 14 }} /> : <SmartToyIcon sx={{ fontSize: 14 }} />}
                </Box>
                <Paper sx={{
                  p: 1.5,
                  bgcolor: m.role === 'user' ? 'primary.light' : 'white',
                  color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  '& p': { m: 0 },
                  '& ul, & ol': { m: 0, pl: 2 },
                  overflowWrap: 'break-word'
                }}>
                  {/* ✅ FIXED: Robust rendering for all v5 message formats */}
                  {m.parts && m.parts.length > 0 ? (
                    m.parts.map((part, index) =>
                      part.type === 'text' ? <Markdown key={index}>{part.text}</Markdown> : null
                    )
                  ) : m.content ? (
                    <Markdown>{m.content}</Markdown>
                  ) : (
                    <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                      Processing...
                    </Typography>
                  )}

                  {/* ✅ COMPLETE TOOL INVOCATION HANDLING */}
                  {m.toolInvocations?.map((toolInvocation) => {
                    const toolCallId = toolInvocation.toolCallId;

                    if (!('result' in toolInvocation)) {
                      // Pending tool call
                      return (
                        <Box key={toolCallId} sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}>
                          <CircularProgress size={10} color="inherit" />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            Using tool: {toolInvocation.toolName}
                          </Typography>
                        </Box>
                      );
                    }

                    if ('result' in toolInvocation && toolInvocation.result) {
                      // Successful tool result
                      return (
                        <Box key={toolCallId} sx={{ mt: 1, pl: 2, borderLeft: '2px solid', borderColor: 'primary.main', bgcolor: 'grey.50', py: 1 }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, color: 'primary.main', fontSize: '0.8rem' }}>
                            {toolInvocation.toolName} result:
                          </Typography>
                          {typeof toolInvocation.result === 'string' ? (
                            <Markdown>{toolInvocation.result}</Markdown>
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(toolInvocation.result, null, 2)}
                            </Typography>
                          )}
                        </Box>
                      );
                    }

                    return null;
                  })}
                </Paper>
              </Box>
            ))}

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', ml: 4 }}>
                <Box sx={{ display: 'flex', gap: 0.5, p: 1, bgcolor: 'white', borderRadius: 2 }}>
                  <CircularProgress size={16} />
                  <span className="dot-flashing" style={{ fontSize: '12px' }}>.</span>
                </Box>
              </Box>
            )}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', gap: 1, width: '100%' }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={isLoading || !input.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </form>
          </Box>
        </Paper>
      </Collapse>

      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          display: isOpen ? 'none' : 'flex',
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
        }}
      >
        <Badge badgeContent={0} color="error">
          <ChatIcon />
        </Badge>
      </Fab>
    </Box>
  );
}
