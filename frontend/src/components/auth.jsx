import { useState } from 'react';
import { LockOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { api, jsonOptions, saveAccessToken } from '../services/api.js';
import logo from '../assets/Logo.png';

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const registering = mode === 'register';

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = registering ? '/auth/register' : '/auth/login';
      const body = registering
        ? { userName: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };
      const result = await api(path, jsonOptions('POST', body));
      saveAccessToken(result.token);
      onAuthenticated(result);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Box component="img" src={logo} alt="Brainora AI logo" sx={{ width: 40, height: 40, objectFit: 'contain' }} />
              <Box>
                <Typography variant="h5" letterSpacing={-0.7}>
                  <Box component="span" sx={{ fontWeight: 800 }}>Brainora</Box>{' '}
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(90deg, #B517F2 0%, #2855F5 55%, #08B9F4 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    AI
                  </Box>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {registering ? 'Create your private workspace' : 'Sign in to your workspace'}
                </Typography>
              </Box>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                {registering && (
                  <TextField
                    label="Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    inputProps={{ maxLength: 100 }}
                    autoComplete="name"
                    required
                  />
                )}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  inputProps={{ maxLength: 150 }}
                  autoComplete="email"
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={registering ? 'new-password' : 'current-password'}
                  inputProps={{ minLength: 12, maxLength: 72 }}
                  helperText={registering ? 'Use at least 12 characters.' : undefined}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<LockOutlined />}
                  disabled={loading}
                >
                  {loading ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
                </Button>
              </Stack>
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              {registering ? 'Already have an account?' : 'New to Brainora AI?'}{' '}
              <Button
                size="small"
                onClick={() => {
                  setMode(registering ? 'login' : 'register');
                  setError('');
                }}
              >
                {registering ? 'Sign in' : 'Create account'}
              </Button>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
