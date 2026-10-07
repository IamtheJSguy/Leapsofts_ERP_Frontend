import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  useTheme,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import { tokens } from '@/styles/tokens';

export const ShowcaseAdmin: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState<'users' | 'system' | 'usage'>('users');

  const adminTabs = [
    { id: 'users', label: 'Users & Roles' },
    { id: 'system', label: 'System Settings' },
    { id: 'usage', label: 'License & Usage' },
  ];

  const adminUsers = [
    { name: 'Huzaifa Rasheed', email: 'huzaifa@leapsofts.com', role: 'Owner / Admin', dept: 'Executive', twoFa: true },
    { name: 'Sarah Jenkins', email: 'sarah.j@leapsofts.com', role: 'Manager', dept: 'Sales', twoFa: true },
    { name: 'Alex Rivera', email: 'alex.r@leapsofts.com', role: 'Employee', dept: 'Engineering', twoFa: true },
    { name: 'Marcus Vance', email: 'marcus.v@leapsofts.com', role: 'Employee', dept: 'Engineering', twoFa: false },
    { name: 'Elena Rostova', email: 'elena.r@leapsofts.com', role: 'Employee', dept: 'Design', twoFa: true },
    { name: 'David Chen', email: 'david.c@leapsofts.com', role: 'Employee', dept: 'DevOps', twoFa: true },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 2.5 }}>
      {/* 1. Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            letterSpacing: '-0.025em',
            mb: 0.25,
            color: isDark ? '#FFFFFF' : tokens.text.primary,
          }}
        >
          Admin Panel
        </Typography>
        <Typography
          sx={{
            color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
            fontWeight: 500,
            fontSize: '0.78rem',
          }}
        >
          Manage user permissions, security settings, and configure system operations.
        </Typography>
      </Box>

      {/* 2. Translucent Tab Switcher */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: '20px',
          p: 0.5,
          gap: 0.5,
          mb: 3.5,
          width: 'fit-content',
        }}
      >
        {adminTabs.map((item) => (
          <Button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            sx={{
              borderRadius: '16px',
              px: 3,
              py: 0.65,
              bgcolor: activeTab === item.id ? (isDark ? '#FFFFFF' : '#1A1625') : 'transparent',
              color: activeTab === item.id ? (isDark ? '#1A1625' : '#FFFFFF') : 'text.secondary',
              fontWeight: 750,
              fontSize: '0.82rem',
              textTransform: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>

      {/* 3. Tab Content */}
      {activeTab === 'users' && (
        <Card
          sx={{
            borderRadius: '24px',
            bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.02)',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Member</TableCell>
                  <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Access Role</TableCell>
                  <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</TableCell>
                  <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>2FA Security</TableCell>
                  <TableCell sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.email} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.brand.primary, fontSize: '0.75rem', fontWeight: 800 }}>
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 750, fontSize: '0.85rem', color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                            {user.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: user.role.includes('Admin') ? 'rgba(255, 127, 17, 0.12)' : 'rgba(93, 26, 137, 0.1)',
                          color: user.role.includes('Admin') ? '#FF7F11' : tokens.brand.primary,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', fontWeight: 650 }}>{user.dept}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<KeyOutlinedIcon sx={{ fontSize: 13, color: 'inherit !important' }} />}
                        label={user.twoFa ? 'Enforced' : 'Optional'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: user.twoFa ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: user.twoFa ? '#10B981' : '#F59E0B',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: tokens.brand.primary }}>
                        Edit Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 'system' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', mb: 2, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                Organization Profile
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Organization Name" defaultValue="Leapsofts Tech Enterprise" size="small" fullWidth />
                <TextField label="Default Timezone" defaultValue="UTC+05:00 (Islamabad / Karachi)" size="small" fullWidth />
                <TextField label="Shift Timing" defaultValue="09:00 AM - 05:00 PM" size="small" fullWidth />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', mb: 2, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                Integrations & Compliance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '14px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CloudDoneOutlinedIcon sx={{ color: '#10B981' }} />
                    <Box>
                      <Typography sx={{ fontWeight: 750, fontSize: '0.85rem' }}>Google Workspace Drive</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Connected for encrypted attachment storage</Typography>
                    </Box>
                  </Box>
                  <Chip label="Connected" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 800 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '14px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SecurityIcon sx={{ color: tokens.brand.primary }} />
                    <Box>
                      <Typography sx={{ fontWeight: 750, fontSize: '0.85rem' }}>Mandatory 2FA for Staff</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Require TOTP authenticator on all devices</Typography>
                    </Box>
                  </Box>
                  <Switch defaultChecked />
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'usage' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>SEATS ALLOCATED</Typography>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 850, my: 0.5 }}>6 / 20 Seats</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Enterprise Tier license active</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>TELEMETRY STORAGE</Typography>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 850, my: 0.5 }}>12.4 GB / 100 GB</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Encrypted activity logs stored</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(28, 25, 36, 0.65)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>MONTHLY API CALLS</Typography>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 850, my: 0.5 }}>45,210 / 100k</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>54.8k remaining this billing cycle</Typography>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
