import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting.js';
import { AppError } from '../shared/errors/app-error.js';

export const FEATURE_FLAG_DEFAULTS = {
  userRegistration: { label: 'New user registration', enabled: true },
  postsEnabled: { label: 'New community posts', enabled: true },
  groupsEnabled: { label: 'Study group creation', enabled: true },
  skillRequestsEnabled: { label: 'Skill and course requests', enabled: true }
};

const settingKey = (key) => `feature_flag:${key}`;

export const getFeatureFlags = async () => {
  if (mongoose.connection.readyState !== 1) {
    return Object.entries(FEATURE_FLAG_DEFAULTS).map(([key, config]) => ({
      key,
      ...config
    }));
  }

  const settings = await SystemSetting.find({
    key: { $in: Object.keys(FEATURE_FLAG_DEFAULTS).map(settingKey) }
  }).lean();
  const storedValues = new Map(settings.map((setting) => [setting.key, setting.value]));

  return Object.entries(FEATURE_FLAG_DEFAULTS).map(([key, config]) => ({
    key,
    label: config.label,
    enabled: typeof storedValues.get(settingKey(key)) === 'boolean'
      ? storedValues.get(settingKey(key))
      : config.enabled
  }));
};

export const getFeatureFlag = async (key) => {
  const config = FEATURE_FLAG_DEFAULTS[key];
  if (!config) {
    throw new AppError('Unknown feature flag', 404);
  }

  if (mongoose.connection.readyState !== 1) {
    return config.enabled;
  }

  const setting = await SystemSetting.findOne({ key: settingKey(key) }).lean();
  return typeof setting?.value === 'boolean' ? setting.value : config.enabled;
};

export const setFeatureFlag = async (key, enabled, updatedBy) => {
  if (!FEATURE_FLAG_DEFAULTS[key]) {
    throw new AppError('Unknown feature flag', 404);
  }

  const setting = await SystemSetting.findOneAndUpdate(
    { key: settingKey(key) },
    { $set: { value: enabled, updatedBy } },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  return { key, enabled: setting.value };
};

export const requireFeatureFlag = (key) => async (req, res, next) => {
  try {
    if (!(await getFeatureFlag(key))) {
      return res.status(403).json({
        success: false,
        message: 'This feature is currently unavailable'
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
