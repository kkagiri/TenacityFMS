/**
 * File: UserAvatar.js
 * Purpose: Circular initials avatar for users with deterministic color based on username
 * Dependencies: React
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserAvatar(props): Renders a 36×36 circle with user initials
 *   - getInitials(user): Derives 1-2 letter initials from user data
 *   - getAvatarColor(name): Picks a stable background color from a palette
 */
import React, { useMemo } from 'react';

// M365-aligned avatar palette (background → foreground pairs)
const AVATAR_COLORS = [
  { bg: '#deecf9', fg: '#0078d4' }, // blue
  { bg: '#dff6dd', fg: '#107c10' }, // green
  { bg: '#fff4ce', fg: '#8a4f00' }, // amber
  { bg: '#fde7e9', fg: '#a4262c' }, // red
  { bg: '#e0f2f1', fg: '#00796b' }, // teal
  { bg: '#e8eaf6', fg: '#3949ab' }, // indigo
  { bg: '#f3e8fd', fg: '#6b21a8' }, // purple
  { bg: '#f3f2f1', fg: '#605e5c' }, // neutral
];

/**
 * Derive initials from a user object.
 * Prefers FirstName + LastName, falls back to first 1-2 chars of userName.
 */
const getInitials = (user) => {
  if (!user) return '?';

  const first = (user.firstName || user.FirstName || '').trim();
  const last  = (user.lastName  || user.LastName  || '').trim();

  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first)         return first.slice(0, 2).toUpperCase();

  const username = (user.userName || user.UserName || user.email || '').trim();
  return username.slice(0, 2).toUpperCase() || '?';
};

/**
 * Deterministic color index from a string so the same user always gets the same color.
 */
const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * @param {object} props
 * @param {object} props.user  - User object (userName, email, firstName, lastName)
 * @param {number} [props.size=36] - Diameter in px
 * @param {string} [props.className] - Extra CSS class
 */
const UserAvatar = ({ user, size = 36, className = '' }) => {
  const initials = useMemo(() => getInitials(user), [user]);
  const colorKey  = (user?.userName || user?.email || '').toLowerCase();
  const { bg, fg } = useMemo(() => getAvatarColor(colorKey), [colorKey]);

  return (
    <div
      className={`m365-avatar ${className}`}
      style={{
        width:           size,
        height:          size,
        borderRadius:    '50%',
        background:      bg,
        color:           fg,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        Math.round(size * 0.35),
        fontWeight:      600,
        flexShrink:      0,
        userSelect:      'none',
        textTransform:   'uppercase',
        letterSpacing:   '0.5px',
      }}
      title={user?.userName || user?.email || ''}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
