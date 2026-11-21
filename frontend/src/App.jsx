import { useEffect, useRef, useState } from 'react';
import {
  AutoAwesomeRounded,
  ChatBubbleOutlineRounded,
  DescriptionOutlined,
  HistoryRounded,
  HomeOutlined,
  MenuRounded,
  SearchRounded,
  SettingsOutlined
} from '@mui/icons-material';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Toolbar,
  Typography,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { api, clearAccessToken, getAccessToken } from './services/api.js';
import Auth from './components/auth.jsx';
import Chat from './components/chat.jsx';
import ChatHistory from './components/chathistory.jsx';
import Dashboard from './components/dashboard.jsx';
import Documents from './components/document.jsx';
import Profile, { ProfileMenu } from './components/profile.jsx';
import Settings from './components/setting.jsx';
import logo from './assets/Logo.png';

const drawerWidth = 256;
const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeOutlined },
  { id: 'documents', label: 'Documents', icon: DescriptionOutlined },
  { id: 'chat', label: 'AI Chat', icon: ChatBubbleOutlineRounded },
  { id: 'history', label: 'Chat history', icon: HistoryRounded },
  { id: 'settings', label: 'Settings', icon: SettingsOutlined }
];

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileName, setProfileName] = useState('Knowledge User');
  const [chatId, setChatId] = useState(null);
  const [toast, setToast] = useState('');
  const [token, setToken] = useState(getAccessToken);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const mainContentRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return () => { active = false; };
    }

    setAuthReady(false);
    api('/auth/me')
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        setProfileName(currentUser.name);
        setAuthError('');
      })
      .catch((reason) => {
        if (!active) return;
        if (reason.status === 401) {
          clearAccessToken();
          setToken(null);
          setUser(null);
        } else {
          setAuthError(reason.message);
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    function expireSession() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener('auth:expired', expireSession);
    return () => window.removeEventListener('auth:expired', expireSession);
  }, []);

  function signOut() {
    clearAccessToken();
    setToken(null);
    setUser(null);
    setProfileName('Knowledge User');
    setPage('dashboard');
  }

  function handleAuthenticated(result) {
    const authenticatedUser = {
      id: result.userId,
      name: result.name,
      email: result.email
    };
    setToken(result.token);
    setUser(authenticatedUser);
    setProfileName(authenticatedUser.name);
    setAuthError('');
    setToast(result.message);
  }

  const notify = (message) => setToast(message);
  const openChat = (id = null) => {
    setChatId(id);
    setPage('chat');
    setDrawerOpen(false);
    if (isMobile) requestAnimationFrame(() => mainContentRef.current?.focus());
  };
  const navigate = (id) => {
    setPage(id);
    setDrawerOpen(false);
    if (isMobile) requestAnimationFrame(() => mainContentRef.current?.focus());
  };
  const currentPage = navigation.find((item) => item.id === page);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.25, px: 2.5 }}>
        <Box component="img" src={logo} alt="Brainora AI logo" sx={{ width: 36, height: 36, objectFit: 'contain' }} />
        <Typography variant="h6" letterSpacing={-0.7}>
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
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.25, pt: 2, pb: 0 }}>
        {navigation.map(({ id, label, icon: Icon }) => (
          <ListItemButton
            key={id}
            selected={page === id}
            onClick={() => navigate(id)}
            sx={{ mb: 0.5, borderRadius: 2, minHeight: 44 }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: page === id ? 'primary.main' : 'text.secondary' }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              slotProps={{ primary: { sx: { fontSize: 13, fontWeight: page === id ? 600 : 500 } } }}
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ mx: 1, mb: 2, p: 2, minHeight: 76, borderRadius: 2, bgcolor: '#f5f4ff', display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <AutoAwesomeRounded color="primary" fontSize="medium" />
        <Box>
          <Typography variant="body2" fontWeight={800} display="block">Your knowledge base</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>Private and ready to grow</Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ProfileMenu
          profileName={profileName}
          onProfile={() => navigate('profile')}
          onSettings={() => navigate('settings')}
          onLogout={signOut}
        />
        <Typography variant="body2" fontWeight={800} noWrap>
          {profileName}
        </Typography>
      </Box>
    </Box>
  );

  if (!authReady) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Checking session" />
      </Box>
    );
  }

  if (!token || !user) {
    return (
      <>
        {authError && <Alert severity="error" sx={{ m: 2 }}>{authError}</Alert>}
        <Auth onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={!isMobile || drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: { md: drawerWidth },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: '#F2F7FF'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        ref={mainContentRef}
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          outline: 'none',
          bgcolor: page === 'dashboard' ? '#FFFFFF' : 'background.default'
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F2F7FF' }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 58, sm: 64 } }}>
            {isMobile ? (
              <IconButton aria-label="Open navigation menu" onClick={() => setDrawerOpen(true)} edge="start">
                <MenuRounded />
              </IconButton>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: 18, fontWeight: 800 }}>
                {page === 'profile' ? 'Profile' : currentPage?.label}
              </Typography>
            )}
            {isMobile && <Typography variant="subtitle1" fontWeight={800} sx={{ flexGrow: 1, fontSize: 18 }}>{page === 'profile' ? 'Profile' : currentPage?.label}</Typography>}
            <Box sx={{ flexGrow: 1 }} />
            {!isMobile && (
              <Button
                size="small"
                color="inherit"
                startIcon={<SearchRounded sx={{ color: '#7655E9' }} />}
                onClick={() => openChat()}
                sx={{
                  px: 1.5,
                  color: 'text.secondary',
                  bgcolor: '#EDF6FF',
                  border: '1px solid #D8E9FF',
                  borderRadius: '999px',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#8AB8F0', bgcolor: '#E2F0FF' }
                }}
              >
                Ask your knowledge base
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', p: { xs: 2, sm: 3, lg: 4 } }}>
          {page === 'dashboard' && <Dashboard profileName={profileName} onChat={openChat} onPage={navigate} />}
          {page === 'documents' && <Documents notify={notify} />}
          {page === 'chat' && <Chat chatId={chatId} onChatChange={setChatId} onNotify={notify} />}
          {page === 'history' && <ChatHistory onOpenChat={openChat} />}
          {page === 'settings' && <Settings onSaved={notify} />}
          {page === 'profile' && (
            <Profile
              profileName={profileName}
              onSaved={(name) => {
                setProfileName(name);
                notify('Profile saved successfully.');
              }}
            />
          )}
        </Box>
      </Box>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
      />
    </Box>
  );
}

export default App;
