import { useEffect, useState } from 'react';
import {
  ArrowForwardRounded,
  AutoAwesomeRounded,
  CheckCircleOutlineRounded,
  DescriptionOutlined,
  ForumOutlined,
  QuestionAnswerOutlined,
  AccessTimeRounded,
  FolderOpenRounded,
  TrendingUpRounded,
  MoreVertRounded
} from '@mui/icons-material';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography
} from '@mui/material';

import { api } from '../services/api.js';
import heroImage from '../assets/Dashboard.png';
import { EmptyState, ErrorMessage, formatDate } from './shared.jsx';

// Dashboard statistics
const metrics = [
  {
    key: 'totalDocuments',
    label: 'Total Documents',
    icon: DescriptionOutlined,
    color: '#7655E9',
    background: '#F0EBFF',
    graph: 'M0 38 C14 34, 24 16, 40 22 S61 42, 76 25 S95 14, 108 11 S116 7, 120 3'
  },
  {
    key: 'totalQuestions',
    label: 'Questions Asked',
    icon: QuestionAnswerOutlined,
    color: '#2996DC',
    background: '#E7F4FF',
    graph: 'M0 35 C15 40, 25 15, 40 25 S65 40, 80 10 S105 30, 120 5'
  },
  {
    key: 'totalAnswers',
    label: 'AI Answers',
    icon: AutoAwesomeRounded,
    color: '#E99B42',
    background: '#FFF4E6',
    graph: 'M0 35 C20 10, 25 38, 45 25 S65 35, 80 10 S105 25, 120 5'
  },
  {
    key: 'readyDocuments',
    label: 'Ready to Search',
    icon: CheckCircleOutlineRounded,
    color: '#35AC7B',
    background: '#E7F8F0',
    graph: 'M0 35 C15 30, 25 40, 40 22 S65 35, 80 12 S105 25, 120 5'
  }
];

const cardStyle = {
  border: '1px solid #EAE7F8',
  borderRadius: '18px',
  background: '#FFFFFF',
  boxShadow: '0 4px 18px rgba(91, 71, 170, 0.045)',
  transition: 'all 0.25s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 28px rgba(91, 71, 170, 0.10)',
    borderColor: '#D9D0FF'
  }
};

// Mini decorative chart
function Sparkline({ color, graph }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 120 45"
      preserveAspectRatio="none"
      sx={{
        width: 112,
        height: 45,
        opacity: 0.8,
        overflow: 'visible'
      }}
    >
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${graph} L120 45 L0 45 Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      <path
        d={graph}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Box>
  );
}

export default function Dashboard({ profileName, onChat, onPage }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((reason) => setError(reason.message));
  }, []);

  return (
    <Box
      sx={{
        pt: { xs: 1, sm: 2 },
        px: { xs: 0.5, sm: 1 },
        pb: 4,
        fontFamily: 'Gadugi, "Segoe UI", sans-serif',
        '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root': {
          fontFamily: 'Gadugi, "Segoe UI", sans-serif !important'
        }
      }}
    >

      <ErrorMessage message={error} />

      {/* HERO BANNER */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          overflow: 'hidden',
          borderRadius: '22px',
          background: 'linear-gradient(110deg, #EDE4FF 0%, #E8E7FF 50%, #DCEBFF 100%)',
          border: '1px solid #E6DFFF',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            right: '25%',
            top: '-180px'
          }
        }}
      >
        <CardContent
          sx={{
            minHeight: { xs: 215, md: 225 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            p: { xs: 3, md: 4 },
            '&:last-child': { pb: { xs: 3, md: 4 } }
          }}
        >
          <Box sx={{ maxWidth: 560, zIndex: 1 }}>
            <Chip
              icon={<AutoAwesomeRounded sx={{ fontSize: '16px !important' }} />}
              label="Welcome to Brainora AI!"
              size="small"
              sx={{
                mb: 1.5,
                height: 32,
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.65)',
                color: '#6747D7',
                fontWeight: 700,
                '& .MuiChip-icon': { color: '#7655E9' }
              }}
            />
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                fontFamily: 'Gadugi, "Segoe UI", sans-serif !important',
                color: '#292354',
                fontSize: { xs: 26, sm: 34, md: 39 },
                lineHeight: 1.2,
                letterSpacing: '-1px'
              }}
            >
              Good to see you,{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #B517F2 0%, #2855F5 55%, #08B9F4 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {profileName || 'there'}!
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 1.5,
                color: '#69658E',
                maxWidth: 440,
                fontSize: 14.5,
                lineHeight: 1.7
              }}
            >
              Here's what's happening across your knowledge base today.
            </Typography>

            <Button
              variant="contained"
              startIcon={<ForumOutlined />}
              onClick={() => onChat()}
              sx={{
                mt: 2.5,
                px: 3,
                py: 1.25,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(100deg, #7048E8, #536EEB)',
                boxShadow: '0 7px 18px rgba(112,72,232,0.25)',
                '&:hover': {
                  background: 'linear-gradient(100deg, #6039D8, #425DDA)',
                  boxShadow: '0 10px 22px rgba(112,72,232,0.32)'
                }
              }}
            >
              Ask a question
            </Button>
          </Box>

          <Box
            component="img"
            src={heroImage}
            alt="Brainora AI dashboard illustration"
            sx={{
              width: { sm: 430, md: 560, lg: 560 },
              maxHeight: 390,
              objectFit: 'contain',
              mr: { md: 3 },
              display: { xs: 'none', sm: 'block' },
              opacity: 0.65,
              filter: 'drop-shadow(0 12px 20px rgba(104,77,211,0.12))',
              animation: 'brainFloatRotate 5s ease-in-out infinite',
              '@keyframes brainFloatRotate': {
                '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
                '50%': { transform: 'translateY(-8px) rotate(2deg)' }
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* STATISTICS CARDS */}
      <Box
        sx={{
          maxWidth: { lg: 1200 },
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))'
          },
          gap: { xs: 1.5, md: 2 },
          mb: 3
        }}
      >
        {metrics.map(({ key, label, icon: Icon, color, background, graph }) => (
          <Card key={key} sx={cardStyle}>
            <CardContent
              sx={{
                minHeight: { sm: 160 },
                p: { xs: 2, md: 2.5 },
                '&:last-child': { pb: 2.5 }
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '15px',
                    display: 'grid',
                    placeItems: 'center',
                    color,
                    background,
                    boxShadow: `0 5px 12px ${color}12`
                  }}
                >
                  <Icon sx={{ fontSize: 24 }} />
                </Box>

                <Chip
                  size="small"
                  icon={<TrendingUpRounded sx={{ fontSize: '14px !important' }} />}
                  label="Active"
                  sx={{
                    height: 23,
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#F0FAF5',
                    color: '#35A477',
                    '& .MuiChip-icon': { color: '#35A477' }
                  }}
                />
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 112px' },
                  alignItems: 'center',
                  mt: 1
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ color: '#29244F', fontSize: 30 }}
                  >
                    {data?.stats?.[key] ?? '—'}
                  </Typography>

                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: '#514B70', mt: 0.3 }}
                  >
                    {label}
                  </Typography>

                </Box>

                <Box sx={{ display: { xs: 'none', sm: 'grid' }, placeItems: 'center' }}>
                  <Sparkline color={color} graph={graph} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* RECENT DOCUMENTS AND CONVERSATIONS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2
        }}
      >

        {/* RECENT DOCUMENTS */}
        <Card sx={{ ...cardStyle, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center">
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    background: '#F0EBFF',
                    color: '#7655E9'
                  }}
                >
                  <AccessTimeRounded fontSize="small" />
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'Gadugi, "Segoe UI", sans-serif !important',
                      fontWeight: 900,
                      fontSize: 17,
                      color: '#29244F'
                    }}
                  >
                    Recent Documents
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>

          {data?.recentDocuments?.length ? (
            data.recentDocuments.map((document) => (
              <CardActionArea
                key={document.id}
                onClick={() => onPage('documents')}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderTop: '1px solid #F1EFF8',
                  '&:hover': { background: '#FAF8FF' }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      background: '#F0EBFF',
                      color: '#7655E9'
                    }}
                  >
                    <DescriptionOutlined />
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={900}
                      fontSize={14.5}
                      color="#393354"
                      noWrap
                    >
                      {document.title}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <AccessTimeRounded sx={{ fontSize: 13, color: '#9993B1' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(document.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>

                  <Chip
                    size="small"
                    label={document.status}
                    color={document.status === 'ready' ? 'success' : 'default'}
                    sx={{
                      fontWeight: 700,
                      fontSize: 10,
                      borderRadius: 2
                    }}
                  />

                  <IconButton size="small" sx={{ color: '#9993B1' }}>
                    <MoreVertRounded fontSize="small" />
                  </IconButton>
                </Stack>
              </CardActionArea>
            ))
          ) : (
            <EmptyState
              icon={FolderOpenRounded}
              title="No documents yet"
              text="Upload your first document to get started."
              action="Go to documents"
              onAction={() => onPage('documents')}
            />
          )}

          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
            <Button
              size="small"
              endIcon={<ArrowForwardRounded />}
              onClick={() => onPage('documents')}
              sx={{ textTransform: 'none', color: '#7655E9', fontWeight: 700 }}
            >
              View all
            </Button>
          </Box>
        </Card>

        {/* RECENT CONVERSATIONS */}
        <Card sx={{ ...cardStyle, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center">
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    background: '#E8F4FF',
                    color: '#2996DC'
                  }}
                >
                  <ForumOutlined fontSize="small" />
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'Gadugi, "Segoe UI", sans-serif !important',
                      fontWeight: 900,
                      fontSize: 17,
                      color: '#29244F'
                    }}
                  >
                    Recent Conversations
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>

          {data?.recentChats?.length ? (
            data.recentChats.map((chat) => (
              <CardActionArea
                key={chat.id}
                onClick={() => onChat(chat.id)}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderTop: '1px solid #F1EFF8',
                  '&:hover': { background: '#F8FAFF' }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      background: '#E8F4FF',
                      color: '#2996DC'
                    }}
                  >
                    <ForumOutlined />
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={900}
                      fontSize={14.5}
                      color="#393354"
                      noWrap
                    >
                      {chat.title}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <AccessTimeRounded sx={{ fontSize: 13, color: '#9993B1' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(chat.updatedAt)}
                      </Typography>
                    </Stack>
                  </Box>

                  <ArrowForwardRounded sx={{ color: '#8982AC' }} />
                </Stack>
              </CardActionArea>
            ))
          ) : (
            <EmptyState
              icon={ForumOutlined}
              title="No conversations yet"
              text="Ask a question to start a conversation."
              action="Start a chat"
              onAction={() => onChat()}
            />
          )}

          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
            <Button
              size="small"
              endIcon={<ArrowForwardRounded />}
              onClick={() => onPage('history')}
              sx={{ textTransform: 'none', color: '#7655E9', fontWeight: 700 }}
            >
              View all
            </Button>
          </Box>
        </Card>
      </Box>

    </Box>
  );
}
