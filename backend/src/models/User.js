import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    index: true
  },
  usernameUpdatedAt: {
    type: Date,
    default: null
  },
  password: {
    type: String,
    required: function () {
      return !this.authProvider || this.authProvider === 'local';
    }
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  providerId: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  skillsTeach: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    }
  }],
  skillsLearn: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    }
  }],
  socialLinks: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
    extra: [{
      label: { type: String, default: '' },
      url: { type: String, default: '' }
    }]
  },
  experienceLevel: {
    type: String,
    enum: ['Junior', 'Mid', 'Senior', 'Lead'],
    default: 'Junior'
  },
  education: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  resumeFile: {
    type: String,
    default: ''
  },
  projects: [{
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    featured: { type: Boolean, default: true }
  }],
  interests: [{
    type: String
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followersCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  points: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: { type: String, default: '' },
    expiresAt: { type: Date }
  },
  refreshToken: {
    type: String,
    default: ''
  },
  dailyLoginTracker: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password validity
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ name: 'text', username: 'text' });
userSchema.index({ authProvider: 1, providerId: 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);
export default User;
