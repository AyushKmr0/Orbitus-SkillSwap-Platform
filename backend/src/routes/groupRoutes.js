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
} from '../controllers/groupController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGroups)
  .post(createGroup);

router.route('/:id')
  .get(getGroupById)
  .put(updateGroup)
  .delete(deleteGroup);

router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.post('/:id/members', addMemberToGroup);
router.put('/:id/requests/:userId', respondJoinRequest);
router.put('/:id/members/:userId', manageMemberRole);
router.put('/:id/meeting-link', updateGroupMeetingLink);

router.route('/:id/messages')
  .get(getGroupMessages)
  .post(sendGroupMessage)
  .delete(clearGroupChat);

router.put('/:id/messages/:msgId/pin', togglePinMessage);
router.delete('/:id/messages/:msgId', deleteGroupMessage);

export default router;
