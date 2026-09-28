import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types';

const ImpersonatePage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Missing impersonation token');
      return;
    }
    localStorage.setItem('accessToken', token);
    api
      .get<{ data: User }>('/users/me')
      .then((res) => {
        setAuth(res.data.data);
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        setError('Impersonation session could not be started');
      });
  }, [navigate, params, setAuth]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      {error ? <Typography color="error">{error}</Typography> : <CircularProgress />}
    </Box>
  );
};

export default ImpersonatePage;
