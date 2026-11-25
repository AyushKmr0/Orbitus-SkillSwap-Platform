export const ADMIN_ACCESS_LEVELS = ['full', 'moderator', 'support', 'analyst', 'custom'];

export const ADMIN_PERMISSION_KEYS = [
  'dashboard.read',
  'users.read',
  'users.manage',
  'content.read',
  'content.manage',
  'moderation.manage',
  'feedback.manage',
  'system.manage',
  'audit.read',
  'permissions.manage',
  'feature_flags.manage',
  'health.read'
];

const ACCESS_LEVEL_PERMISSIONS = {
  full: ADMIN_PERMISSION_KEYS,
  moderator: [
    'dashboard.read',
    'content.read',
    'content.manage',
    'moderation.manage',
    'audit.read'
  ],
  support: [
    'dashboard.read',
    'users.read',
    'users.manage',
    'feedback.manage'
  ],
  analyst: [
    'dashboard.read',
    'audit.read',
    'feature_flags.manage',
    'health.read'
  ]
};

export const getAdminPermissions = (user) => {
  if (String(user?.role || '').trim().toLowerCase() !== 'admin') {
    return [];
  }

  const accessLevel = user.adminAccessLevel || 'full';
  if (accessLevel === 'custom') {
    return (user.adminPermissions || []).filter((permission) =>
      ADMIN_PERMISSION_KEYS.includes(permission)
    );
  }

  return ACCESS_LEVEL_PERMISSIONS[accessLevel] || [];
};

export const requireAdminPermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: authentication required'
    });
  }

  const userIsAdmin = String(req.user?.role || '').trim().toLowerCase() === 'admin';
  const allowed =
    userIsAdmin &&
    (req.adminKeyAuthenticated || getAdminPermissions(req.user).includes(permission));

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: `Access denied: ${permission} permission required`
    });
  }

  return next();
};
