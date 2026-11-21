import { useEffect, useMemo, useState } from 'react';
import {
  AccessTimeRounded,
  ArrowForwardRounded,
  DeleteOutlineRounded,
  ForumOutlined,
  SearchRounded,
  CalendarTodayOutlined,
  FolderRounded,
  SmartToyOutlined,
  OpenInNewRounded,
  KeyboardArrowLeftRounded,
  KeyboardArrowRightRounded
} from '@mui/icons-material';

import {
  Avatar,
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  List,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Select,
  MenuItem
} from '@mui/material';

import { api } from '../services/api.js';
import { EmptyState, ErrorMessage, formatDate } from './shared.jsx';
import pastImage from '../assets/pastchat.png';
import chatHistoryImage from '../assets/chathistory.png';

export default function ChatHistory({ onOpenChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);

  const chatsPerPage = 5;

  useEffect(() => {
    api('/chats')
      .then(({ chats: results }) => setChats(results))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredChats = useMemo(() => {
    return [...chats]
      .filter((chat) =>
        chat.title.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();

        return sortOrder === 'newest'
          ? dateB - dateA
          : dateA - dateB;
      });
  }, [chats, search, sortOrder]);

  const totalPages = Math.ceil(filteredChats.length / chatsPerPage);

  const paginatedChats = filteredChats.slice(
    (page - 1) * chatsPerPage,
    page * chatsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortOrder]);

  async function deleteChat(id) {
    setError('');

    try {
      await api(`/chats/${id}`, { method: 'DELETE' });

      setChats((current) =>
        current.filter((chat) => chat.id !== id)
      );
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <Box sx={{ width: '100%', pb: 3 }}>

      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 0.5 }}
      >
      </Stack>

      <ErrorMessage message={error} />

      {/* Hero Banner */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 150,
          borderRadius: '20px',
          mb: 3,
          px: { xs: 3, md: 4 },
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(110deg, #edf2ff 0%, #eeeaff 55%, #e5e6ff 100%)',
          border: '1px solid #e9e5ff'
        }}
      >
        {/* Banner Text */}
        <Box sx={{ flex: 1, px: { xs: 0, sm: 2 }, zIndex: 1 }}>
          <Typography
            sx={{
              fontSize: 24.5,
              fontWeight: 800,
              color: '#11194f',
              mb: 0.6
            }}
          >
            Recent Activity
          </Typography>

          <Typography
            sx={{
              color: '#26366e',
              fontSize: 14,
              lineHeight: 1.8
            }}
          >
            Your Conversations, Seamlessly Organized.
          </Typography>
        </Box>

        {/* Chat History Illustration */}
        <Box
          component="img"
          src={chatHistoryImage}
          alt=""
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: 340,
            height: 130,
            objectFit: 'contain',
            flexShrink: 0,
            pr: 1,
            opacity: 0.72
          }}
        />

        {/* Background Decoration */}
        <Box
          sx={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(139, 108, 255, 0.08)',
            right: -70,
            bottom: -135
          }}
        />
      </Box>

      {/* Conversations Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '22px',
          p: { xs: 1.5, md: 2.5 },
          border: '1px solid #eeebff',
          background: '#fff',
          boxShadow: '0 8px 25px rgba(90,70,180,0.06)'
        }}
      >

        {/* Section Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.3}>
            <ForumOutlined
              sx={{
                fontSize: 27,
                color: '#7045ff'
              }}
            />

            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 800,
                color: '#11194f'
              }}
            >
              Conversations
            </Typography>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            spacing={1}
            sx={{ ml: 'auto' }}
          >
            <TextField
              size="small"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: { xs: 150, sm: 220 },
                '& .MuiOutlinedInput-root': {
                  height: 38,
                  borderRadius: '20px',
                  background: '#fff',
                  fontSize: 12,
                  '& fieldset': {
                    borderColor: '#e8e5ff'
                  },
                  '&:hover fieldset': {
                    borderColor: '#9474ff'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ fontSize: 18, color: '#7045ff' }} />
                  </InputAdornment>
                )
              }}
            />

            <Select
              size="small"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{
                minWidth: 125,
                height: 38,
                borderRadius: '20px',
                fontSize: 12,
                background: '#fafaff',
                '& fieldset': {
                  borderColor: '#eeebff'
                }
              }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </Select>
          </Stack>
        </Stack>

        {/* Chat List */}
        {loading ? (
          <Typography
            sx={{
              textAlign: 'center',
              py: 5,
              color: '#7882a5'
            }}
          >
            Loading conversations...
          </Typography>
        ) : paginatedChats.length > 0 ? (

          <List disablePadding>
            {paginatedChats.map((chat, index) => {

              const preview =
                typeof chat.preview === 'string'
                  ? chat.preview
                  : typeof chat.lastMessage === 'string'
                    ? chat.lastMessage
                    : '';

              return (
                <Card
                  key={chat.id}
                  elevation={0}
                  sx={{
                    mb: 1.1,
                    borderRadius: '17px',
                    border: '1px solid #eeecfa',
                    background: '#fff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#c8baff',
                      background: '#fdfcff',
                      boxShadow:
                        '0 5px 16px rgba(110,80,220,0.08)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={{ xs: 1, sm: 2 }}
                    sx={{
                      px: { xs: 1.2, sm: 1.7 },
                      py: 1.3
                    }}
                  >

                    {/* Chat Avatar */}
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        bgcolor:
                          index % 3 === 0
                            ? '#eee8ff'
                            : index % 3 === 1
                              ? '#e2f5f3'
                              : '#e5efff',
                        color:
                          index % 3 === 0
                            ? '#7045ff'
                            : index % 3 === 1
                              ? '#0ca79e'
                              : '#2785ed'
                      }}
                    >
                      <ForumOutlined />
                    </Avatar>

                    {/* Chat Information */}
                    <Box
                      onClick={() => onOpenChat(chat.id)}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: '#11194f',
                          mb: 0.4
                        }}
                        noWrap
                      >
                        {chat.title}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.6}
                      >
                        <CalendarTodayOutlined
                          sx={{
                            fontSize: 13,
                            color: '#7882a5'
                          }}
                        />

                        <Typography
                          variant="caption"
                          sx={{ color: '#68749b' }}
                        >
                          {formatDate(chat.updatedAt)}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Chat Preview */}
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'block' },
                        maxWidth: 240,
                        width: '25%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        px: 1.5,
                        py: 0.9
                      }}
                    >
                    </Box>

                    {/* Open Chat */}
                    <Tooltip title="Open conversation">
                      <IconButton
                        aria-label={`Open ${chat.title}`}
                        onClick={() => onOpenChat(chat.id)}
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: '#f0efff',
                          color: '#4632d9',
                          '&:hover': {
                            bgcolor: '#e2dcff'
                          }
                        }}
                      >
                        <OpenInNewRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Delete Chat */}
                    <Tooltip title="Delete conversation">
                      <IconButton
                        aria-label={`Delete ${chat.title}`}
                        onClick={() => deleteChat(chat.id)}
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: '#ffedf2',
                          color: '#f04458',
                          '&:hover': {
                            bgcolor: '#ffdae4'
                          }
                        }}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>

                  </Stack>
                </Card>
              );
            })}
          </List>

        ) : (
          <EmptyState
            icon={ForumOutlined}
            title={
              search
                ? 'No matching conversations'
                : 'No chat history yet'
            }
            text={
              search
                ? 'Try another search keyword.'
                : 'Start a conversation and it will appear here.'
            }
          />
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{ mt: 2 }}
          >
            <IconButton
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              sx={{
                bgcolor: '#f5f3ff',
                color: '#7045ff',
                '&:hover': { bgcolor: '#eae5ff' }
              }}
            >
              <KeyboardArrowLeftRounded />
            </IconButton>

            <Button
              sx={{
                minWidth: 35,
                height: 35,
                borderRadius: '50%',
                bgcolor: '#8050ed',
                color: '#fff',
                '&:hover': { bgcolor: '#6840d5' }
              }}
            >
              {page}
            </Button>

            <IconButton
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              sx={{
                bgcolor: '#f5f3ff',
                color: '#7045ff',
                '&:hover': { bgcolor: '#eae5ff' }
              }}
            >
              <KeyboardArrowRightRounded />
            </IconButton>
          </Stack>
        )}

      </Card>
    </Box>
  );
}
