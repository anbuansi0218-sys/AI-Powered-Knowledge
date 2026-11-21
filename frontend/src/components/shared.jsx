import { AutoAwesomeRounded } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{
        mb: 3,
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between'
      }}
      spacing={2}
    >
      <Box>
        <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={1.1}>
          {eyebrow}
        </Typography>
        <Typography variant="h4" fontWeight={700} letterSpacing={-0.8} sx={{ fontSize: { xs: 26, sm: 30 } }}>
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>{description}</Typography>
      </Box>
      {action}
    </Stack>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>;
}

export function EmptyState({ icon: Icon = AutoAwesomeRounded, title, text, action, onAction }) {
  return (
    <Stack spacing={1} sx={{ py: 5, px: 2, alignItems: 'center', textAlign: 'center' }}>
      <Box sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: '#f1efff', color: 'primary.main', mb: 0.5 }}>
        <Icon />
      </Box>
      <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>{text}</Typography>
      {action && <Button size="small" onClick={onAction} sx={{ mt: 0.5 }}>{action}</Button>}
    </Stack>
  );
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name = 'Knowledge User') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
