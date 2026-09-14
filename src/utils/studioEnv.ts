import * as THREE from 'three';

/**
 * Generates an equirectangular studio environment map on an offscreen canvas
 * with overhead softboxes and subtle horizon gradient for metallic reflections.
 */
export function createStudioEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.Color(0xf0f3f6);
    const texture = new THREE.DataTexture(new Uint8Array([240, 243, 246, 255]), 1, 1);
    texture.needsUpdate = true;
    return texture;
  }

  // Background gradient: neutral studio dome
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#f8fafc'); // Zenith (bright)
  bgGrad.addColorStop(0.4, '#e2e8f0'); // Upper mid
  bgGrad.addColorStop(0.5, '#cbd5e1'); // Horizon
  bgGrad.addColorStop(0.6, '#94a3b8'); // Lower mid
  bgGrad.addColorStop(1, '#64748b'); // Nadir
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Softbox 1: Main key overhead rectangular light
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(width * 0.25, height * 0.12, width * 0.35, height * 0.22, 16);
  ctx.fill();
  ctx.restore();

  // Softbox 2: Secondary rim light softbox
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(width * 0.7, height * 0.16, width * 0.22, height * 0.18, 12);
  ctx.fill();
  ctx.restore();

  // Subtle blue-tinted bounce light near nadir for realistic color bleed from the pins
  const bounceGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.85,
    10,
    width * 0.5,
    height * 0.85,
    width * 0.35
  );
  bounceGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
  bounceGrad.addColorStop(0.5, 'rgba(3, 105, 161, 0.3)');
  bounceGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
  ctx.fillStyle = bounceGrad;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}
