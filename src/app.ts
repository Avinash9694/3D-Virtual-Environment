import { PerspectiveCamera, Vector3 } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import {
  AVATARS,
  DEFAULT_AVATAR_ID,
  findAvatar,
  type AvatarDefinition,
} from './avatar/avatar-catalog';
import { createAvatar, type Avatar } from './avatar/avatar';
import type { LocomotionSample } from './avatar/animation-state';
import { createCameraRig, type CameraRig } from './controls/camera-rig';
import {
  createCharacterController,
  type CharacterController,
  type CharacterFrame,
} from './controls/character-controller';
import type { StickVector } from './controls/joystick';
import { createKeyboardInput } from './controls/keyboard';
import { ZERO_INPUT, type MoveInput } from './controls/movement';
import { createPointerOrbit, type OrbitDelta } from './controls/pointer-orbit';
import { createAssetLoader } from './engine/assets';
import { createLoop } from './engine/loop';
import { applyQuality, createRenderer, resizeRendererToDisplaySize } from './engine/renderer';
import { createAvatarSelect } from './ui/avatar-select';
import { el } from './ui/dom';
import { createHud } from './ui/hud';
import { createLoadingScreen } from './ui/loading-screen';
import { createSettingsPanel } from './ui/settings-panel';
import {
  createSettingsStore,
  QUALITY_PRESETS,
  safeLocalStorage,
  type Settings,
} from './ui/settings-store';
import { applyTheme, resolveTheme } from './ui/theme';
import { createTouchControls, isCoarsePointer } from './ui/touch-controls';
import { createPreviewStage } from './world/preview-stage';
import { createWorld } from './world/world';

const SPAWN = new Vector3(0, 0, 2);
const SCENE_FILE = 'models/scene.glb';
const IDLE_SAMPLE: LocomotionSample = { speed: 0, grounded: true };
const HINT_DISMISS_DISTANCE = 4;

type Mode = 'select' | 'world';

export async function startApp(root: HTMLElement): Promise<void> {
  const store = createSettingsStore(safeLocalStorage());
  applyTheme(store.get().theme);

  const canvas = el('canvas', { className: 'stage', 'aria-label': '3D world', role: 'img' });
  root.append(canvas);
  const renderer = createRenderer({
    canvas,
    quality: store.get().quality,
    shadows: store.get().shadows,
  });

  const loading = createLoadingScreen();
  root.append(loading.element);
  const assets = createAssetLoader();
  assets.onProgress((snapshot, label) => loading.setProgress(snapshot, label));

  let sceneGltf: GLTF;
  let avatarGltfs: GLTF[];
  try {
    [sceneGltf, ...avatarGltfs] = await Promise.all([
      assets.loadGltf(SCENE_FILE, 'plaza landmark'),
      ...AVATARS.map((a) => assets.loadGltf(a.file, a.name)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    loading.showError(message, () => window.location.reload());
    return;
  }

  const preset = QUALITY_PRESETS[store.get().quality];
  const world = createWorld(preset.shadowMapSize, preset.anisotropy);
  world.addLandmark(sceneGltf);

  const avatars = new Map<string, Avatar>();
  AVATARS.forEach((definition: AvatarDefinition, index) => {
    const gltf = avatarGltfs[index];
    if (gltf) avatars.set(definition.id, createAvatar(definition, gltf));
  });

  const preview = createPreviewStage();
  preview.setBackground(resolveTheme(store.get().theme, prefersDark()) === 'dark');
  const camera = new PerspectiveCamera(50, 1, 0.1, 900);

  const keyboard = createKeyboardInput();
  const orbit = createPointerOrbit(canvas);
  const touch = createTouchControls();
  const coarse = isCoarsePointer();

  const settingsPanel = createSettingsPanel(store);
  const hud = createHud({
    onChangeAvatar: () => showSelect(activeAvatar?.definition.id ?? DEFAULT_AVATAR_ID),
    onOpenSettings: () => settingsPanel.open(),
  });
  hud.touchLayer.append(touch.element);
  hud.setHint(
    coarse
      ? 'Left stick to move · drag the right side to look · tap the arrow to jump'
      : 'WASD or arrows to move · Shift to run · Space to jump · drag to look · scroll to zoom',
  );

  const requestedId = new URLSearchParams(window.location.search).get('avatar');
  const initialId =
    (findAvatar(requestedId) ?? findAvatar(store.get().lastAvatar) ?? findAvatar(DEFAULT_AVATAR_ID))
      ?.id ?? DEFAULT_AVATAR_ID;

  const select = createAvatarSelect({
    avatars: AVATARS,
    initialId,
    onPreview: (id) => previewAvatar(id),
    onEnter: (id) => enterWorld(id),
  });
  root.append(select.element, hud.element, settingsPanel.element);

  let mode: Mode = 'select';
  let activeAvatar: Avatar | null = null;
  let controller: CharacterController | null = null;
  let rig: CameraRig | null = null;
  let hintDismissed = store.get().hintDismissed;

  const moveInput: MoveInput = { ...ZERO_INPUT };
  const orbitDelta: OrbitDelta = { yaw: 0, pitch: 0, zoom: 0 };
  const look: StickVector = { x: 0, y: 0 };
  const frame: CharacterFrame = { speed: 0, grounded: true, jumpStarted: false };

  function previewAvatar(id: string): void {
    const avatar = avatars.get(id);
    if (!avatar) return;
    if (activeAvatar && activeAvatar !== avatar) activeAvatar.reset();
    activeAvatar = avatar;
    avatar.reset();
    preview.setSubject(avatar.root);
  }

  function showSelect(id: string): void {
    mode = 'select';
    if (activeAvatar) world.scene.remove(activeAvatar.root);
    controller = null;
    rig = null;
    hud.hide();
    touch.hide();
    select.select(id);
    previewAvatar(id);
    select.show();
  }

  function enterWorld(id: string): void {
    const avatar = avatars.get(id);
    if (!avatar) return;
    preview.setSubject(null);
    avatar.reset();
    activeAvatar = avatar;
    world.scene.add(avatar.root);
    controller = createCharacterController({
      body: avatar.root,
      sampleGround: world.sampleGround,
      obstacles: world.obstacles,
      spawn: SPAWN,
    });
    rig = createCameraRig(camera, world.sampleGround);
    rig.snap(controller.position);
    world.lights.follow(controller.position);
    store.update({ lastAvatar: id });
    select.hide();
    hud.setAvatarName(avatar.definition.name);
    hud.show();
    if (coarse) touch.show();
    if (!hintDismissed) hud.showHint();
    mode = 'world';
    canvas.focus({ preventScroll: true });
  }

  function applySettings(settings: Settings, previous: Settings): void {
    if (settings.quality !== previous.quality) {
      applyQuality(renderer, settings.quality);
      world.lights.setShadowMapSize(QUALITY_PRESETS[settings.quality].shadowMapSize);
    }
    if (settings.shadows !== previous.shadows) {
      renderer.shadowMap.enabled = settings.shadows;
      world.lights.sun.castShadow = settings.shadows;
      world.scene.traverse((obj) => {
        const material = (
          obj as { material?: { needsUpdate: boolean } | { needsUpdate: boolean }[] }
        ).material;
        if (Array.isArray(material)) material.forEach((m) => (m.needsUpdate = true));
        else if (material) material.needsUpdate = true;
      });
    }
    if (settings.theme !== previous.theme) {
      applyTheme(settings.theme);
      preview.setBackground(resolveTheme(settings.theme, prefersDark()) === 'dark');
    }
  }
  store.subscribe(applySettings);

  const loop = createLoop((dt, elapsed) => {
    if (resizeRendererToDisplaySize(renderer) || camera.aspect === 1) {
      camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      camera.updateProjectionMatrix();
    }

    if (mode === 'select') {
      activeAvatar?.update(dt, IDLE_SAMPLE);
      preview.update(dt, elapsed, camera.aspect, panelSide());
      renderer.render(preview.scene, preview.camera);
      return;
    }

    if (!controller || !rig || !activeAvatar) return;

    keyboard.read(moveInput);
    if (touch.input.forward !== 0 || touch.input.right !== 0) {
      moveInput.forward = touch.input.forward;
      moveInput.right = touch.input.right;
    }
    moveInput.run = moveInput.run || touch.input.run;
    const jump = keyboard.consumeJump() || touch.consumeJump();

    touch.consumeLook(look);
    if (look.x !== 0 || look.y !== 0) orbit.addDrag(look.x, look.y);
    orbit.consume(orbitDelta);

    controller.update(dt, moveInput, jump, rig.orbit.yaw, frame);
    activeAvatar.update(dt, frame);
    rig.update(dt, controller.position, orbitDelta);
    world.lights.follow(controller.position);

    if (!hintDismissed && controller.position.distanceTo(SPAWN) > HINT_DISMISS_DISTANCE) {
      hintDismissed = true;
      hud.dismissHint();
      store.update({ hintDismissed: true });
    }

    renderer.render(world.scene, camera);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else loop.start();
  });

  loading.hide();
  if (findAvatar(requestedId)) {
    previewAvatar(initialId);
    enterWorld(initialId);
  } else {
    showSelect(initialId);
  }
  loop.start();
}

function panelSide(): 'left' | 'bottom' {
  return window.innerWidth >= 900 ? 'left' : 'bottom';
}

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true;
  }
}
