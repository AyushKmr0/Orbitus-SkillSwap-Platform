import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  respondJoinRequest,
  manageMemberRole,
  updateGroupMeetingLink,
  getGroupMessages,
  sendGroupMessage,
  togglePinMessage,
  deleteGroupMessage,
  clearGroupChat,
  addMemberToGroup
} from './group.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  createGroupSchema,
  updateGroupSchema,
  groupIdParamSchema,
  respondJoinRequestSchema,
  manageMemberRoleSchema,
  updateGroupMeetingLinkSchema,
  sendGroupMessageSchema,
  groupMessageParamsSchema,
  addMemberSchema
} from './group.schema.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGroups)
  .post(validateRequest(createGroupSchema), createGroup);

router.route('/:id')
  .get(validateRequest(groupIdParamSchema), getGroupById)
  .put(validateRequest(updateGroupSchema), updateGroup)
  .delete(validateRequest(groupIdParamSchema), deleteGroup);

router.post('/:id/join', validateRequest(groupIdParamSchema), joinGroup);
router.post('/:id/leave', validateRequest(groupIdParamSchema), leaveGroup);
router.post('/:id/members', validateRequest(addMemberSchema), addMemberToGroup);
router.put('/:id/requests/:userId', validateRequest(respondJoinRequestSchema), respondJoinRequest);
router.put('/:id/members/:userId', validateRequest(manageMemberRoleSchema), manageMemberRole);
router.put('/:id/meeting-link', validateRequest(updateGroupMeetingLinkSchema), updateGroupMeetingLink);

router.route('/:id/messages')
  .get(validateRequest(groupIdParamSchema), getGroupMessages)
  .post(validateRequest(sendGroupMessageSchema), sendGroupMessage)
  .delete(validateRequest(groupIdParamSchema), clearGroupChat);

router.put('/:id/messages/:msgId/pin', validateRequest(groupMessageParamsSchema), togglePinMessage);
router.delete('/:id/messages/:msgId', validateRequest(groupMessageParamsSchema), deleteGroupMessage);

export default router;
