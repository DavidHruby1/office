import * as THREE from 'three'

/** Procedural textures drawn on canvases at start-up – no external image assets are needed. */

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function finish(c: HTMLCanvasElement, sizeM: [number, number], srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  // geometry UVs are in metres → repeat converts them to texture space
  t.repeat.set(1 / sizeM[0], 1 / sizeM[1])
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, r: () => number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount
    d[i] += n; d[i + 1] += n; d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

export interface WoodOpts {
  base: string
  dark: string
  light: string
  /** 0…1 strength of the grain lines */
  contrast?: number
  knots?: number
  cracks?: number
  seed?: number
}

/** Draws wood grain running along the canvas Y axis into the rect. */
function drawGrain(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, o: WoodOpts, r: () => number) {
  const contrast = o.contrast ?? 0.5
  ctx.save()
  ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip()
  ctx.fillStyle = o.base
  ctx.fillRect(x0, y0, w, h)
  // broad tonal bands
  for (let i = 0; i < 10; i++) {
    const bx = x0 + r() * w
    const bw = 10 + r() * w * 0.22
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0)
    const col = r() > 0.5 ? o.dark : o.light
    g.addColorStop(0, 'transparent'); g.addColorStop(0.5, col); g.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.07 + r() * 0.14 * contrast
    ctx.fillStyle = g
    ctx.fillRect(bx, y0, bw, h)
  }
  // fine grain lines with a periodic wobble (tiles vertically)
  const lines = Math.round(w * 0.3)
  for (let i = 0; i < lines; i++) {
    const lx = x0 + r() * w
    const amp = 1 + r() * 5
    const k = 1 + Math.floor(r() * 3)
    const ph = r() * 6.28
    ctx.beginPath()
    for (let y = 0; y <= h; y += 16) {
      const xx = lx + Math.sin((y / h) * Math.PI * 2 * k + ph) * amp
      if (y === 0) ctx.moveTo(xx, y0 + y); else ctx.lineTo(xx, y0 + y)
    }
    ctx.strokeStyle = r() > 0.35 ? o.dark : o.light
    ctx.globalAlpha = (0.03 + r() * 0.13) * contrast
    ctx.lineWidth = 0.5 + r() * 2.6
    ctx.stroke()
  }
  // knots
  for (let i = 0; i < (o.knots ?? 0); i++) {
    const kx = x0 + r() * w, ky = y0 + r() * h
    const rx = 4 + r() * 9, ry = rx * (1.6 + r())
    for (let j = 5; j >= 1; j--) {
      ctx.beginPath()
      ctx.ellipse(kx, ky, (rx * j) / 2.2, (ry * j) / 2.2, 0, 0, Math.PI * 2)
      ctx.strokeStyle = o.dark
      ctx.globalAlpha = 0.1 + 0.1 * contrast
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
    ctx.beginPath(); ctx.ellipse(kx, ky, rx * 0.55, ry * 0.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#20140c'; ctx.globalAlpha = 0.55; ctx.fill()
  }
  // dark cracks (typical for "artisan oak" decor)
  for (let i = 0; i < (o.cracks ?? 0); i++) {
    const cx = x0 + r() * w, cy = y0 + r() * h, len = 20 + r() * 110
    ctx.beginPath(); ctx.moveTo(cx, cy)
    ctx.bezierCurveTo(cx + (r() - 0.5) * 8, cy + len * 0.3, cx + (r() - 0.5) * 8, cy + len * 0.6, cx + (r() - 0.5) * 6, cy + len)
    ctx.strokeStyle = '#1a120c'; ctx.globalAlpha = 0.35 + r() * 0.4; ctx.lineWidth = 0.8 + r() * 2.2; ctx.stroke()
  }
  ctx.restore()
}

/** Wood decor, 0.6 m × 1.2 m, grain along V. */
export function woodTexture(o: WoodOpts) {
  const [c, ctx] = canvas(512, 1024)
  const r = rng(o.seed ?? 1)
  drawGrain(ctx, 0, 0, 512, 1024, o, r)
  speckle(ctx, 512, 1024, 10, r)
  return finish(c, [0.6, 1.2])
}

/** 3-strip laminate: planks of three 6.4 cm strips running along U. Covers 2.56 m × 1.536 m. */
export function floorTexture() {
  const W = 1024, H = 1024
  const [c, ctx] = canvas(W, H)
  const r = rng(77)
  const rows = 24
  const rh = H / rows
  const tones = ['#c9a070', '#c49a69', '#cda677', '#c19664', '#cba272', '#c69d6c']
  for (let plank = 0; plank < rows / 3; plank++) {
    const y0 = plank * rh * 3
    let x = -r() * 400
    while (x < W) {
      const len = 380 + r() * 260 // ≈ 0.95 – 1.6 m boards
      ctx.fillStyle = tones[Math.floor(r() * tones.length)]
      ctx.fillRect(x, y0, len + 1, rh * 3 + 1)
      for (let i = 0; i < 26; i++) {
        const gy = y0 + r() * rh * 3
        ctx.strokeStyle = r() > 0.5 ? '#946835' : '#e3c08c'
        ctx.globalAlpha = 0.04 + r() * 0.1
        ctx.lineWidth = 0.6 + r() * 2.4
        ctx.beginPath(); ctx.moveTo(x, gy)
        ctx.bezierCurveTo(x + len * 0.3, gy + (r() - 0.5) * 7, x + len * 0.6, gy + (r() - 0.5) * 7, x + len, gy + (r() - 0.5) * 5)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#7d5a2c'
      ctx.fillRect(x, y0, 1.2, rh * 3)
      ctx.globalAlpha = 1
      x += len
    }
  }
  for (let row = 0; row < rows; row++) {
    ctx.globalAlpha = row % 3 === 0 ? 0.36 : 0.07
    ctx.fillStyle = '#74501f'
    ctx.fillRect(0, row * rh, W, row % 3 === 0 ? 1.5 : 1)
    ctx.globalAlpha = 1
  }
  speckle(ctx, W, H, 7, r)
  return finish(c, [2.56, 1.536])
}

/** Mottled mineral surface (concrete splashback, stone tiles). 1 m × 1 m. */
export function mottledTexture(base: string, blot: string[], seed = 5, size = 1) {
  const [c, ctx] = canvas(512, 512)
  const r = rng(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 240; i++) {
    const x = r() * 512, y = r() * 512, rad = 12 + r() * 70
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, blot[Math.floor(r() * blot.length)]); g.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.05 + r() * 0.12
    ctx.fillStyle = g
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
      if (x + ox + rad < 0 || x + ox - rad > 512 || y + oy + rad < 0 || y + oy - rad > 512) continue
      ctx.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2)
    }
  }
  ctx.globalAlpha = 1
  speckle(ctx, 512, 512, 16, r)
  return finish(c, [size, size])
}

/** Woven fabric – neutral grey so the material colour tints it. 0.2 m tile. */
export function fabricTexture(seed = 3) {
  const [c, ctx] = canvas(256, 256)
  const r = rng(seed)
  ctx.fillStyle = '#d8d8d8'
  ctx.fillRect(0, 0, 256, 256)
  for (let y = 0; y < 256; y += 2) for (let x = 0; x < 256; x += 2) {
    const v = Math.min(255, ((x / 2 + y / 2) % 2 === 0 ? 250 : 226) + (r() - 0.5) * 30)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(x, y, 2, 2)
  }
  return finish(c, [0.2, 0.2])
}

/** Height map: waffle/quilted squares for the sofa throw. 0.24 m tile (6 squares). */
export function waffleBump() {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#9a9a9a'
  ctx.fillRect(0, 0, 256, 256)
  const n = 6, s = 256 / n
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const g = ctx.createRadialGradient((i + 0.5) * s, (j + 0.5) * s, 2, (i + 0.5) * s, (j + 0.5) * s, s * 0.72)
    g.addColorStop(0, '#f2f2f2'); g.addColorStop(1, '#202020')
    ctx.fillStyle = g
    ctx.fillRect(i * s, j * s, s, s)
  }
  return finish(c, [0.24, 0.24], false)
}

/** Fine random bump for plaster / terry cloth. */
export function noiseBump(seed = 9, sizeM = 0.5, blur = false) {
  const [c, ctx] = canvas(256, 256)
  const r = rng(seed)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)
  speckle(ctx, 256, 256, 150, r)
  if (blur) { ctx.filter = 'blur(1.2px)'; ctx.drawImage(c, 0, 0); ctx.filter = 'none' }
  return finish(c, [sizeM, sizeM], false)
}

/** Grey fabric with white polka dots (storage basket). */
export function dotsTexture() {
  const [c, ctx] = canvas(256, 256)
  ctx.fillStyle = '#a9a696'
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = '#f1efe8'
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    ctx.beginPath(); ctx.arc(i * 64 + (j % 2 ? 48 : 16), j * 64 + 32, 9, 0, Math.PI * 2); ctx.fill()
  }
  speckle(ctx, 256, 256, 14, rng(4))
  return finish(c, [0.22, 0.22])
}

/** Abstract black-and-white canvas motif (stand-in for the real picture). Mapped 0…1. */
export function paintingTexture() {
  const [c, ctx] = canvas(512, 384)
  const r = rng(21)
  ctx.fillStyle = '#17181a'
  ctx.fillRect(0, 0, 512, 384)
  const blob = (x: number, y: number, rx: number, ry: number, col: string, a: number, rot = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g.addColorStop(0, col); g.addColorStop(0.75, col); g.addColorStop(1, 'transparent')
    ctx.scale(rx, ry); ctx.globalAlpha = a; ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }
  // two stylised figures leaning towards each other
  blob(190, 300, 120, 130, '#d9d9d9', 0.85, -0.2)
  blob(205, 165, 62, 78, '#c9c9c9', 0.95, 0.25)
  blob(165, 130, 70, 60, '#2a2a2c', 0.95, 0.5)
  blob(330, 310, 150, 150, '#2e2f31', 1, 0.1)
  blob(300, 150, 66, 84, '#9d9d9d', 0.95, -0.2)
  blob(325, 95, 70, 48, '#1d1d1f', 1, -0.25)
  blob(262, 230, 34, 30, '#e6e6e6', 0.9)
  for (let i = 0; i < 40; i++) blob(r() * 512, r() * 384, 6 + r() * 40, 4 + r() * 20, r() > 0.5 ? '#ffffff' : '#000000', 0.05, r() * 3)
  ctx.globalAlpha = 1
  speckle(ctx, 512, 384, 22, r)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Simple text label rendered to a texture (appliance logos). */
export function labelTexture(text: string, color = '#222', font = '600 44px Arial, sans-serif', w = 256, h = 64) {
  const [c, ctx] = canvas(w, h)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2 + 2)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Vertical sky gradient seen through the windows. */
export function skyTexture(top: string, bottom: string) {
  const [c, ctx] = canvas(8, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, top); g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
