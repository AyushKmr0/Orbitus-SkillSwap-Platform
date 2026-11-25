import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true
    },
    targetType: {
      type: String,
      trim: true,
      maxlength: 60,
      default: ''
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    targetLabel: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    statusCode: {
      type: Number,
      required: true
    },
    ipAddress: {
      type: String,
      maxlength: 100,
      default: ''
    }
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });

const AdminAuditLog =
  mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
