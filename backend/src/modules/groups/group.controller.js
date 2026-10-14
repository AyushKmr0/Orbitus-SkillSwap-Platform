import { asyncHandler } from '../../shared/http/async-handler.js';
import { ApiResponse } from '../../shared/http/api-response.js';
import { groupService } from './group.service.js';

export class GroupController {
  constructor(service = groupService) {
    this.service = service;
  }

  createGroup = asyncHandler(async (req, res) => {
    const group = await this.service.createGroup(req.user._id, req.body);
    return res.status(201).json(
      new ApiResponse(201, { group }, 'Group created successfully!')
    );
  });

  getGroups = asyncHandler(async (req, res) => {
    const result = await this.service.getGroups(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      groups: result.groups,
      data: result,
      hasMore: result.hasMore,
      page: result.page,
      total: result.total
    });
  });

  getGroupById = asyncHandler(async (req, res) => {
    const group = await this.service.getGroupById(req.params.id, req.user);
    return res.status(200).json(
      new ApiResponse(200, { group }, 'Group details retrieved')
    );
  });

  updateGroup = asyncHandler(async (req, res) => {
    const group = await this.service.updateGroup(req.params.id, req.user._id, req.body);
    return res.status(200).json(
      new ApiResponse(200, { group }, 'Group settings updated successfully!')
    );
  });

  joinGroup = asyncHandler(async (req, res) => {
    try {
      const inviteCode = req.query.inviteCode || req.body?.inviteCode;
      const result = await this.service.joinGroup(req.params.id, req.user, { inviteCode });
      return res.status(200).json(
        new ApiResponse(200, {
          isMember: result.isMember,
          isPending: result.isPending
        }, result.message)
      );
    } catch (err) {
      if (err.requiresInvite) {
        return res.status(403).json({
          success: false,
          requiresInvite: true,
          message: err.message
        });
      }
      throw err;
    }
  });

  leaveGroup = asyncHandler(async (req, res) => {
    const result = await this.service.leaveGroup(req.params.id, req.user);
    return res.status(200).json(
      new ApiResponse(200, { groupDeleted: result.groupDeleted }, result.message)
    );
  });

  deleteGroup = asyncHandler(async (req, res) => {
    const group = await this.service.deleteGroup(req.params.id, req.user);
    return res.status(200).json(
      new ApiResponse(200, null, `Group "${group.name}" was deleted successfully.`)
    );
  });

  respondJoinRequest = asyncHandler(async (req, res) => {
    const { action } = req.body;
    const result = await this.service.respondJoinRequest(req.params.id, req.user, req.params.userId, action);
    return res.status(200).json(
      new ApiResponse(200, { group: result.group }, action === 'accept' ? 'User accepted into group' : 'Request rejected')
    );
  });

  manageMemberRole = asyncHandler(async (req, res) => {
    const { action } = req.body;
    const group = await this.service.manageMemberRole(req.params.id, req.user, req.params.userId, action);
    return res.status(200).json(
      new ApiResponse(200, { group }, 'Member updated successfully')
    );
  });

  updateGroupMeetingLink = asyncHandler(async (req, res) => {
    const result = await this.service.updateGroupMeetingLink(req.params.id, req.user, req.body);
    return res.status(200).json(
      new ApiResponse(200, result, 'Group video call link updated!')
    );
  });

  getGroupMessages = asyncHandler(async (req, res) => {
    const messages = await this.service.getGroupMessages(req.params.id, req.user);
    return res.status(200).json(
      new ApiResponse(200, { messages }, 'Group messages retrieved')
    );
  });

  sendGroupMessage = asyncHandler(async (req, res) => {
    const message = await this.service.sendGroupMessage(req.params.id, req.user, req.body);
    return res.status(201).json(
      new ApiResponse(201, { message }, 'Message sent')
    );
  });

  togglePinMessage = asyncHandler(async (req, res) => {
    const isPinned = await this.service.togglePinMessage(req.params.id, req.user, req.params.msgId);
    return res.status(200).json(
      new ApiResponse(200, { isPinned }, isPinned ? 'Message pinned to group chat' : 'Message unpinned')
    );
  });

  deleteGroupMessage = asyncHandler(async (req, res) => {
    const mode = req.query.mode || req.body?.mode;
    const result = await this.service.deleteGroupMessage(req.params.id, req.user, req.params.msgId, mode);
    return res.status(200).json(
      new ApiResponse(200, result, result.mode === 'me' ? 'Message removed from your view' : 'Message marked as deleted')
    );
  });

  clearGroupChat = asyncHandler(async (req, res) => {
    await this.service.clearGroupChat(req.params.id, req.user);
    return res.status(200).json(
      new ApiResponse(200, null, 'Chat cleared successfully')
    );
  });

  addMemberToGroup = asyncHandler(async (req, res) => {
    const result = await this.service.addMemberToGroup(req.params.id, req.user, req.body.userId);
    return res.status(200).json(
      new ApiResponse(200, { memberId: result.memberId }, `${result.targetUserName} added to the group`)
    );
  });
}

export const groupController = new GroupController();
export const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  respondJoinRequest,
  manageMemberRole,
  updateGroupMeetingLink,
  getGroupMessages,
  sendGroupMessage,
  togglePinMessage,
  deleteGroupMessage,
  clearGroupChat,
  addMemberToGroup
} = groupController;
