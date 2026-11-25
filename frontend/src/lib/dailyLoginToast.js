import { toast } from '../components/ui/use-toast.js';

export const showDailyLoginToast = ({
  dailyReward,
  user,
  fallbackTitle,
  fallbackDescription
}) => {
  const totalPoints = Number(dailyReward?.totalPoints ?? user?.points ?? 0);
  const streak = Number(dailyReward?.streak ?? user?.streak ?? 0);

  if (dailyReward?.awarded) {
    const pointsAwarded = Number(dailyReward.pointsAwarded) || 10;
    toast({
      title: `Daily Login Bonus! +${pointsAwarded} Points Earned`,
      description: `Your total is ${totalPoints} points with a ${streak}-day login streak.`,
      variant: 'points'
    });
    return;
  }

  toast({
    title: fallbackTitle || `Welcome back, ${user?.name || 'Explorer'}!`,
    description: fallbackDescription || `Your total is ${totalPoints} points. Current login streak: ${streak} days.`,
    variant: 'default'
  });
};
