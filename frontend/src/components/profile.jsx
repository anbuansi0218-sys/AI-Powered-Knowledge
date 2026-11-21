
import { useEffect, useState } from 'react';

import {
  AccountCircleOutlined,
  LogoutRounded,
  SettingsOutlined,
  PersonRounded,
  EditRounded,
  SaveRounded,
  ArrowForwardRounded
} from '@mui/icons-material';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';

import { api, jsonOptions } from '../services/api.js';
import { ErrorMessage, getInitials } from './shared.jsx';

// PROFILE BANNER IMAGE
import profileImage from '../assets/profile.png';

// PROFILE MENU

export function ProfileMenu({
  profileName,
  onProfile,
  onSettings,
  onLogout
}) {
  const [anchor, setAnchor] = useState(null);

  const close = () => setAnchor(null);

  return (
    <>
      <Button
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label="Open profile menu"
        aria-haspopup="menu"
        color="inherit"
        sx={{ minWidth: 0, p: 0.5 }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#eee7ff',
            color: '#6938e8',
            fontSize: 15,
            fontWeight: 800
          }}
        >
          {getInitials(profileName)}
        </Avatar>
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
      >
        <MenuItem onClick={() => {
          close();
          onProfile();
        }}>
          <AccountCircleOutlined fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>

        <MenuItem onClick={() => {
          close();
          onSettings();
        }}>
          <SettingsOutlined fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            close();
            onLogout();
          }}
          sx={{ color: 'error.main' }}
        >
          <LogoutRounded fontSize="small" sx={{ mr: 1 }} />
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}

// PROFILE PAGE

export default function Profile({ profileName, onSaved }) {
  const [name, setName] = useState(profileName);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/settings')
      .then(({ settings: result }) => {
        setSettings(result);
        setName(result.profileName);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(event) {
    event.preventDefault();

    if (!settings) return;

    setSaving(true);
    setError('');

    try {
      const updatedName = name.trim();

      await api(
        '/settings',
        jsonOptions('PUT', {
          ...settings,
          profileName: updatedName
        })
      );

      setName(updatedName);
      onSaved(updatedName);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1250,
        mx: 'auto',
        pb: 4
      }}
    >
      {/* PROFILE HERO BANNER */}

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 160, md: 175 },
          borderRadius: '20px',
          mb: 3,
          px: { xs: 3, md: 4 },
          py: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'center',
          background:
            'linear-gradient(110deg, #f3eaff 0%, #e8d9ff 42%, #8061ef 100%)',
          boxShadow: '0 6px 20px rgba(107, 65, 220, 0.10)'
        }}
      >
        {/* PROFILE HEADING */}

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 650
          }}
        >
          <Typography
            sx={{
              color: '#8952e9',
              fontWeight: 700,
              fontSize: { xs: 14, md: 13 },
              mb: 0.2
            }}
          >
            Your Account
          </Typography>

          <Typography
            sx={{
              fontWeight: 620,
              fontSize: { xs: 34, md: 37.5 },
              lineHeight: 1.1,
              color: '#11164d',
              letterSpacing: '-1.5px'
            }}
          >
            Profile
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              color: '#25264e',
              fontSize: { xs: 12, md: 15 }
            }}
          >
           Update your profile information and personalize your workspace.
          </Typography>

          <Box
            sx={{
              width: 90,
              height: 4,
              borderRadius: 5,
              mt: 1.5,
              background:
                'linear-gradient(90deg, #a020f0, #6840e8, transparent)'
            }}
          />
        </Box>

        {/* DECORATIVE BACKGROUND */}

        <Box
          sx={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            right: { xs: -180, md: 50 },
            top: -100,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%)'
          }}
        />

        {/* PROFILE AI IMAGE */}

        <Box
          component="img"
          src={profileImage}
          alt="Profile AI illustration"
          sx={{
            position: 'absolute',
            zIndex: 1,
            right: { xs: 10, sm: 25, md: 45 },
            bottom: 0,
            width: {
              xs: 165,
              sm: 200,
              md: 500
            },
            height: {
              xs: 200,
              sm: 250,
              md: 185
            },
            objectFit: 'contain',
            objectPosition: 'bottom',
            pointerEvents: 'none'
          }}
        />

        {/* DECORATIVE STARS */}

        <Box
          sx={{
            position: 'absolute',
            right: { xs: 20, md: 55 },
            top: 20,
            display: { xs: 'none', sm: 'flex' },
            gap: 2,
            alignItems: 'center',
            color: '#ffffff',
            opacity: 0.8,
            zIndex: 2,
            pointerEvents: 'none'
          }}
        >
          <Typography sx={{ fontSize: 28 }}>✦</Typography>
          <Typography sx={{ fontSize: 20 }}>✧</Typography>
          <Typography sx={{ fontSize: 35 }}>✦</Typography>
        </Box>
      </Box>

      <ErrorMessage message={error} />

      {/* PROFILE CARD */}

      <Card
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '18px',
          border: '1px solid #ece8fa',
          background: '#ffffff',
          boxShadow: '0 6px 20px rgba(62, 43, 126, 0.08)'
        }}
      >
        {/* BOTTOM DECORATION */}

        <Box
          sx={{
            position: 'absolute',
            right: -50,
            bottom: -110,
            width: 300,
            height: 220,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(192,151,255,0.08), rgba(126,78,238,0.15))',
            pointerEvents: 'none'
          }}
        />

        <CardContent
          sx={{
            position: 'relative',
            zIndex: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            '&:last-child': {
              pb: { xs: 2, md: 3.5 }
            }
          }}
        >
          {/* USER INFORMATION */}

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 2.5 }}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: { xs: 58, md: 76 },
                  height: { xs: 58, md: 76 },
                  bgcolor: '#e9ddff',
                  color: '#24145f',
                  fontSize: { xs: 25, md: 34 },
                  fontWeight: 800,
                  border: '2px solid #f4edff'
                }}
              >
                {getInitials(name)}
              </Avatar>

              <Box
                sx={{
                  position: 'absolute',
                  right: -3,
                  bottom: 0,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  color: '#5624c9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}
              >
                <EditRounded sx={{ fontSize: 15 }} />
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 18, md: 25 },
                  fontWeight: 750,
                  color: '#11164d',
                  lineHeight: 1.3
                }}
              >
                {name || 'Your profile'}
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.7}
                sx={{ mt: 0.5 }}
              >
                <PersonRounded
                  sx={{
                    color: '#8135e9',
                    fontSize: 19
                  }}
                />

                <Typography
                  sx={{
                    color: '#39345f',
                    fontSize: { xs: 12, md: 15 }
                  }}
                >
                  Personal workspace
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Divider
            sx={{
              borderColor: '#ece8f5',
              mb: 2.5
            }}
          />

          {/* PROFILE FORM */}

          <Box component="form" onSubmit={save}>
            <Typography
              sx={{
                color: '#702ce0',
                fontSize: 13,
                fontWeight: 750,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.7
              }}
            >
              <PersonRounded sx={{ fontSize: 18 }} />
              Display name *
            </Typography>

            <TextField
              fullWidth
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your display name"
              required
              disabled={loading || saving}
              slotProps={{
                htmlInput: { maxLength: 120 }
              }}
              sx={{
                maxWidth: 710,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  fontSize: 15,
                  '& fieldset': {
                    borderColor: '#ddd5f5',
                    borderWidth: 1.5
                  },
                  '&:hover fieldset': {
                    borderColor: '#9362ed'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7435e6',
                    borderWidth: 2
                  }
                },
                '& .MuiOutlinedInput-input': {
                  padding: '12px 17px'
                }
              }}
            />

            {/* SAVE PROFILE BUTTON */}

            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  loading ||
                  saving ||
                  !name.trim()
                }
                startIcon={
                  !saving && <SaveRounded sx={{ fontSize: 18 }} />
                }
                endIcon={
                  saving
                    ? <CircularProgress size={15} color="inherit" />
                    : <ArrowForwardRounded sx={{ fontSize: 17 }} />
                }
                sx={{
                  px: 2.5,
                  py: 1,
                  minHeight: 42,
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#ffffff',
                  background:
                    'linear-gradient(100deg, #a020f0 0%, #4822dc 100%)',
                  boxShadow:
                    '0 4px 12px rgba(111, 42, 220, 0.20)',
                  '&:hover': {
                    background:
                      'linear-gradient(100deg, #8516df 0%, #3716c0 100%)',
                    boxShadow:
                      '0 6px 15px rgba(111, 42, 220, 0.30)'
                  },
                  '&:disabled': {
                    color: '#ffffff',
                    opacity: 0.6
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
