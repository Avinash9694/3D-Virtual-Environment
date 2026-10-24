// Re-runs the asset pipeline from the raw sources kept outside the repo.
// Usage: node scripts/optimize-assets.mjs <raw-dir>
// Expects <raw-dir>/scene1.gltf and <raw-dir>/avatars/{RobotExpressive,Soldier,Xbot}.glb
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const rawDir = process.argv[2];
if (!rawDir) {
  console.error('usage: node scripts/optimize-assets.mjs <raw-dir>');
  process.exit(1);
}

const jobs = [
  { from: 'scene1.gltf', to: 'public/models/scene.glb', simplify: true },
  { from: 'avatars/RobotExpressive.glb', to: 'public/models/avatars/RobotExpressive.glb' },
  { from: 'avatars/Soldier.glb', to: 'public/models/avatars/Soldier.glb' },
  { from: 'avatars/Xbot.glb', to: 'public/models/avatars/Xbot.glb' },
];

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

for (const job of jobs) {
  const input = resolve(rawDir, job.from);
  const output = resolve(job.to);
  if (!existsSync(input)) {
    console.warn(`skip ${job.from}: not found`);
    continue;
  }
  mkdirSync(resolve(output, '..'), { recursive: true });
  const args = [
    '-y',
    '@gltf-transform/cli@4',
    'optimize',
    input,
    output,
    '--compress',
    'meshopt',
    '--texture-compress',
    'webp',
    '--texture-size',
    '1024',
  ];
  // Skinned characters lose silhouette under simplification; only the static scene gets it.
  if (!job.simplify) args.push('--no-simplify');
  execFileSync('npx', args, { stdio: 'inherit' });
  console.log(`${job.from}: ${mb(statSync(input).size)} -> ${mb(statSync(output).size)}`);
}
