import { useEffect, useMemo, useState } from 'react';
import {
  DeleteOutlineRounded,
  SearchRounded,
  UploadRounded,
  AutoAwesomeRounded,
  PictureAsPdfRounded,
  TextSnippetRounded,
  InsertDriveFileRounded,
  CheckCircleRounded,
  InfoOutlined,
  CalendarMonthRounded,
  StorageRounded
} from '@mui/icons-material';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import { api } from '../services/api.js';
import heroImage from '../assets/Documents.png';

import {
  EmptyState,
  ErrorMessage,
  formatBytes,
  formatDate
} from './shared.jsx';

// Document type helper
function getFileType(document) {
  const name = `${document.originalName || ''} ${document.title || ''}`.toLowerCase();

  if (name.includes('.pdf')) return 'pdf';
  if (name.includes('.txt')) return 'txt';

  return 'other';
}

// File icon helper
function getFileIcon(document) {
  const type = getFileType(document);

  if (type === 'pdf') return PictureAsPdfRounded;
  if (type === 'txt') return TextSnippetRounded;

  return InsertDriveFileRounded;
}

const cardStyle = {
  border: '1px solid #E9E5F6',
  borderRadius: '18px',
  background: '#FFFFFF',
  boxShadow: '0 5px 22px rgba(91, 71, 170, 0.045)',
  overflow: 'hidden'
};

export default function Documents({ notify }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch documents
  useEffect(() => {
    api('/documents')
      .then(({ documents: results }) => setDocuments(results))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  // Upload document
  async function uploadFile(event) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const body = new FormData();
      body.append('file', file);

      await api('/documents/upload', {
        method: 'POST',
        body
      });

      const { documents: results } = await api('/documents');

      setDocuments(results);

      notify(`${file.name} is indexed and ready.`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setUploading(false);
    }
  }

  // Delete document
  async function deleteDocument(document) {
    setDeletingId(document.id);
    setError('');

    try {
      await api(`/documents/${document.id}`, {
        method: 'DELETE'
      });

      setDocuments((current) =>
        current.filter((item) => item.id !== document.id)
      );

      notify('Document deleted.');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Search documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      return `${document.title} ${document.originalName}`
        .toLowerCase()
        .includes(query.toLowerCase());
    });
  }, [documents, query]);

  return (
    <Box sx={{ pb: 4 }}>

      <ErrorMessage message={error} />

      {/* UPLOAD PROGRESS */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="#7655E9"
            sx={{ mb: 0.7, display: 'block' }}
          >
            Uploading and indexing your document...
          </Typography>

          <LinearProgress
            sx={{
              height: 5,
              borderRadius: 5,
              background: '#EAE4FF',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #7655E9, #4388EF)'
              }
            }}
          />
        </Box>
      )}

      {/* HERO BANNER */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '21px',
          border: '1px solid #DFD7FF',
          background: 'linear-gradient(110deg, #E9DEFF 0%, #E8E8FF 48%, #DCEBFF 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.5)',
            right: -70,
            top: -130
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.17)',
            right: '25%',
            bottom: -145
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            minHeight: 170,
            p: { xs: 1.5, sm: 1, md: 0.75 },
            pr: { xs: 1.5, sm: 0, md: 0 },
            position: 'relative'
          }}
        >
          {/* Hero text */}
          <Box sx={{ maxWidth: 580, zIndex: 1, transform: 'translate(40px, 26px)' }}>

            <Chip
              icon={<AutoAwesomeRounded />}
              label="Your library"
              size="small"
              sx={{
                mb: 1,
                background: 'rgba(255,255,255,0.7)',
                color: '#6947D7',
                fontWeight: 800,
                letterSpacing: 0.3,
                '& .MuiChip-icon': { color: '#7655E9' }
              }}
            />

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                color: '#282254',
                fontSize: { xs: 24, sm: 30, md: 33 },
                lineHeight: 1.2,
                letterSpacing: '-1px'
              }}
            >
              Documents
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: '#625D87',
                maxWidth: 460,
                lineHeight: 1.6,
                fontSize: 14
              }}
            >
              Manage the files you'll use to find grounded answers.
            </Typography>

            {/* Supported format information */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                mt: 1.5,
                p: 0.8,
                px: 1.5,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.58)',
                width: 'fit-content',
                maxWidth: '100%'
              }}
            >
              <InfoOutlined
                sx={{ color: '#536EEB', fontSize: 19 }}
              />

              <Typography
                variant="caption"
                sx={{
                  color: '#49446F',
                  fontWeight: 600,
                  lineHeight: 1.5
                }}
              >
                PDF and TXT files up to 15 MB are supported.
              </Typography>
            </Stack>
          </Box>

          <Box
            component="img"
            src={heroImage}
            alt="Documents ready to upload"
            sx={{
              width: { sm: 320, md: 450, lg: 520 },
              height: { sm: 160, md: 210, lg: 230 },
              objectFit: 'contain',
              display: { xs: 'none', sm: 'block' },
              ml: 'auto',
              mr: 0,
              flexShrink: 0,
              opacity: 0.7
            }}
          />
        </Stack>
      </Card>

      {/* DOCUMENT TABLE */}
      <Card
        elevation={0}
        sx={cardStyle}
      >
        {/* Table heading */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
          sx={{
            p: 2.5,
            flexWrap: 'wrap',
            borderBottom: '1px solid #F0EDF8'
          }}
        >
          <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: '#302951', fontSize: 17 }}
            >
              All Documents

              <Chip
                size="small"
                label={filteredDocuments.length}
                sx={{
                  ml: 1,
                  height: 23,
                  background: '#F0EBFF',
                  color: '#7655E9',
                  fontWeight: 800
                }}
              />
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: '#9690AB' }}
            >
              Documents in your personal knowledge base
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-end', sm: 'center' }}
            justifyContent="flex-end"
            sx={{ width: { xs: '100%', sm: 'auto' }, ml: { sm: 'auto' } }}
          >
            <TextField
              size="small"
              placeholder="Search documents..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              sx={{
                width: { xs: 230, sm: 230 },
                maxWidth: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '13px',
                  background: '#FAF9FE',
                  height: 42,
                  '& fieldset': { borderColor: '#E5DFF5' },
                  '&:hover fieldset': { borderColor: '#B9A8F4' },
                  '&.Mui-focused fieldset': { borderColor: '#7655E9' }
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: '#7655E9' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
            <Button
              component="label"
              variant="contained"
              startIcon={<UploadRounded />}
              disabled={uploading}
              sx={{
                px: 2,
                height: 40,
                minHeight: 40,
                py: 0,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(100deg, #7048E8, #536EEB)',
                '&:hover': { background: 'linear-gradient(100deg, #6039D8, #425DDA)' }
              }}
            >
              {uploading ? 'Indexing...' : 'Upload'}
              <input
                hidden
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={uploadFile}
              />
            </Button>
          </Stack>
        </Stack>

        {/* Loading */}
        {loading ? (
          <LinearProgress
            sx={{
              height: 4,
              background: '#EEE8FF',
              '& .MuiLinearProgress-bar': {
                background: '#7655E9'
              }
            }}
          />
        ) : filteredDocuments.length ? (

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table
              aria-label="Uploaded documents"
              sx={{
                minWidth: 760,
                tableLayout: 'fixed',

                '& .MuiTableCell-head': {
                  color: '#77718F',
                  fontWeight: 800,
                  fontSize: 12,
                  background: '#FAF9FE',
                  borderBottom: '1px solid #F0EDF8',
                  py: 2
                },

                '& .MuiTableCell-body': {
                  borderBottom: '1px solid #F3F0F8',
                  py: 2
                },

                '& .MuiTableRow-root:last-child .MuiTableCell-body': {
                  borderBottom: 0
                }
              }}
            >
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '21%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>DOCUMENT</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell>ADDED</TableCell>
                  <TableCell>SIZE</TableCell>
                  <TableCell align="center">ACTIONS</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredDocuments.map((document) => {
                  const FileIcon = getFileIcon(document);

                  return (
                    <TableRow
                      key={document.id}
                      hover
                      sx={{
                        transition: 'background 0.2s',
                        '&:hover': {
                          background: '#FAF8FF !important'
                        }
                      }}
                    >

                      {/* Document name */}
                      <TableCell sx={{ pl: 3, maxWidth: 380 }}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          sx={{ minWidth: 0 }}
                        >
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 44,
                              height: 48,
                              borderRadius: '11px',
                              background: getFileType(document) === 'pdf'
                                ? '#F0EBFF'
                                : getFileType(document) === 'txt'
                                  ? '#E8F4FF'
                                  : '#F1F1F6',
                              color: getFileType(document) === 'pdf'
                                ? '#7655E9'
                                : getFileType(document) === 'txt'
                                  ? '#2996DC'
                                  : '#77718F'
                            }}
                          >
                            <FileIcon fontSize="medium" />
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              noWrap
                              sx={{ color: '#342E55' }}
                            >
                              {document.title}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              noWrap
                            >
                              {document.originalName}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          size="small"
                          icon={
                            document.status === 'ready'
                              ? <CheckCircleRounded />
                              : undefined
                          }
                          label={
                            document.status === 'ready'
                              ? 'Ready'
                              : document.status
                          }
                          color={
                            document.status === 'ready'
                              ? 'success'
                              : document.status === 'failed'
                                ? 'error'
                                : 'warning'
                          }
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            borderRadius: '8px',
                            '& .MuiChip-icon': {
                              fontSize: 15
                            }
                          }}
                        />
                      </TableCell>

                      {/* Added date */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Stack direction="row" spacing={0.7} alignItems="center">
                          <CalendarMonthRounded
                            sx={{ color: '#9992B0', fontSize: 17 }}
                          />

                          <Typography
                            variant="body2"
                            color="#625D7B"
                            fontSize={12}
                          >
                            {formatDate(document.createdAt)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* File size */}
                      <TableCell>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="flex-start"
                          spacing={0.6}
                        >
                          <StorageRounded
                            sx={{ color: '#9992B0', fontSize: 16 }}
                          />

                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="#625D7B"
                            fontSize={12}
                          >
                            {formatBytes(document.fileSize)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <IconButton
                          aria-label={`Delete ${document.title}`}
                          disabled={deletingId === document.id}
                          onClick={() => deleteDocument(document)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: '#FFF0F1',
                            color: '#E34D5B',
                            '&:hover': {
                              background: '#FFE0E3',
                              color: '#D6293E'
                            },
                            '&.Mui-disabled': {
                              opacity: 0.45
                            }
                          }}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

        ) : (

          <Box sx={{ py: 4 }}>
            <EmptyState
              icon={DescriptionOutlined}
              title={query ? 'No matching documents' : 'Your library is empty'}
              text={
                query
                  ? 'Try another search term.'
                  : 'Upload a PDF or TXT document to build your knowledge base.'
              }
            />
          </Box>
        )}
      </Card>

      {/* BOTTOM INFORMATION */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          mt: 2,
          px: 1,
          color: '#9690AB'
        }}
      >
        <AutoAwesomeRounded sx={{ fontSize: 16, color: '#7655E9' }} />

        <Typography variant="caption">
          Your documents are processed by Brainora AI for intelligent knowledge retrieval.
        </Typography>
      </Stack>

    </Box>
  );
}
