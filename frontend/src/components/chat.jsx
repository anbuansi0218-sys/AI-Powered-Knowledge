import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpwardRounded,
  AutoAwesomeRounded,
  DescriptionOutlined,
  AddRounded,
  LightbulbOutlined,
  CompareArrowsRounded,
  AttachFileRounded,
  ShieldOutlined,
  ContentCopyRounded,
  CheckRounded,
  DownloadRounded
} from '@mui/icons-material';

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  InputAdornment
} from '@mui/material';

import { api, jsonOptions } from '../services/api.js';
import chatHeroImage from '../assets/AI.png';
import { ErrorMessage } from './shared.jsx';

const suggestions = [
  {
    label: 'Summarize my latest document',
    icon: <DescriptionOutlined />
  },
  {
    label: 'What are the key takeaways?',
    icon: <LightbulbOutlined />
  },
  {
    label: 'Compare the main ideas',
    icon: <CompareArrowsRounded />
  }
];

function createPdf(content) {
  const normalized = content
    .replace(/[^\x09\x0A\x20-\x7E]/g, ' ')
    .replace(/\r/g, '');

  const lines = [];
  normalized.split('\n').forEach((paragraph) => {
    if (!paragraph) {
      lines.push('');
      return;
    }

    const words = paragraph.split(/\s+/);
    let line = '';

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= 90) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    });

    if (line) lines.push(line);
  });

  const pageSize = 48;
  const pages = [];
  for (let start = 0; start < lines.length; start += pageSize) {
    pages.push(lines.slice(start, start + pageSize));
  }
  if (pages.length === 0) pages.push(['']);

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pages
    .map((_, index) => `${4 + index * 2} 0 R`)
    .join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((pageLines, index) => {
    const pageObjectId = 4 + index * 2;
    const streamObjectId = pageObjectId + 1;
    const text = pageLines
      .map((line) => {
        const safeLine = line
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
        return `(${safeLine}) Tj T*`;
      })
      .join('\n');
    const stream = `BT\n/F1 11 Tf\n50 790 Td\n14 TL\n${text}\nET`;

    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${streamObjectId} 0 R >>`;
    objects[streamObjectId] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    if (!object) return;
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index] || 0).padStart(10, '0')} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export default function Chat({ chatId, onChatChange, onNotify }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [hasDocuments, setHasDocuments] = useState(true);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [textSelection, setTextSelection] = useState(null);

  const bottomRef = useRef(null);
  const questionRef = useRef(null);

  useEffect(() => {
    setError('');

    api('/documents')
      .then(({ documents }) =>
        setHasDocuments(
          documents.some((document) => document.status === 'ready')
        )
      )
      .catch(() => setHasDocuments(false));

    if (chatId) {
      api(`/chats/${chatId}`)
        .then(({ messages: savedMessages }) => setMessages(savedMessages))
        .catch((reason) => setError(reason.message));
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function copyAnswer(content, index) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedMessageIndex(index);
      onNotify?.('Answer copied.');
      window.setTimeout(() => setCopiedMessageIndex(null), 1500);
    } catch {
      onNotify?.('Could not copy the answer.');
    }
  }

  function downloadAnswer(content) {
    const blob = createPdf(content);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AI-Chat-Answer.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify?.('Answer downloaded as PDF.');
  }

  function showAskMeForSelection(event) {
    const answerElement = event.currentTarget;

    window.requestAnimationFrame(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || !selection.rangeCount) {
        setTextSelection(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!answerElement.contains(range.commonAncestorContainer)) {
        setTextSelection(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setTextSelection({
        text,
        x: Math.max(8, rect.left + rect.width / 2 - 42),
        y: Math.max(8, rect.top - 46)
      });
    });
  }

  function askAboutSelectedText() {
    if (!textSelection?.text) return;

    setQuestion(textSelection.text);
    setTextSelection(null);
    window.requestAnimationFrame(() => {
      questionRef.current?.focus();
    });
  }

  async function sendQuestion(event) {
    event.preventDefault();

    const cleanQuestion = question.trim();

    if (!cleanQuestion || sending) return;

    setQuestion('');
    setError('');

    setMessages((current) => [
      ...current,
      { role: 'user', content: cleanQuestion },
      { role: 'assistant', content: '', pending: true }
    ]);

    setSending(true);

    try {
      const result = await api(
        '/chats',
        jsonOptions('POST', { question: cleanQuestion, chatId })
      );

      if (!chatId) onChatChange(result.chatId);

      setMessages((current) => [
        ...current.slice(0, -1),
        result.message
      ]);

      onNotify('Answer added to your chat history.');
    } catch (reason) {
      setMessages((current) => current.slice(0, -1));
      setError(reason.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100dvh - 150px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pb: 2
      }}
    >
      {/* HEADER */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ width: '100%' }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#7460EA',
              fontWeight: 800,
              letterSpacing: 0.8,
              fontSize: 10
            }}
          >
            YOUR KNOWLEDGE ASSISTANT
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#202044',
              letterSpacing: -0.8,
              fontSize: { xs: 22, sm: 25 }
            }}
          >
            AI Chat
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: 13 }}
          >
            Ask anything. Explore ideas. Get intelligent answers.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddRounded />}
          onClick={() => {
            setQuestion('');
            onChatChange(null);
          }}
          sx={{
            flexShrink: 0,
            alignSelf: 'flex-start',
            ml: 'auto',
            mt: 1.5,
            mr: 1,
            height: 36,
            minHeight: 36,
            borderRadius: '12px',
            px: 1.5,
            py: 0,
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'none',
            color: '#6847EB',
            borderColor: '#BBAAFF',
            '&:hover': {
              bgcolor: '#F5F1FF',
              borderColor: '#7955EE'
            }
          }}
        >
          New chat
        </Button>
      </Stack>

      {!hasDocuments && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: '#FAF9FF'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No indexed documents yet. Questions can still be answered
            using web search.
          </Typography>
        </Paper>
      )}

      <ErrorMessage message={error} />

      {/* MAIN CHAT CONTAINER */}

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: { xs: 480, md: 510 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 4,
          borderColor: '#E9E5F5',
          bgcolor: '#FFFFFF',
          boxShadow: '0 8px 30px rgba(85,70,150,0.04)'
        }}
      >

        {/* WELCOME SCREEN */}

        {messages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              m: { xs: 1.5, sm: 2.5 },
              p: { xs: 2, sm: 3, md: 3.5 },
              minHeight: { xs: 380, md: 280 },
              borderRadius: 4,

              background:
                'linear-gradient(115deg, #E9DFFF 0%, #F3F0FF 48%, #DFEAFF 100%)',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,

              position: 'relative',
              overflow: 'hidden',

              '&::before': {
                content: '""',
                position: 'absolute',
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                left: -130,
                bottom: -180
              },

              '&::after': {
                content: '""',
                position: 'absolute',
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                right: -120,
                top: -120
              },

              flexDirection: { xs: 'column', md: 'row' }
            }}
          >

            <Box
              component="img"
              src={chatHeroImage}
              alt="AI assistant with document knowledge"
              sx={{
                width: { xs: '100%', md: '45%' },
                maxWidth: { xs: 420, md: 'none' },
                height: { xs: 220, md: 290 },
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                flexShrink: 0,
                opacity: 0.8
              }}
            />

            {/* RIGHT WELCOME CONTENT */}

            <Stack
              spacing={2}
              alignItems="center"
              textAlign="center"
              sx={{
                flex: 1,
                position: 'relative',
                zIndex: 1,
                py: { xs: 1, md: 2 }
              }}
            >

              <Typography
                sx={{
                  fontWeight: 800,
                  color: '#211C50',
                  fontSize: {
                    xs: 18,
                    sm: 22,
                    lg: 25
                  },
                  letterSpacing: -0.8,
                  lineHeight: 1.35
                }}
              >
                Hello...👋
                <br />
                How can I help you today?
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#5D5983',
                  lineHeight: 1.7,
                  maxWidth: 650,
                  fontSize: { xs: 12, sm: 13 }
                }}
              >
                Discover a smarter way to interact, create, and solve problems
              </Typography>

              {/* SUGGESTIONS */}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.2,
                  pt: 0.8,
                  width: '100%'
                }}
              >
                {suggestions.map((idea) => (
                  <Button
                    key={idea.label}
                    variant="contained"
                    disableElevation
                    startIcon={idea.icon}
                    onClick={() => setQuestion(idea.label)}
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#29234F',
                      border: '1px solid #E7E0FF',
                      borderRadius: 3,
                      px: { xs: 1.3, sm: 2 },
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: { xs: 11, sm: 13 },
                      whiteSpace: 'nowrap',
                      boxShadow:
                        '0 4px 12px rgba(90,65,170,0.08)',

                      '& .MuiButton-startIcon': {
                        color: '#7048ED'
                      },

                      '&:hover': {
                        bgcolor: '#F9F7FF',
                        color: '#6845E7',
                        transform: 'translateY(-2px)'
                      },

                      transition: 'all 0.2s ease'
                    }}
                  >
                    {idea.label}
                  </Button>
                ))}
              </Box>
            </Stack>
          </Box>
        ) : (

          /* CHAT MESSAGES */

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: { xs: 1.5, sm: 3 }
            }}
          >
            {messages.map((message, index) => (
              <Stack
                key={`${message.id || message.role}-${index}`}
                direction="row"
                spacing={1.5}
                sx={{
                  mb: 3,
                  alignItems: 'flex-start'
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor:
                      message.role === 'assistant'
                        ? '#7049EA'
                        : '#EFEDFF',
                    color:
                      message.role === 'assistant'
                        ? '#FFFFFF'
                        : '#7049EA'
                  }}
                >
                  {message.role === 'assistant'
                    ? <AutoAwesomeRounded fontSize="small" />
                    : 'Y'}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                  >
                    {message.role === 'assistant'
                      ? 'Knowledge Assistant'
                      : 'You'}
                  </Typography>

                  {message.pending ? (
                    <CircularProgress
                      size={18}
                      sx={{ display: 'block', mt: 1 }}
                    />
                  ) : (
                    <>
                      <Typography
                        variant="body2"
                        onMouseUp={showAskMeForSelection}
                        onTouchEnd={showAskMeForSelection}
                        sx={{
                          mt: 0.75,
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.8,
                          color: '#42405B'
                        }}
                      >
                        {message.content}
                      </Typography>

                      {message.role === 'assistant' && (
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ mt: 1, alignItems: 'center' }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => copyAnswer(message.content, index)}
                            aria-label="Copy answer"
                            title="Copy answer"
                            sx={{
                              color: '#7049EA',
                              bgcolor: '#F4F1FF',
                              '&:hover': { bgcolor: '#EBE5FF' }
                            }}
                          >
                            {copiedMessageIndex === index
                              ? <CheckRounded fontSize="small" />
                              : <ContentCopyRounded fontSize="small" />}
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() => downloadAnswer(message.content)}
                            aria-label="Download answer as PDF"
                            title="Download as PDF"
                            sx={{
                              color: '#7049EA',
                              bgcolor: '#F4F1FF',
                              '&:hover': { bgcolor: '#EBE5FF' }
                            }}
                          >
                            <DownloadRounded fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </>
                  )}
                </Box>
              </Stack>
            ))}

            <div ref={bottomRef} />
          </Box>
        )}

        {/* BOTTOM INPUT AREA */}

        <Box
          component="form"
          onSubmit={sendQuestion}
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            borderTop: '1px solid #EFEDF5',
            bgcolor: '#FCFBFF'
          }}
        >

          <TextField
            fullWidth
            multiline
            maxRows={5}
            inputRef={questionRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask anything ..."
            aria-label="Ask a question"

            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#FFFFFF',
                borderRadius: 5,
                px: 1.2,
                py: 1,
                fontSize: 15,
                boxShadow:
                  '0 4px 16px rgba(80,60,150,0.05)',

                '& fieldset': {
                  borderColor: '#E5DFFA'
                },

                '&:hover fieldset': {
                  borderColor: '#A895F1'
                },

                '&.Mui-focused fieldset': {
                  borderColor: '#7954ED',
                  borderWidth: 1.5
                }
              }
            }}

            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      size="small"
                      disabled
                      aria-label="Attachment"
                      sx={{
                        bgcolor: '#F1EEFF',
                        color: '#7655E9',
                        width: 38,
                        height: 38
                      }}
                    >
                      <AttachFileRounded />
                    </IconButton>
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      disabled={!question.trim() || sending}
                      aria-label="Send question"
                      sx={{
                        bgcolor: '#7049ED',
                        color: '#FFFFFF',
                        width: 42,
                        height: 42,
                        borderRadius: 3,

                        '&:hover': {
                          bgcolor: '#5732D5'
                        },

                        '&.Mui-disabled': {
                          bgcolor: '#EAE5FA',
                          color: '#A99DD5'
                        }
                      }}
                    >
                      {sending ? (
                        <CircularProgress
                          size={20}
                          sx={{ color: '#FFFFFF' }}
                        />
                      ) : (
                        <ArrowUpwardRounded />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          {/* DISCLAIMER */}

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.8}
            sx={{ mt: 1.2, ml: 0.5 }}
          >
            <ShieldOutlined
              sx={{
                fontSize: 18,
                color: '#7955ED'
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Enjoy smart assistance and helpful insights with AI
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {textSelection && (
        <Button
          variant="contained"
          size="small"
          onMouseDown={(event) => event.preventDefault()}
          onClick={askAboutSelectedText}
          sx={{
            position: 'fixed',
            left: textSelection.x,
            top: textSelection.y,
            zIndex: 1400,
            minWidth: 84,
            height: 36,
            borderRadius: 3,
            bgcolor: '#7049EA',
            textTransform: 'none',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(69,48,140,0.24)',
            '&:hover': { bgcolor: '#5732D5' }
          }}
        >
          Ask me
        </Button>
      )}
    </Box>
  );
}
