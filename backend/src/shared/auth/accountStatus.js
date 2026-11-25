export const isAccountSuspended = (user, now = new Date()) => {
  if (!user?.suspendedAt) {
    return false;
  }

  return !user.suspendedUntil || new Date(user.suspendedUntil) > now;
};
