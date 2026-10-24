export interface AvatarDefinition {
  id: string;
  name: string;
  description: string;
  tags: readonly string[];
  file: string;
  /** Height in metres the model is normalised to. */
  height: number;
  /** Yaw added so the model's authored forward matches +Z. */
  facingOffset: number;
  /** Brand colour used by the picker card. */
  accent: string;
}

export const AVATARS: readonly AvatarDefinition[] = [
  {
    id: 'robot',
    name: 'Unit-7',
    description: 'An expressive little robot with a bouncy walk. Fast to load and happy on phones.',
    tags: ['Lightweight', 'Jump animation'],
    file: 'models/avatars/RobotExpressive.glb',
    height: 1.85,
    facingOffset: 0,
    accent: '#f0b84a',
  },
  {
    id: 'soldier',
    name: 'Ranger',
    description: 'A rigged human character with weighty idle, walk and run cycles.',
    tags: ['Realistic rig', 'Textured'],
    file: 'models/avatars/Soldier.glb',
    height: 1.8,
    facingOffset: Math.PI,
    accent: '#5aa9e6',
  },
  {
    id: 'xbot',
    name: 'X-Bot',
    description:
      'A sleek mannequin rig from the three.js examples. Clean silhouette, smooth blends.',
    tags: ['Mannequin', 'Smooth blends'],
    file: 'models/avatars/Xbot.glb',
    height: 1.8,
    facingOffset: 0,
    accent: '#8bd17c',
  },
];

export const DEFAULT_AVATAR_ID = 'robot';

export function findAvatar(id: string | null | undefined): AvatarDefinition | undefined {
  if (!id) return undefined;
  return AVATARS.find((a) => a.id === id);
}
