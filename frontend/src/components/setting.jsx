
import { useEffect, useState } from 'react';
import {
  AutoAwesomeRounded,
  LockOutlined,
  SettingsRounded,
  TipsAndUpdatesRounded,
  CheckCircleRounded,
  TuneRounded
} from '@mui/icons-material';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography
} from '@mui/material';

import { api, jsonOptions } from '../services/api.js';
import { ErrorMessage } from './shared.jsx';
import settingImage from '../assets/setting.png';

export default function Settings({ onSaved }) {
  const [form, setForm] = useState({
    profileName: '',
    chatModel: 'Qwen/Qwen3-8B:featherless-ai',
    temperature: 0.2
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api('/settings')
      .then(({ settings }) => setForm(settings))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    setSuccess(false);
  }

  async function save(event) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { settings } = await api(
        '/settings',
        jsonOptions('PUT', form)
      );

      setForm(settings);
      setSuccess(true);
      onSaved('AI preferences saved successfully.');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  const tips = [
    'Adjust creativity to get more focused or diverse responses.',
    'Choose the best model for your needs.',
    'Your data stays private and secure.'
  ];

  return (
    <Box sx={{ width: '100%' }}>

      {/* Settings Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 145,
          p: { xs: 2.5, sm: 3 },
          mb: 2,
          borderRadius: 4,
          background:
            'linear-gradient(110deg, #f1edff 0%, #ffffff 55%, #e9e3ff 100%)',
          border: '1px solid #e9e2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            sx={{
              color: '#7651e8',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.5,
              mb: 0.5
            }}
          >
            PREFERENCES
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#201b49',
              mb: 0.5,
              fontSize: { xs: 24, sm: 28 }
            }}
          >
            Settings
          </Typography>

          <Typography
            sx={{
              color: '#55516d',
              fontSize: { xs: 13, sm: 15 }
            }}
          >
            Customize your experience and fine-tune your AI assistant.
          </Typography>
        </Box>

        {/* Settings Illustration */}
        <Box
          component="img"
          src={settingImage}
          alt=""
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'relative',
            width: 550,
            height: 115,
            objectFit: 'contain',
            flexShrink: 0
          }}
        />
      </Box>

      <ErrorMessage message={error} />

      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          Your preferences were saved successfully.
        </Alert>
      )}

      {/* Settings Form */}
      <Box
        component="form"
        onSubmit={save}
        sx={{ display: 'grid', gap: 2 }}
      >
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            borderColor: '#e9e5f7',
            boxShadow: '0 4px 20px rgba(91, 65, 180, 0.04)'
          }}
        >
          <CardContent
            sx={{
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: 3 }
            }}
          >
            {/* Card Heading */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <AutoAwesomeRounded
                sx={{ color: '#7651e8', fontSize: 32 }}
              />

              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 750, color: '#211c46' }}
                >
                  AI Preferences
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Choose the model and response style for your assistant.
                </Typography>
              </Box>
            </Stack>

            {/* Main Content */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'minmax(0, 2fr) minmax(230px, 0.9fr)'
                },
                gap: 3
              }}
            >
              {/* Model and Creativity */}
              <Box>
                <Stack spacing={3}>
                  <FormControl fullWidth size="medium">
                    <InputLabel id="chat-model-label">
                      Chat Model
                    </InputLabel>

                    <Select
                      labelId="chat-model-label"
                      id="chat-model"
                      label="Chat Model"
                      value={form.chatModel}
                      onChange={(event) =>
                        update('chatModel', event.target.value)
                      }
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7954ec'
                        }
                      }}
                    >
                      <MenuItem value="Qwen/Qwen3-8B:featherless-ai">
                        Qwen3 8B - Hugging Face Inference
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* Creativity Slider */}
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography fontWeight={700}>
                        Creativity
                      </Typography>

                      <Typography
                        fontWeight={700}
                        color="#6845e8"
                      >
                        {Number(form.temperature).toFixed(1)}
                      </Typography>
                    </Stack>

                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      value={Number(form.temperature)}
                      onChange={(_event, value) =>
                        update('temperature', value)
                      }
                      valueLabelDisplay="auto"
                      disabled={loading}
                      aria-label="Creativity"
                      sx={{
                        mt: 1,
                        color: '#7954ec',
                        '& .MuiSlider-thumb': {
                          width: 20,
                          height: 20,
                          boxShadow: '0 2px 8px #c4b3ff'
                        },
                        '& .MuiSlider-rail': {
                          opacity: 1,
                          backgroundColor: '#dcd2ff'
                        }
                      }}
                    />

                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        More Focused
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        More Creative
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              {/* Quick Tips */}
              <Box
                sx={{
                  borderLeft: { xs: 'none', md: '1px solid #e8e2f7' },
                  pl: { xs: 0, md: 3 },
                  pt: { xs: 2, md: 0 }
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    p: 2.5,
                    borderRadius: 3,
                    background:
                      'linear-gradient(145deg, #f7f4ff, #eee9ff)',
                    border: '1px solid #eee8ff'
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <TipsAndUpdatesRounded
                      sx={{ color: '#7954ec', fontSize: 27 }}
                    />

                    <Typography fontWeight={800} fontSize={19}>
                      Quick Tips
                    </Typography>
                  </Stack>

                  <Stack spacing={1.5}>
                    {tips.map((tip, index) => (
                      <Stack
                        key={index}
                        direction="row"
                        spacing={1.2}
                        alignItems="flex-start"
                      >
                        <CheckCircleRounded
                          sx={{
                            color: '#8057ed',
                            fontSize: 18,
                            mt: 0.2
                          }}
                        />

                        <Typography
                          variant="body2"
                          sx={{
                            color: '#403b61',
                            lineHeight: 1.5
                          }}
                        >
                          {tip}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>

            {/* Security Information */}
            <Box
              sx={{
                mt: 2.5,
                py: 1,
                px: 1.5,
                minHeight: 54,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: '#eeebff',
                border: '1px solid #e7e0ff'
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  background: '#e0d9ff'
                }}
              >
                <LockOutlined
                  sx={{ color: '#6845e8', fontSize: 22 }}
                />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: '#403b70',
                  lineHeight: 1.5
                }}
              >
                Hugging Face Inference requests are sent securely from the
                backend; your token is never exposed in the browser.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Footer and Save Button */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="flex-start"
          sx={{ mt: 0.5 }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={saving || loading}
            sx={{
              alignSelf: { xs: 'flex-start', sm: 'center' },
              ml: 0,
              px: 2,
              py: 0.9,
              minHeight: 38,
              flexShrink: 0,
              transform: 'translateY(-6px)',
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: 13,
              background: 'linear-gradient(135deg, #7954ec, #6035df)',
              boxShadow: '0 5px 15px rgba(104, 69, 232, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6842df, #512bc9)',
                boxShadow: '0 7px 18px rgba(104, 69, 232, 0.3)'
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
