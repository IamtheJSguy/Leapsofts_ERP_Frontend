import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '@/lib/axios';
import { discardQueryCacheForSessionChange } from '@/lib/queryPersistence';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types';
import { showApiError } from '@/utils/apiError';

const ImpersonatePage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('Missing impersonation token');
      return;
    }
    localStorage.setItem('accessToken', token);
    api
      .get<{ data: User }>('/users/me')
      .then(async (res) => {
        const previousUserId = useAuthStore.getState().user?._id;
        await discardQueryCacheForSessionChange([previousUserId, res.data.data._id]);
        setAuth(res.data.data);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        localStorage.removeItem('accessToken');
        showApiError(err);
        setFailed(true);
      });
  }, [navigate, params, setAuth]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      {error ? <Typography color="error">{error}</Typography> : failed ? null : <CircularProgress />}
    </Box>
  );
};

export default ImpersonatePage;
