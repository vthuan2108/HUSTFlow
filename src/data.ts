/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreItem, WeeklyChallenge } from './types';

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

export interface RealmInfo {
  name: string;
  subName: string;
  fullName: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  xpNeeded: number;
}

export const getRealmInfo = (level: number): RealmInfo => {
  const realms = [
    { name: 'Luyện Khí Kỳ', color: 'text-slate-400', bg: 'bg-slate-950/60', border: 'border-slate-800' },      // levels 1-9
    { name: 'Trúc Cơ Kỳ', color: 'text-blue-400', bg: 'bg-blue-950/20', border: 'border-blue-900/50' },       // levels 10-18
    { name: 'Kim Đan Kỳ', color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-900/50' }, // levels 19-27
    { name: 'Nguyên Anh Kỳ', color: 'text-purple-400', bg: 'bg-purple-950/20', border: 'border-purple-900/50' }, // levels 28-36
    { name: 'Hóa Thần Kỳ', color: 'text-amber-400', bg: 'bg-amber-950/20', border: 'border-amber-900/50' },   // levels 37-45
    { name: 'Luyện Hư Kỳ', color: 'text-rose-400', bg: 'bg-rose-950/20', border: 'border-rose-900/50' }        // levels 46-54
  ];

  const realmIndex = Math.min(Math.floor((level - 1) / 9), realms.length - 1);
  const currentRealm = realms[realmIndex];
  const stage = ((level - 1) % 9) + 1;
  const stageWords = ['Sơ Kỳ - Tầng 1', 'Sơ Kỳ - Tầng 2', 'Sơ Kỳ - Tầng 3', 'Trung Kỳ - Tầng 4', 'Trung Kỳ - Tầng 5', 'Trung Kỳ - Tầng 6', 'Hậu Kỳ - Tầng 7', 'Hậu Kỳ - Tầng 8', 'Đại Viên Mãn'];
  const subName = stageWords[stage - 1];

  // Base XP formula: increases with level
  // lvl 1 needs 100 XP, lvl 50 needs around 5000 XP
  const xpNeeded = Math.round(100 * Math.pow(1.08, level - 1));

  return {
    name: currentRealm.name,
    subName,
    fullName: `${currentRealm.name} (${subName})`,
    colorClass: currentRealm.color,
    bgClass: currentRealm.bg,
    borderClass: currentRealm.border,
    xpNeeded
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
