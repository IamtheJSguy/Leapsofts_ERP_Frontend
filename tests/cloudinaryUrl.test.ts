import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  optimizeCloudinaryAvatarUrl,
  rewriteAvatarUrlsInPlace,
} from '../src/utils/cloudinaryUrl.ts';

test('inserts f_auto and size transforms into a Cloudinary upload URL', () => {
  const src = 'https://res.cloudinary.com/demo/image/upload/v1/profile-avatars/u1/photo.jpg';
  assert.equal(
    optimizeCloudinaryAvatarUrl(src, 64),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_face,w_64,h_64/v1/profile-avatars/u1/photo.jpg',
  );
});

test('replaces an existing transformation segment instead of stacking', () => {
  const src =
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/v1/profile-avatars/u1/photo.jpg';
  assert.equal(
    optimizeCloudinaryAvatarUrl(src, 96),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,g_face,w_96,h_96/v1/profile-avatars/u1/photo.jpg',
  );
});

test('leaves non-Cloudinary URLs unchanged', () => {
  const src = 'https://example.com/avatar.jpg';
  assert.equal(optimizeCloudinaryAvatarUrl(src), src);
});

test('rewrites nested avatarUrl fields in API payloads', () => {
  const payload = {
    data: {
      user: { avatarUrl: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg' },
      members: [{ avatarUrl: 'https://res.cloudinary.com/demo/image/upload/v1/b.jpg' }],
    },
  };
  rewriteAvatarUrlsInPlace(payload);
  assert.match(payload.data.user.avatarUrl, /f_auto,q_auto/);
  assert.match(payload.data.members[0].avatarUrl, /w_96,h_96/);
});
