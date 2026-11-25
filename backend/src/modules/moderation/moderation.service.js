import { AppError } from '../../shared/errors/app-error.js';
import ModerationReport from '../../models/ModerationReport.js';
import Post from '../../models/Post.js';
import Group from '../../models/Group.js';
import { invalidateAdminStats, invalidateLeaderboard } from '../../services/cacheService.js';

const targetModel = (targetType) => (targetType === 'post' ? Post : Group);

export class ModerationService {
  async createReport(reporterId, { targetType, targetId, reason, details = '' }) {
    const Model = targetModel(targetType);
    const target = await Model.findById(targetId).select('_id author creator').lean();
    if (!target) {
      throw new AppError('The reported content could not be found', 404);
    }

    const ownerId = target.author || target.creator;
    if (ownerId?.toString() === reporterId.toString()) {
      throw new AppError('You cannot report your own content', 400);
    }

    const existingReport = await ModerationReport.findOne({
      reporter: reporterId,
      targetType,
      targetId,
      status: 'pending'
    }).lean();
    if (existingReport) {
      throw new AppError('You have already reported this content', 409);
    }

    try {
      const report = await ModerationReport.create({
        reporter: reporterId,
        targetType,
        targetId,
        reason,
        details
      });
      await invalidateAdminStats();
      return report;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('You have already reported this content', 409);
      }
      throw error;
    }
  }

  async listReports({ status = 'pending', page = '1', limit = '20' } = {}) {
    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const query = status === 'all' ? {} : { status };
    const [reports, total] = await Promise.all([
      ModerationReport.find(query)
        .populate('reporter', 'name username email profileImage')
        .populate('reviewedBy', 'name username')
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean(),
      ModerationReport.countDocuments(query)
    ]);

    const postReportIds = reports
      .filter((report) => report.targetType === 'post')
      .map((report) => report.targetId);
    const groupReportIds = reports
      .filter((report) => report.targetType === 'group')
      .map((report) => report.targetId);
    const [posts, groups] = await Promise.all([
      postReportIds.length
        ? Post.find({ _id: { $in: postReportIds } }).populate('author', 'name username profileImage').lean()
        : [],
      groupReportIds.length
        ? Group.find({ _id: { $in: groupReportIds } }).populate('creator', 'name username profileImage').lean()
        : []
    ]);
    const targets = new Map([
      ...posts.map((target) => [`post:${target._id.toString()}`, target]),
      ...groups.map((target) => [`group:${target._id.toString()}`, target])
    ]);
    const hydratedReports = reports.map((report) => ({
      ...report,
      target: targets.get(`${report.targetType}:${report.targetId.toString()}`) || null
    }));

    return {
      reports: hydratedReports,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async reviewReport(adminId, reportId, { decision, removeContent = false, resolutionNote = '' }) {
    const report = await ModerationReport.findById(reportId);
    if (!report) {
      throw new AppError('Moderation report not found', 404);
    }
    if (report.status !== 'pending') {
      throw new AppError('This moderation report has already been reviewed', 409);
    }

    if (decision === 'resolved' && removeContent) {
      await targetModel(report.targetType).findByIdAndDelete(report.targetId);
      if (report.targetType === 'post') {
        await invalidateLeaderboard();
      }
    }

    report.status = decision;
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    report.resolutionNote = resolutionNote;
    await report.save();
    await invalidateAdminStats();
    return report;
  }
}

export const moderationService = new ModerationService();
