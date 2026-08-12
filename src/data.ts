/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreItem, WeeklyChallenge, Achievement, BottleneckRequirement } from './types';

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'tu_khi_dan',
    name: 'Tụ Khí Đan (Sơ Cấp)',
    description: 'Thần dược khai thông kinh mạch. Khi bế quan tu luyện (Pomodoro) nhận thêm +25% Tu Vi tích lũy.',
    cost: 40,
    type: 'CONSUMABLE',
    effectType: 'POMODORO_XP',
    effectValue: 0.25,
    icon: '🔮'
  },
  {
    id: 'tu_linh_tran',
    name: 'Tụ Linh Trận Pháp',
    description: 'Bảo trận thu thập linh khí tự nhiên. Giúp nhận thụ động +2 Tu Vi mỗi 5 giây khi đang bế quan thiền định.',
    cost: 120,
    type: 'CONSUMABLE', // Keep as consumable for single session activation
    effectType: 'SUCCESS_RATE',
    effectValue: 1,
    icon: '🌀'
  },
  {
    id: 'ho_tam_kinh',
    name: 'Hộ Tâm Kính',
    description: 'Bảo vật phòng thân tối thượng. Bảo vệ đạo tâm khỏi bị tiêu hao Tu Vi nếu chẳng may đột phá thất bại.',
    cost: 80,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '🛡️'
  },
  {
    id: 'dao_tam_phu',
    name: 'Đạo Tâm Phù (Bảo Vệ Streak)',
    description: 'Thần phù bảo hộ đạo tâm. Khi sử dụng, lập tức tăng thêm +1 ngày liên tiếp (streak) cho tất cả các thói quen hiện có để giữ vững phong độ tu luyện.',
    cost: 50,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '📜'
  },
  {
    id: 'linh_chi_duoc',
    name: 'Linh Chi Đại Bổ Hoàn',
    description: 'Dược lực bồi bổ nguyên khí thâm sâu. Nhận ngay lập tức +100 Tu Vi khi sử dụng.',
    cost: 60,
    type: 'CONSUMABLE',
    effectType: 'INSTANT_XP',
    effectValue: 100,
    icon: '🍄'
  },
  {
    id: 'thanh_tam_phu',
    name: 'Thanh Tâm Phù',
    description: 'Linh phù tịnh hóa tâm cảnh. Trấn áp và hóa giải trạng thái "Tâm Ma Xâm Nhập" trong ngày hôm nay, khôi phục hiệu suất tu luyện 100%.',
    cost: 60,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '☯️'
  },
  {
    id: 'spell_tu_khi_quyet',
    name: 'Tụ Khí Quyết',
    description: 'Bí tịch sơ cấp. Khi trang bị, nhận thêm +30% Tu Vi khi hoàn thành thiền định (Pomodoro).',
    cost: 100,
    type: 'PERMANENT',
    effectType: 'POMODORO_XP',
    effectValue: 0.30,
    icon: '📖'
  },
  {
    id: 'spell_tam_ma_tram',
    name: 'Tâm Ma Trảm',
    description: 'Trảm trừ tạp niệm. Khi trang bị, nhận gấp đôi (+100%) lượng Linh Thạch từ mọi nguồn.',
    cost: 180,
    type: 'PERMANENT',
    effectType: 'COIN_BUFF',
    effectValue: 2.0,
    icon: '⚔️'
  },
  {
    id: 'spell_than_hanh_bo',
    name: 'Thần Hành Bộ',
    description: 'Thân pháp nhẹ nhàng. Tăng +50% hiệu quả hấp thụ Tu Vi từ nhật khóa thói quen.',
    cost: 120,
    type: 'PERMANENT',
    effectType: 'HABIT_XP',
    effectValue: 1.5,
    icon: '⚡'
  },
  {
    id: 'truc_co_dan',
    name: 'Trúc Cơ Đan',
    description: 'Thần dược đúc kết tiên cơ. Bắt buộc sở hữu để đột phá vượt qua Bình Cảnh Trúc Cơ.',
    cost: 100,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '💊'
  },
  {
    id: 'ket_dan_hoan',
    name: 'Kết Đan Hoàn',
    description: 'Bảo đan ngưng tụ Kim Đan. Bắt buộc sở hữu để đột phá vượt qua Bình Cảnh Kết Đan.',
    cost: 150,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '🔮'
  },
  {
    id: 'nguyen_anh_dan',
    name: 'Nguyên Anh Đan',
    description: 'Bồi bổ thần trí ngưng tụ Nguyên Anh. Bắt buộc sở hữu để đột phá Bình Cảnh Nguyên Anh.',
    cost: 220,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '🟣'
  },
  {
    id: 'do_kiep_phu',
    name: 'Độ Kiếp Phù',
    description: 'Bí phù vượt kiếp nạn cao cấp. Bắt buộc sở hữu để đột phá các mốc Bình Cảnh đại năng.',
    cost: 320,
    type: 'CONSUMABLE',
    effectType: 'SUCCESS_RATE',
    effectValue: 1.0,
    icon: '⚡'
  }
];

export const DEFAULT_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'challenge_meditation',
    title: 'Bế Quan Vượt Giới (Thiền Định 120 phút)',
    targetType: 'MEDITATION_MINUTES',
    targetValue: 120,
    currentValue: 0,
    tuViReward: 150,
    linhThachReward: 100,
    isClaimed: false
  },
  {
    id: 'challenge_tasks',
    title: 'Giải Quyết Tâm Ma (Hoàn thành 10 nhiệm vụ)',
    targetType: 'TASKS_COMPLETED',
    targetValue: 10,
    currentValue: 0,
    tuViReward: 200,
    linhThachReward: 120,
    isClaimed: false
  },
  {
    id: 'challenge_habits',
    title: 'Gìn Giữ Đạo Tâm (Tích lũy 15 lượt thói quen)',
    targetType: 'HABITS_COMPLETED',
    targetValue: 15,
    currentValue: 0,
    tuViReward: 180,
    linhThachReward: 100,
    isClaimed: false
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  // --- 1. THIỀN ĐỊNH POMODORO (10) ---
  { id: 'ach_med_1', category: 'MEDITATION', title: 'Sơ Nhập Định', description: 'Bế quan thiền định tích lũy đủ 60 phút Pomodoro', icon: '🧘', targetType: 'MEDITATION_MINUTES', targetValue: 60, rewardLinhThach: 0, titleToEquip: '🧘 Sơ Nhập Thiền Định' },
  { id: 'ach_med_2', category: 'MEDITATION', title: 'Khổ Hạnh Thiền Tôn', description: 'Bế quan thiền định tích lũy đủ 300 phút Pomodoro', icon: '🧘‍♂️', targetType: 'MEDITATION_MINUTES', targetValue: 300, rewardLinhThach: 0, titleToEquip: '🧘‍♂️ Khổ Hạnh Thiền Tôn' },
  { id: 'ach_med_3', category: 'MEDITATION', title: 'Tịch Mịch Thiền Thần', description: 'Bế quan thiền định tích lũy đạt mốc 1.000 phút Pomodoro', icon: '🌌', targetType: 'MEDITATION_MINUTES', targetValue: 1000, rewardLinhThach: 0, titleToEquip: '🌌 Tịch Mịch Thiền Thần' },
  { id: 'ach_med_4', category: 'MEDITATION', title: 'Vô Thượng Ma Thiền', description: 'Bế quan thiền định tích lũy đạt 3.000 phút Pomodoro', icon: '🕉️', targetType: 'MEDITATION_MINUTES', targetValue: 3000, rewardLinhThach: 0, titleToEquip: '🕉️ Vô Thượng Ma Thiền' },
  { id: 'ach_med_5', category: 'MEDITATION', title: 'Thiền Định Bất Hủ', description: 'Bế quan thiền định tích lũy đạt mốc 5.000 phút Pomodoro', icon: '🌟', targetType: 'MEDITATION_MINUTES', targetValue: 5000, rewardLinhThach: 0, titleToEquip: '🌟 Thiền Định Bất Hủ' },
  { id: 'ach_med_6', category: 'MEDITATION', title: 'Trầm Tích Đạo Tâm', description: 'Bế quan thiền định tích lũy đạt mốc 10.000 phút Pomodoro', icon: '🔮', targetType: 'MEDITATION_MINUTES', targetValue: 10000, rewardLinhThach: 0, titleToEquip: '🔮 Trầm Tích Đạo Tâm' },
  { id: 'ach_med_7', category: 'MEDITATION', title: 'Vô Ngã Thái Hư', description: 'Bế quan thiền định tích lũy đạt mốc 20.000 phút Pomodoro', icon: '🌀', targetType: 'MEDITATION_MINUTES', targetValue: 20000, rewardLinhThach: 0, titleToEquip: '🌀 Vô Ngã Thái Hư' },
  { id: 'ach_med_8', category: 'MEDITATION', title: 'Hỗn Độn Thiền Tổ', description: 'Bế quan thiền định tích lũy đạt mốc 35.000 phút Pomodoro', icon: '☯️', targetType: 'MEDITATION_MINUTES', targetValue: 35000, rewardLinhThach: 0, titleToEquip: '☯️ Hỗn Độn Thiền Tổ' },
  { id: 'ach_med_9', category: 'MEDITATION', title: 'Vạn Giới Định Thần', description: 'Bế quan thiền định tích lũy đạt mốc 50.000 phút Pomodoro', icon: '💫', targetType: 'MEDITATION_MINUTES', targetValue: 50000, rewardLinhThach: 0, titleToEquip: '💫 Vạn Giới Định Thần' },
  { id: 'ach_med_10', category: 'MEDITATION', title: 'Tứ Bộ Định Thiên', description: 'Bế quan thiền định tích lũy đạt mốc 100.000 phút Pomodoro', icon: '👑', targetType: 'MEDITATION_MINUTES', targetValue: 100000, rewardLinhThach: 0, titleToEquip: '👑 Tứ Bộ Định Thiên' },

  // --- 2. NHIỆM VỤ & TRẢM MA (10) ---
  { id: 'ach_task_1', category: 'TASKS', title: 'Tân Thủ Trảm Ma', description: 'Trảm diệt hoàn tất 10 Nhiệm vụ Tông Môn', icon: '⚔️', targetType: 'TASKS_COMPLETED', targetValue: 10, rewardLinhThach: 0, titleToEquip: '⚔️ Tân Thủ Trảm Ma' },
  { id: 'ach_task_2', category: 'TASKS', title: 'Trảm Ma Tông Chủ', description: 'Trảm diệt hoàn tất 50 Nhiệm vụ Tông Môn', icon: '🗡️', targetType: 'TASKS_COMPLETED', targetValue: 50, rewardLinhThach: 0, titleToEquip: '🗡️ Trảm Ma Tông Chủ' },
  { id: 'ach_task_3', category: 'TASKS', title: 'Tuyệt Diệt Task Thánh', description: 'Trảm diệt hoàn tất 200 Nhiệm vụ Tông Môn', icon: '💥', targetType: 'TASKS_COMPLETED', targetValue: 200, rewardLinhThach: 0, titleToEquip: '💥 Tuyệt Diệt Task Thánh' },
  { id: 'ach_task_4', category: 'TASKS', title: 'Vạn Ma Trảm Trừ', description: 'Trảm diệt hoàn tất 500 Nhiệm vụ Tông Môn', icon: '⚡', targetType: 'TASKS_COMPLETED', targetValue: 500, rewardLinhThach: 0, titleToEquip: '⚡ Vạn Ma Trảm Trừ' },
  { id: 'ach_task_5', category: 'TASKS', title: 'Trảm Ma Vô Song', description: 'Trảm diệt hoàn tất 1.000 Nhiệm vụ Tông Môn', icon: '👑', targetType: 'TASKS_COMPLETED', targetValue: 1000, rewardLinhThach: 0, titleToEquip: '👑 Trảm Ma Vô Song' },
  { id: 'ach_task_6', category: 'TASKS', title: 'Ma Vụ Tiêu Trừ', description: 'Trảm diệt hoàn tất 2.000 Nhiệm vụ Tông Môn', icon: '🔥', targetType: 'TASKS_COMPLETED', targetValue: 2000, rewardLinhThach: 0, titleToEquip: '🔥 Ma Vụ Tiêu Trừ' },
  { id: 'ach_task_7', category: 'TASKS', title: 'Bá Thiên Kiểm Ma', description: 'Trảm diệt hoàn tất 3.500 Nhiệm vụ Tông Môn', icon: '🌟', targetType: 'TASKS_COMPLETED', targetValue: 3500, rewardLinhThach: 0, titleToEquip: '🌟 Bá Thiên Kiểm Ma' },
  { id: 'ach_task_8', category: 'TASKS', title: 'Thần Uy Trảm Kiếp', description: 'Trảm diệt hoàn tất 5.000 Nhiệm vụ Tông Môn', icon: '⚡', targetType: 'TASKS_COMPLETED', targetValue: 5000, rewardLinhThach: 0, titleToEquip: '⚡ Thần Uy Trảm Kiếp' },
  { id: 'ach_task_9', category: 'TASKS', title: 'Vô Thượng Trảm Ma Tôn', description: 'Trảm diệt hoàn tất 7.500 Nhiệm vụ Tông Môn', icon: '🗡️', targetType: 'TASKS_COMPLETED', targetValue: 7500, rewardLinhThach: 0, titleToEquip: '🗡️ Vô Thượng Trảm Ma Tôn' },
  { id: 'ach_task_10', category: 'TASKS', title: 'Vạn Giới Trảm Kiếp Chủ', description: 'Trảm diệt hoàn tất 10.000 Nhiệm vụ Tông Môn', icon: '🌌', targetType: 'TASKS_COMPLETED', targetValue: 10000, rewardLinhThach: 0, titleToEquip: '🌌 Vạn Giới Trảm Kiếp Chủ' },

  // --- 3. CHUỖI ĐẠO TÂM - STREAK (10) ---
  { id: 'ach_streak_1', category: 'STREAK', title: 'Đạo Tâm Vững Vàng', description: 'Bảo lưu Chuỗi Tu Hành liên tục 3 ngày', icon: '⚡', targetType: 'STREAK_DAYS', targetValue: 3, rewardLinhThach: 0, titleToEquip: '⚡ Đạo Tâm Vững Vàng' },
  { id: 'ach_streak_2', category: 'STREAK', title: 'Bất Bại Đạo Tâm', description: 'Bảo lưu Chuỗi Tu Hành liên tục 7 ngày', icon: '🔥', targetType: 'STREAK_DAYS', targetValue: 7, rewardLinhThach: 0, titleToEquip: '🔥 Bất Bại Đạo Tâm' },
  { id: 'ach_streak_3', category: 'STREAK', title: 'Vạn Kiếp Bất Hủ', description: 'Bảo lưu Chuỗi Tu Hành liên tục 14 ngày', icon: '🏆', targetType: 'STREAK_DAYS', targetValue: 14, rewardLinhThach: 0, titleToEquip: '🏆 Vạn Kiếp Bất Hủ' },
  { id: 'ach_streak_4', category: 'STREAK', title: 'Bất Mộc Đạo Tổ', description: 'Bảo lưu Chuỗi Tu Hành liên tục 30 ngày', icon: '🌌', targetType: 'STREAK_DAYS', targetValue: 30, rewardLinhThach: 0, titleToEquip: '🌌 Bất Mộc Đạo Tổ' },
  { id: 'ach_streak_5', category: 'STREAK', title: 'Trường Sinh Bất Lão', description: 'Bảo lưu Chuỗi Tu Hành liên tục 45 ngày', icon: '🌿', targetType: 'STREAK_DAYS', targetValue: 45, rewardLinhThach: 0, titleToEquip: '🌿 Trường Sinh Bất Lão' },
  { id: 'ach_streak_6', category: 'STREAK', title: 'Vạn Cổ Đạo Tâm', description: 'Bảo lưu Chuỗi Tu Hành liên tục 60 ngày', icon: '🌟', targetType: 'STREAK_DAYS', targetValue: 60, rewardLinhThach: 0, titleToEquip: '🌟 Vạn Cổ Đạo Tâm' },
  { id: 'ach_streak_7', category: 'STREAK', title: 'Bất Hoại Tiên Kim', description: 'Bảo lưu Chuỗi Tu Hành liên tục 90 ngày', icon: '🛡️', targetType: 'STREAK_DAYS', targetValue: 90, rewardLinhThach: 0, titleToEquip: '🛡️ Bất Hoại Tiên Kim' },
  { id: 'ach_streak_8', category: 'STREAK', title: 'Thái Cổ Chí Tôn', description: 'Bảo lưu Chuỗi Tu Hành liên tục 120 ngày', icon: '🔮', targetType: 'STREAK_DAYS', targetValue: 120, rewardLinhThach: 0, titleToEquip: '🔮 Thái Cổ Chí Tôn' },
  { id: 'ach_streak_9', category: 'STREAK', title: 'Tụ Khí Thành Thần', description: 'Bảo lưu Chuỗi Tu Hành liên tục 180 ngày', icon: '✨', targetType: 'STREAK_DAYS', targetValue: 180, rewardLinhThach: 0, titleToEquip: '✨ Tụ Khí Thành Thần' },
  { id: 'ach_streak_10', category: 'STREAK', title: 'Bất Hủ Đạo Tôn', description: 'Bảo lưu Chuỗi Tu Hành liên tục 365 ngày', icon: '👑', targetType: 'STREAK_DAYS', targetValue: 365, rewardLinhThach: 0, titleToEquip: '👑 Bất Hủ Đạo Tôn' },

  // --- 4. BÁCH KHOA HỌC TRỤ - ACADEMICS (10) ---
  { id: 'ach_acad_1', category: 'ACADEMICS', title: 'Khai Trí Bách Khoa', description: 'Đạt điểm tích lũy CPA từ 2.50 trở lên', icon: '📚', targetType: 'CPA_SCORE', targetValue: 2.5, rewardLinhThach: 0, titleToEquip: '📚 Khai Trí Bách Khoa' },
  { id: 'ach_acad_2', category: 'ACADEMICS', title: 'Tiên Tiến Môn Nhị', description: 'Đạt điểm tích lũy CPA từ 2.80 trở lên', icon: '📜', targetType: 'CPA_SCORE', targetValue: 2.8, rewardLinhThach: 0, titleToEquip: '📜 Tiên Tiến Môn Nhị' },
  { id: 'ach_acad_3', category: 'ACADEMICS', title: 'Khái Niệm Tiên Gia', description: 'Đạt điểm tích lũy CPA từ 3.00 trở lên', icon: '🎓', targetType: 'CPA_SCORE', targetValue: 3.0, rewardLinhThach: 0, titleToEquip: '🎓 Khái Niệm Tiên Gia' },
  { id: 'ach_acad_4', category: 'ACADEMICS', title: 'Học Bá Bách Khoa', description: 'Đạt điểm tích lũy CPA từ 3.20 trở lên', icon: '🌟', targetType: 'CPA_SCORE', targetValue: 3.2, rewardLinhThach: 0, titleToEquip: '🌟 Học Bá Bách Khoa' },
  { id: 'ach_acad_5', category: 'ACADEMICS', title: 'Uy Phong Bách Khoa', description: 'Đạt điểm tích lũy CPA từ 3.40 trở lên', icon: '⚡', targetType: 'CPA_SCORE', targetValue: 3.4, rewardLinhThach: 0, titleToEquip: '⚡ Uy Phong Bách Khoa' },
  { id: 'ach_acad_6', category: 'ACADEMICS', title: 'Danh Gia Học Tông', description: 'Đạt điểm tích lũy CPA từ 3.50 trở lên', icon: '🏆', targetType: 'CPA_SCORE', targetValue: 3.5, rewardLinhThach: 0, titleToEquip: '🏆 Danh Gia Học Tông' },
  { id: 'ach_acad_7', category: 'ACADEMICS', title: 'Thượng Cổ Thần Đồng', description: 'Đạt điểm tích lũy CPA từ 3.60 trở lên', icon: '✨', targetType: 'CPA_SCORE', targetValue: 3.6, rewardLinhThach: 0, titleToEquip: '✨ Thượng Cổ Thần Đồng' },
  { id: 'ach_acad_8', category: 'ACADEMICS', title: 'Bách Khoa Tiên Tôn', description: 'Đạt điểm tích lũy CPA từ 3.70 trở lên', icon: '👑', targetType: 'CPA_SCORE', targetValue: 3.7, rewardLinhThach: 0, titleToEquip: '👑 Bách Khoa Tiên Tôn' },
  { id: 'ach_acad_9', category: 'ACADEMICS', title: 'Tuyệt Đỉnh Học Đế', description: 'Đạt điểm tích lũy CPA từ 3.80 trở lên', icon: '🌌', targetType: 'CPA_SCORE', targetValue: 3.8, rewardLinhThach: 0, titleToEquip: '🌌 Tuyệt Đỉnh Học Đế' },
  { id: 'ach_acad_10', category: 'ACADEMICS', title: 'Vô Thượng Học Thần', description: 'Đạt điểm tích lũy CPA tuyệt đối 3.90+ trở lên', icon: '🕉️', targetType: 'CPA_SCORE', targetValue: 3.9, rewardLinhThach: 0, titleToEquip: '🕉️ Vô Thượng Học Thần' },

  // --- 5. TIÊN DƯỢC & DƯỢC ĐIỀN (10) ---
  { id: 'ach_gar_1', category: 'GARDEN', title: 'Sơ Nhập Tiên Điền', description: 'Thu hoạch 1 mầm Tiên Dược tại Dược Điền', icon: '🌱', targetType: 'GARDEN_PLANTS', targetValue: 1, rewardLinhThach: 0, titleToEquip: '🌱 Sơ Nhập Tiên Điền' },
  { id: 'ach_gar_2', category: 'GARDEN', title: 'Dược Điền Tôn Giả', description: 'Thu hoạch 5 mầm Tiên Dược tại Dược Điền', icon: '🍄', targetType: 'GARDEN_PLANTS', targetValue: 5, rewardLinhThach: 0, titleToEquip: '🍄 Dược Điền Tôn Giả' },
  { id: 'ach_gar_3', category: 'GARDEN', title: 'Thần Dược Đại Sư', description: 'Thu hoạch 15 mầm Tiên Dược tại Dược Điền', icon: '🌿', targetType: 'GARDEN_PLANTS', targetValue: 15, rewardLinhThach: 0, titleToEquip: '🌿 Thần Dược Đại Sư' },
  { id: 'ach_gar_4', category: 'GARDEN', title: 'Bách Thảo Tiên Tôn', description: 'Thu hoạch 30 mầm Tiên Dược tại Dược Điền', icon: '🌸', targetType: 'GARDEN_PLANTS', targetValue: 30, rewardLinhThach: 0, titleToEquip: '🌸 Bách Thảo Tiên Tôn' },
  { id: 'ach_gar_5', category: 'GARDEN', title: 'Linh Dược Vô Tận', description: 'Thu hoạch 50 mầm Tiên Dược tại Dược Điền', icon: '🍁', targetType: 'GARDEN_PLANTS', targetValue: 50, rewardLinhThach: 0, titleToEquip: '🍁 Linh Dược Vô Tận' },
  { id: 'ach_gar_6', category: 'GARDEN', title: 'Dược Vương Tông Chủ', description: 'Thu hoạch 75 mầm Tiên Dược tại Dược Điền', icon: '👑', targetType: 'GARDEN_PLANTS', targetValue: 75, rewardLinhThach: 0, titleToEquip: '👑 Dược Vương Tông Chủ' },
  { id: 'ach_gar_7', category: 'GARDEN', title: 'Vạn Niên Thần Thảo', description: 'Thu hoạch 100 mầm Tiên Dược tại Dược Điền', icon: '🌳', targetType: 'GARDEN_PLANTS', targetValue: 100, rewardLinhThach: 0, titleToEquip: '🌳 Vạn Niên Thần Thảo' },
  { id: 'ach_gar_8', category: 'GARDEN', title: 'Tiên Thảo Càn Khôn', description: 'Thu hoạch 150 mầm Tiên Dược tại Dược Điền', icon: '✨', targetType: 'GARDEN_PLANTS', targetValue: 150, rewardLinhThach: 0, titleToEquip: '✨ Tiên Thảo Càn Khôn' },
  { id: 'ach_gar_9', category: 'GARDEN', title: 'Thái Cổ Tiên Dược', description: 'Thu hoạch 200 mầm Tiên Dược tại Dược Điền', icon: '🔮', targetType: 'GARDEN_PLANTS', targetValue: 200, rewardLinhThach: 0, titleToEquip: '🔮 Thái Cổ Tiên Dược' },
  { id: 'ach_gar_10', category: 'GARDEN', title: 'Bách Thảo Đạo Tổ', description: 'Thu hoạch 300 mầm Tiên Dược tại Dược Điền', icon: '🌌', targetType: 'GARDEN_PLANTS', targetValue: 300, rewardLinhThach: 0, titleToEquip: '🌌 Bách Thảo Đạo Tổ' },

  // --- 6. TÀNG BẢO CÁC & LINH THẠCH (10) ---
  { id: 'ach_wea_1', category: 'WEALTH', title: 'Khởi Nghiệp Tiên Gia', description: 'Tích lũy đạt mốc 100 Linh Thạch', icon: '💎', targetType: 'LINH_THACH', targetValue: 100, rewardLinhThach: 0, titleToEquip: '💎 Khởi Nghiệp Tiên Gia' },
  { id: 'ach_wea_2', category: 'WEALTH', title: 'Tiểu Tự Nguyện', description: 'Tích lũy đạt mốc 500 Linh Thạch', icon: '💰', targetType: 'LINH_THACH', targetValue: 500, rewardLinhThach: 0, titleToEquip: '💰 Tiểu Tự Nguyện' },
  { id: 'ach_wea_3', category: 'WEALTH', title: 'Phú Gia Nhất Phương', description: 'Tích lũy đạt mốc 1.000 Linh Thạch', icon: '💎', targetType: 'LINH_THACH', targetValue: 1000, rewardLinhThach: 0, titleToEquip: '💎 Phú Gia Nhất Phương' },
  { id: 'ach_wea_4', category: 'WEALTH', title: 'Càn Khôn Phú Hào', description: 'Tích lũy đạt mốc 2.500 Linh Thạch', icon: '👑', targetType: 'LINH_THACH', targetValue: 2500, rewardLinhThach: 0, titleToEquip: '👑 Càn Khôn Phú Hào' },
  { id: 'ach_wea_5', category: 'WEALTH', title: 'Kim Sơn Tiên Tôn', description: 'Tích lũy đạt mốc 5.000 Linh Thạch', icon: '🌟', targetType: 'LINH_THACH', targetValue: 5000, rewardLinhThach: 0, titleToEquip: '🌟 Kim Sơn Tiên Tôn' },
  { id: 'ach_wea_6', category: 'WEALTH', title: 'Vạn Bảo Tàng Các', description: 'Tích lũy đạt mốc 10.000 Linh Thạch', icon: '🏆', targetType: 'LINH_THACH', targetValue: 10000, rewardLinhThach: 0, titleToEquip: '🏆 Vạn Bảo Tàng Các' },
  { id: 'ach_wea_7', category: 'WEALTH', title: 'Phú Kỷ Địch Quốc', description: 'Tích lũy đạt mốc 25.000 Linh Thạch', icon: '⚡', targetType: 'LINH_THACH', targetValue: 25000, rewardLinhThach: 0, titleToEquip: '⚡ Phú Kỷ Địch Quốc' },
  { id: 'ach_wea_8', category: 'WEALTH', title: 'Ngân Hà Thần Phú', description: 'Tích lũy đạt mốc 50.000 Linh Thạch', icon: '🌌', targetType: 'LINH_THACH', targetValue: 50000, rewardLinhThach: 0, titleToEquip: '🌌 Ngân Hà Thần Phú' },
  { id: 'ach_wea_9', category: 'WEALTH', title: 'Vạn Giới Tiền Trang', description: 'Tích lũy đạt mốc 100.000 Linh Thạch', icon: '🕉️', targetType: 'LINH_THACH', targetValue: 100000, rewardLinhThach: 0, titleToEquip: '🕉️ Vạn Giới Tiền Trang' },
  { id: 'ach_wea_10', category: 'WEALTH', title: 'Chí Tôn Thần Hào', description: 'Tích lũy đạt mốc 250.000 Linh Thạch', icon: '👑', targetType: 'LINH_THACH', targetValue: 250000, rewardLinhThach: 0, titleToEquip: '👑 Chí Tôn Thần Hào' },

  // --- 7. CẢNH GIỚI & ĐỘ KIẾP (10) ---
  { id: 'ach_rea_1', category: 'REALM', title: 'Ngưng Khí Kỳ', description: 'Tu vi thăng cấp đạt Cấp 5', icon: '🍃', targetType: 'LEVEL', targetValue: 5, rewardLinhThach: 0, titleToEquip: '🍃 Ngưng Khí Kỳ' },
  { id: 'ach_rea_2', category: 'REALM', title: 'Trúc Cơ Chân Nhân', description: 'Vượt bình cảnh thăng tiến cảnh giới Trúc Cơ Kỳ (Cấp 16+)', icon: '💧', targetType: 'LEVEL', targetValue: 16, rewardLinhThach: 0, titleToEquip: '💧 Trúc Cơ Chân Nhân' },
  { id: 'ach_rea_3', category: 'REALM', title: 'Kết Đan Lão Tổ', description: 'Vượt bình cảnh thăng tiến cảnh giới Kết Đan Kỳ (Cấp 20+)', icon: '🔮', targetType: 'LEVEL', targetValue: 20, rewardLinhThach: 0, titleToEquip: '🔮 Kết Đan Lão Tổ' },
  { id: 'ach_rea_4', category: 'REALM', title: 'Nguyên Anh Tôn Giả', description: 'Vượt bình cảnh thăng tiến cảnh giới Nguyên Anh Kỳ (Cấp 24+)', icon: '✨', targetType: 'LEVEL', targetValue: 24, rewardLinhThach: 0, titleToEquip: '✨ Nguyên Anh Tôn Giả' },
  { id: 'ach_rea_5', category: 'REALM', title: 'Hóa Thần Đại Thượng', description: 'Vượt bình cảnh thăng tiến cảnh giới Hóa Thần Kỳ (Cấp 28+)', icon: '🔥', targetType: 'LEVEL', targetValue: 28, rewardLinhThach: 0, titleToEquip: '🔥 Hóa Thần Đại Thượng' },
  { id: 'ach_rea_6', category: 'REALM', title: 'Vấn Đỉnh Chí Tôn', description: 'Thăng tiến cảnh giới Vấn Đỉnh Kỳ (Cấp 36+)', icon: '🌟', targetType: 'LEVEL', targetValue: 36, rewardLinhThach: 0, titleToEquip: '🌟 Vấn Đỉnh Chí Tôn' },
  { id: 'ach_rea_7', category: 'REALM', title: 'Không Niết Tiên Tôn', description: 'Thăng tiến cảnh giới Không Niết Cảnh (Cấp 59+)', icon: '⚡', targetType: 'LEVEL', targetValue: 59, rewardLinhThach: 0, titleToEquip: '⚡ Không Niết Tiên Tôn' },
  { id: 'ach_rea_8', category: 'REALM', title: 'Không Kiếp Đại Tôn', description: 'Thăng tiến cảnh giới Không Kiếp Cảnh (Cấp 80+)', icon: '👑', targetType: 'LEVEL', targetValue: 80, rewardLinhThach: 0, titleToEquip: '👑 Không Kiếp Đại Tôn' },
  { id: 'ach_rea_9', category: 'REALM', title: 'Tứ Bộ Đạp Thiên', description: 'Thăng cấp Đạp Thiên Cảnh Siêu Thoát (Cấp 95+)', icon: '🌌', targetType: 'LEVEL', targetValue: 95, rewardLinhThach: 0, titleToEquip: '🌌 Tứ Bộ Đạp Thiên' },
  { id: 'ach_rea_10', category: 'REALM', title: 'Bất Bại Độ Kiếp', description: 'Vượt lôi kiếp đột phá cảnh giới thành công 10 lần', icon: '🛡️', targetType: 'BREAKTHROUGHS', targetValue: 10, rewardLinhThach: 0, titleToEquip: '🛡️ Bất Bại Độ Kiếp' },

  // --- 8. ĐẶC BIỆT & TÀNG KINH (10) ---
  { id: 'ach_spe_1', category: 'SPECIAL', title: 'Đan Đạo Tông Sư', description: 'Giao dịch mua 5 đan dược/phù lục trong Shop Tàng Bảo Các', icon: '💊', targetType: 'SHOP_ITEMS', targetValue: 5, rewardLinhThach: 0, titleToEquip: '💊 Đan Đạo Tông Sư' },
  { id: 'ach_spe_2', category: 'SPECIAL', title: 'Thói Quen Tiên Gia', description: 'Duy trì hoàn thành tích lũy 50 lượt Thói Quen (Habits)', icon: '🔄', targetType: 'HABITS_COMPLETED', targetValue: 50, rewardLinhThach: 0, titleToEquip: '🔄 Thói Quen Tiên Gia' },
  { id: 'ach_spe_3', category: 'SPECIAL', title: 'Mật Thất Ký Lục', description: 'Khởi tạo 5 Ghi Chú Cấm Thuật bí mật', icon: '📜', targetType: 'NOTES_COUNT', targetValue: 5, rewardLinhThach: 0, titleToEquip: '📜 Mật Thất Ký Lục' },
  { id: 'ach_spe_4', category: 'SPECIAL', title: 'Càn Khôn Quy Hoạch', description: 'Thiết lập 10 Khung Thời Gian Schedule trên Lịch', icon: '⏳', targetType: 'TIMEBLOCKS_COUNT', targetValue: 10, rewardLinhThach: 0, titleToEquip: '⏳ Càn Khôn Quy Hoạch' },
  { id: 'ach_spe_5', category: 'SPECIAL', title: 'Công Pháp Tu Luyện', description: 'Tạo và lĩnh hội 3 Bí Kíp Công Pháp', icon: '📖', targetType: 'MANUALS_COUNT', targetValue: 3, rewardLinhThach: 0, titleToEquip: '📖 Công Pháp Tu Luyện' },
  { id: 'ach_spe_6', category: 'SPECIAL', title: 'Tông Môn Đạo Tâm', description: 'Mở khóa đạt mốc 10 Huy Hiệu Đạo Tâm', icon: '🎖️', targetType: 'ACHIEVEMENTS_COUNT', targetValue: 10, rewardLinhThach: 0, titleToEquip: '🎖️ Tông Môn Đạo Tâm' },
  { id: 'ach_spe_7', category: 'SPECIAL', title: 'Bách Chiến Thắng Lợi', description: 'Mở khóa đạt mốc 25 Huy Hiệu Đạo Tâm', icon: '🏆', targetType: 'ACHIEVEMENTS_COUNT', targetValue: 25, rewardLinhThach: 0, titleToEquip: '🏆 Bách Chiến Thắng Lợi' },
  { id: 'ach_spe_8', category: 'SPECIAL', title: 'Tiên Gia Tụ Hội', description: 'Mở khóa đạt mốc 50 Huy Hiệu Đạo Tâm', icon: '🌟', targetType: 'ACHIEVEMENTS_COUNT', targetValue: 50, rewardLinhThach: 0, titleToEquip: '🌟 Tiên Gia Tụ Hội' },
  { id: 'ach_spe_9', category: 'SPECIAL', title: 'Vô Song Tông Chủ', description: 'Mở khóa đạt mốc 70 Huy Hiệu Đạo Tâm', icon: '👑', targetType: 'ACHIEVEMENTS_COUNT', targetValue: 70, rewardLinhThach: 0, titleToEquip: '👑 Vô Song Tông Chủ' },
  { id: 'ach_spe_10', category: 'SPECIAL', title: 'Vạn Giới Chí Tôn', description: 'Mở khóa toàn bộ mốc 80 Huy Hiệu Đạo Tâm', icon: '🌌', targetType: 'ACHIEVEMENTS_COUNT', targetValue: 80, rewardLinhThach: 0, titleToEquip: '🌌 Vạn Giới Chí Tôn' }
];

export interface RealmInfo {
  name: string;
  subName: string;
  fullName: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  xpNeeded: number;
  bottleneck?: BottleneckRequirement;
}

export const getRealmInfo = (level: number): RealmInfo => {
  const safeLvl = Math.max(1, Math.min(level, 100));
  let name = 'Ngưng Khí Kỳ';
  let subName = `Tầng ${safeLvl}`;
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-950/60';
  let borderClass = 'border-slate-800';

  if (safeLvl <= 15) {
    name = 'Ngưng Khí Kỳ';
    subName = `Tầng ${safeLvl}`;
    colorClass = 'text-slate-300';
    bgClass = 'bg-slate-950/80';
    borderClass = 'border-slate-800';
  } else if (safeLvl <= 19) {
    name = 'Trúc Cơ Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 16];
    colorClass = 'text-blue-400';
    bgClass = 'bg-blue-950/30';
    borderClass = 'border-blue-900/50';
  } else if (safeLvl <= 23) {
    name = 'Kết Đan Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 20];
    colorClass = 'text-emerald-400';
    bgClass = 'bg-emerald-950/30';
    borderClass = 'border-emerald-900/50';
  } else if (safeLvl <= 27) {
    name = 'Nguyên Anh Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 24];
    colorClass = 'text-purple-400';
    bgClass = 'bg-purple-950/30';
    borderClass = 'border-purple-900/50';
  } else if (safeLvl <= 31) {
    name = 'Hóa Thần Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 28];
    colorClass = 'text-amber-400';
    bgClass = 'bg-amber-950/30';
    borderClass = 'border-amber-900/50';
  } else if (safeLvl <= 35) {
    name = 'Anh Biến Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 32];
    colorClass = 'text-orange-400';
    bgClass = 'bg-orange-950/30';
    borderClass = 'border-orange-900/50';
  } else if (safeLvl <= 39) {
    name = 'Vấn Đỉnh Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 36];
    colorClass = 'text-rose-400';
    bgClass = 'bg-rose-950/30';
    borderClass = 'border-rose-900/50';
  } else if (safeLvl <= 41) {
    name = 'Cảnh Giới Quá Độ';
    subName = safeLvl === 40 ? 'Âm Hư Cảnh' : 'Dương Thực Cảnh';
    colorClass = 'text-pink-400';
    bgClass = 'bg-pink-950/30';
    borderClass = 'border-pink-900/50';
  } else if (safeLvl <= 45) {
    name = 'Khuy Niết Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 42];
    colorClass = 'text-cyan-400';
    bgClass = 'bg-cyan-950/30';
    borderClass = 'border-cyan-900/50';
  } else if (safeLvl <= 49) {
    name = 'Tịnh Niết Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 46];
    colorClass = 'text-sky-400';
    bgClass = 'bg-sky-950/30';
    borderClass = 'border-sky-900/50';
  } else if (safeLvl <= 53) {
    name = 'Toái Niết Kỳ';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 50];
    colorClass = 'text-indigo-400';
    bgClass = 'bg-indigo-950/30';
    borderClass = 'border-indigo-900/50';
  } else if (safeLvl <= 58) {
    name = 'Thiên Nhân Ngũ Suy';
    const stages = ['Đệ Nhất Suy', 'Đệ Nhị Suy', 'Đệ Tam Suy', 'Đệ Tứ Suy', 'Đệ Ngũ Suy'];
    subName = stages[safeLvl - 54];
    colorClass = 'text-violet-400';
    bgClass = 'bg-violet-950/40';
    borderClass = 'border-violet-800/60';
  } else if (safeLvl <= 62) {
    name = 'Không Niết Cảnh';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 59];
    colorClass = 'text-fuchsia-400';
    bgClass = 'bg-fuchsia-950/40';
    borderClass = 'border-fuchsia-800/60';
  } else if (safeLvl <= 66) {
    name = 'Không Linh Cảnh';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 63];
    colorClass = 'text-teal-300';
    bgClass = 'bg-teal-950/40';
    borderClass = 'border-teal-800/60';
  } else if (safeLvl <= 70) {
    name = 'Không Huyền Cảnh';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
    subName = stages[safeLvl - 67];
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-950/40';
    borderClass = 'border-yellow-800/60';
  } else if (safeLvl <= 79) {
    name = 'Huyền Kiếp Cảnh (9 Kiếp)';
    const kieps = [
      'Ngoại Kiếp - Tuyết Kiếp',
      'Ngoại Kiếp - Phong Kiếp',
      'Ngoại Kiếp - Lôi Kiếp',
      'Nội Kiếp - Trảm Ly Kiếp',
      'Nội Kiếp - Huyết Ảnh Kiếp',
      'Nội Kiếp - Tử Sinh Kiếp',
      'Hồn Kiếp - Thập Tức Khô Thần Kiếp',
      'Hồn Kiếp - Hồn Thọ Kiếp',
      'Hồn Kiếp - Luân Hồi Kiếp'
    ];
    subName = kieps[safeLvl - 71];
    colorClass = 'text-red-400';
    bgClass = 'bg-red-950/40';
    borderClass = 'border-red-800/60';
  } else if (safeLvl <= 85) {
    name = 'Không Kiếp Cảnh (Đại Tôn)';
    const stages = [
      'Sơ Kỳ',
      'Trung Kỳ',
      'Kim Tôn (Hậu Kỳ Đỉnh Phong)',
      'Thiên Tôn (Viên Mãn)',
      'Dược Thiên Tôn (Bán Bước Đại Thiên Tôn)',
      'Đại Thiên Tôn (Ngưng Tụ Thiên Tôn Chi Dương)'
    ];
    subName = stages[safeLvl - 80];
    colorClass = 'text-amber-300';
    bgClass = 'bg-amber-950/50';
    borderClass = 'border-amber-600/70';
  } else if (safeLvl <= 94) {
    name = 'Bán Bộ Đạp Thiên';
    const caus = [
      'Đệ Nhất Cầu: Dung Nhập Quy Tắc',
      'Đệ Nhị Cầu: Đạp Thiên Nhãn',
      'Đệ Tam Cầu: Vấn Đạo Tâm',
      'Đệ Tứ Cầu: Thấu Hiểu Luân Hồi',
      'Đệ Ngũ Cầu: Chân Ngụy Thiên Địa',
      'Đệ Lục Cầu: Thái Cổ Thần Minh',
      'Đệ Thất Cầu: Hóa Thân Quy Tắc',
      'Đệ Bát Cầu: Đạo Cực Đàn Điền',
      'Đệ Cửu Cầu: Đội Đầu Siêu Thoát'
    ];
    subName = caus[safeLvl - 86];
    colorClass = 'text-emerald-300';
    bgClass = 'bg-emerald-950/50';
    borderClass = 'border-emerald-500/70';
  } else {
    name = 'Đạp Thiên Cảnh';
    const stages = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn', 'Đạp Thiên Chi Đỉnh', 'Siêu Thoát Vạn Giới - Vương Lâm Đạo Tổ'];
    subName = stages[Math.min(safeLvl - 95, stages.length - 1)];
    colorClass = 'text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]';
    bgClass = 'bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-amber-950/80';
    borderClass = 'border-amber-400';
  }

  const xpNeeded = Math.round(100 * Math.pow(1.06, safeLvl - 1));

  let bottleneck: BottleneckRequirement | undefined = undefined;

  if (safeLvl === 15) {
    bottleneck = {
      title: 'Bình Cảnh Trúc Cơ',
      minMeditationMinutes: 45,
      minCompletedTasks: 3,
      requiredItemId: 'truc_co_dan',
      requiredItemName: 'Trúc Cơ Đan'
    };
  } else if (safeLvl === 19) {
    bottleneck = {
      title: 'Bình Cảnh Kết Đan',
      minMeditationMinutes: 60,
      minCompletedTasks: 5,
      requiredItemId: 'ket_dan_hoan',
      requiredItemName: 'Kết Đan Hoàn'
    };
  } else if (safeLvl === 23) {
    bottleneck = {
      title: 'Bình Cảnh Nguyên Anh',
      minMeditationMinutes: 90,
      minCompletedTasks: 8,
      requiredItemId: 'nguyen_anh_dan',
      requiredItemName: 'Nguyên Anh Đan'
    };
  } else if (safeLvl === 31) {
    bottleneck = {
      title: 'Bình Cảnh Anh Biến',
      minMeditationMinutes: 120,
      minCompletedTasks: 10,
      requiredItemId: 'do_kiep_phu',
      requiredItemName: 'Độ Kiếp Phù'
    };
  } else if (safeLvl === 53) {
    bottleneck = {
      title: 'Bình Cảnh Thiên Nhân Ngũ Suy',
      minMeditationMinutes: 150,
      minCompletedTasks: 15,
      requiredItemId: 'do_kiep_phu',
      requiredItemName: 'Độ Kiếp Phù'
    };
  } else if (safeLvl === 70) {
    bottleneck = {
      title: 'Bình Cảnh 9 Kiếp Huyền Kiếp',
      minMeditationMinutes: 200,
      minCompletedTasks: 20,
      requiredItemId: 'do_kiep_phu',
      requiredItemName: 'Độ Kiếp Phù'
    };
  } else if (safeLvl === 85) {
    bottleneck = {
      title: 'Bình Cảnh Đạp Thiên Kiều',
      minMeditationMinutes: 300,
      minCompletedTasks: 30,
      requiredItemId: 'do_kiep_phu',
      requiredItemName: 'Độ Kiếp Phù'
    };
  }

  return {
    name,
    subName,
    fullName: `${name} (${subName})`,
    colorClass,
    bgClass,
    borderClass,
    xpNeeded,
    bottleneck
  };
};

export interface SeedInfo {
  id: string;
  name: string;
  rarity: 'SO_CAP' | 'TRUNG_CAP' | 'CAO_CAP' | 'THAN_CAP';
  icon: string;
  description: string;
  color: string;
}

export const SPIRITUAL_SEEDS: SeedInfo[] = [
  {
    id: 'ngoc_linh_chi',
    name: 'Ngọc Linh Chi',
    rarity: 'SO_CAP',
    icon: '🍄',
    description: 'Linh chi hấp thụ nguyệt quang, ôn nhu dưỡng thần.',
    color: 'text-slate-300 border-slate-700/60 shadow-[0_0_15px_rgba(148,163,184,0.15)] bg-slate-950/80 hover:bg-slate-900/60'
  },
  {
    id: 'cuu_diep_thao',
    name: 'Cửu Diệp Thảo',
    rarity: 'SO_CAP',
    icon: '🌿',
    description: 'Cỏ linh thảo chín lá lấp lánh linh lực, thanh lọc tạp niệm.',
    color: 'text-emerald-400 border-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/20 hover:bg-emerald-950/30'
  },
  {
    id: 'ngo_dao_tra',
    name: 'Ngộ Đạo Trà',
    rarity: 'TRUNG_CAP',
    icon: '🍵',
    description: 'Lá trà thượng thặng khai thông kinh mạch, thăng hoa ngộ đạo.',
    color: 'text-teal-400 border-teal-900/40 shadow-[0_0_15px_rgba(20,184,166,0.2)] bg-teal-950/20 hover:bg-teal-950/30'
  },
  {
    id: 'phuong_hoang_hoa',
    name: 'Phượng Hoàng Hoa',
    rarity: 'TRUNG_CAP',
    icon: '🌸',
    description: 'Đóa hoa rực rỡ như phượng hoàng niết bàn, tái sinh tiên lực.',
    color: 'text-rose-400 border-rose-900/40 shadow-[0_0_15px_rgba(244,63,94,0.2)] bg-rose-950/20 hover:bg-rose-950/30'
  },
  {
    id: 'tuyet_lien',
    name: 'Vạn Niên Tuyết Liên',
    rarity: 'CAO_CAP',
    icon: '❄️',
    description: 'Bông sen tuyết vạn năm trên đỉnh núi cực hàn thanh khiết.',
    color: 'text-blue-400 border-blue-900/50 shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-blue-950/30 hover:bg-blue-950/40'
  },
  {
    id: 'hoa_long_qua',
    name: 'Hỏa Long Quả',
    rarity: 'CAO_CAP',
    icon: '🔥',
    description: 'Dược quả mang sức mạnh chân hỏa rồng, đột phá tu vi cực đại.',
    color: 'text-orange-400 border-orange-900/50 shadow-[0_0_20px_rgba(249,115,22,0.25)] bg-orange-950/30 hover:bg-orange-950/40'
  },
  {
    id: 'ngu_sac_linh_truc',
    name: 'Ngũ Sắc Linh Trúc',
    rarity: 'THAN_CAP',
    icon: '🎋',
    description: 'Tre thần năm sắc hấp thụ tiên khí đất trời trăm năm.',
    color: 'text-purple-400 border-purple-900/60 shadow-[0_0_25px_rgba(168,85,247,0.3)] bg-purple-950/40 hover:bg-purple-950/50'
  },
  {
    id: 'hon_don_dao_qua',
    name: 'Hỗn Độn Đạo Quả',
    rarity: 'THAN_CAP',
    icon: '🌌',
    description: 'Linh quả từ buổi sơ khai vũ trụ ngưng tụ đạo luật thiên địa.',
    color: 'text-amber-400 border-amber-900/60 shadow-[0_0_25px_rgba(245,158,11,0.35)] bg-amber-950/40 hover:bg-amber-950/50 animate-pulse'
  },
  {
    id: 'bach_ngoc_lien',
    name: 'Bạch Ngọc Liên',
    rarity: 'SO_CAP',
    icon: '🪷',
    description: 'Sen trắng tinh khiết nở trên mặt nước linh hồ, tâm thanh khí tĩnh.',
    color: 'text-pink-300 border-pink-900/40 shadow-[0_0_15px_rgba(244,114,182,0.15)] bg-pink-950/20 hover:bg-pink-950/30'
  },
  {
    id: 'thanh_long_thao',
    name: 'Thanh Long Thảo',
    rarity: 'SO_CAP',
    icon: '🌵',
    description: 'Loài thảo vật hình rồng xanh kỳ lạ, hấp thụ địa khí dưỡng thân.',
    color: 'text-green-400 border-green-900/40 shadow-[0_0_15px_rgba(74,222,128,0.15)] bg-green-950/20 hover:bg-green-950/30'
  },
  {
    id: 'thien_loi_truc',
    name: 'Thiên Lôi Trúc',
    rarity: 'TRUNG_CAP',
    icon: '⚡',
    description: 'Tre thần bị lôi đình đánh trúc, ngưng tụ sấm điện thiên nhiên.',
    color: 'text-yellow-400 border-yellow-900/40 shadow-[0_0_15px_rgba(250,204,21,0.2)] bg-yellow-950/20 hover:bg-yellow-950/30'
  },
  {
    id: 'am_duong_hoa',
    name: 'Âm Dương Hoa',
    rarity: 'TRUNG_CAP',
    icon: '☯️',
    description: 'Đóa hoa nửa tối nửa sáng, cân bằng âm dương ngũ hành nội thể.',
    color: 'text-slate-300 border-slate-600/50 shadow-[0_0_15px_rgba(148,163,184,0.2)] bg-slate-900/30 hover:bg-slate-900/40'
  },
  {
    id: 'thai_cuc_qua',
    name: 'Thái Cực Quả',
    rarity: 'CAO_CAP',
    icon: '🔮',
    description: 'Linh quả hình cầu phát sáng ngũ sắc, hiện thân của thái cực huyền lý.',
    color: 'text-violet-400 border-violet-900/50 shadow-[0_0_20px_rgba(139,92,246,0.25)] bg-violet-950/30 hover:bg-violet-950/40'
  },
  {
    id: 'cuu_long_thao',
    name: 'Cửu Long Thảo',
    rarity: 'CAO_CAP',
    icon: '🐉',
    description: 'Thảo dược chín rồng vờn, mang long khí ngàn năm tích tụ.',
    color: 'text-red-400 border-red-900/50 shadow-[0_0_20px_rgba(248,113,113,0.25)] bg-red-950/30 hover:bg-red-950/40'
  },
  {
    id: 'vo_cuc_dao_qua',
    name: 'Vô Cực Đạo Quả',
    rarity: 'THAN_CAP',
    icon: '✨',
    description: 'Đạo quả vô cực siêu việt cả âm dương, đạt đến cảnh giới vô thượng đại đạo.',
    color: 'text-white border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.4)] bg-white/5 hover:bg-white/10 animate-pulse'
  }
];
