import { z } from 'zod';
import {
  CONNECTION_STATUS_OPTIONS,
  MESSAGE_STATUS_OPTIONS,
  PIPELINE_METRIC_OPTIONS,
  ROLES,
} from '@/lib/constants';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const leadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  salesNavigatorUrl: z.string().url().optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  connectionStatus: z.enum(CONNECTION_STATUS_OPTIONS as [string, ...string[]]).optional(),
  messageStatus: z.enum(MESSAGE_STATUS_OPTIONS as [string, ...string[]]).optional(),
  prospectName: z.string().optional(),
  profile: z.string().optional(),
  icp: z.string().optional(),
  leadStatus: z.string().optional(),
  date: z.string().optional(),
  followUp: z.string().optional(),
  linkedinMsg: z.string().optional(),
  commentsAfterCall: z.string().optional(),
  notes: z.string().optional(),
  futureLeadDate: z.string().optional(),
});

export const kpiSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetValue: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  pipelineMetric: z.enum(PIPELINE_METRIC_OPTIONS as [string, ...string[]]).optional(),
  metricType: z.enum(['count', 'ratio', 'time', 'duration']),
});

export const kpiChangeRequestSchema = z.object({
  proposedTarget: z.coerce.number().min(0),
  reason: z.string().min(1, 'Reason is required'),
});

export const meetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  description: z.string().optional(),
  meetingLink: z.string().url('Must be a valid URL (e.g. https://meet.google.com/...)').min(1, 'Meeting link is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  participants: z.array(z.string()).min(1, 'At least one participant is required'),
});

export const userSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8).optional().or(z.literal('')),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.USER]),
});

export const enrichmentSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string().min(1),
      content: z.string().optional(),
    }),
  ),
});

export const reportFilterSchema = z.object({
  type: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  userId: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LeadFormData = z.infer<typeof leadSchema>;
export type KpiFormData = z.infer<typeof kpiSchema>;
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type UserFormData = z.infer<typeof userSchema>;
