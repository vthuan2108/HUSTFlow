/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeeklyChallenge } from './types';

export const DEFAULT_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'challenge_tasks',
    title: 'Hoàn thành 10 nhiệm vụ trong tuần',
    targetType: 'TASKS_COMPLETED',
    targetValue: 10,
    currentValue: 0,
    tuViReward: 200,
    linhThachReward: 120,
    isClaimed: false
  },
  {
    id: 'challenge_habits',
    title: 'Duy trì 15 lượt điểm danh thói quen',
    targetType: 'HABITS_COMPLETED',
    targetValue: 15,
    currentValue: 0,
    tuViReward: 180,
    linhThachReward: 100,
    isClaimed: false
  }
];
