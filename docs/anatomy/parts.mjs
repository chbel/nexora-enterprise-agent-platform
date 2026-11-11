// Geometry for the underwriting bench. Every function takes the projection P and returns SVG text.
// The same file is used by build.mjs (first frame) and inlined into the page (live frames).
import * as k from "./kit/iso-kit.mjs";

export const W = {
  PLATE: { x: -216, y: -100, w: 436, d: 180, r: 9 },
  PLATE_H: 12,
  FOOT_H: 5,
  YM: -30, // main belt
  YL: 14, // return lane
  BM: { x0: -208, x1: 170, w: 20 },
  BL: { x0: -44, x1: 48, w: 20 },
  CARD: { w: 24, d: 15 },
  GAUGE: { cx: 34, cy: -76, R: 15, z: 14, h: 7, label: "critic" },
  A0: -0.75 * Math.PI,
  SPAN: 1.5 * Math.PI,
  TOOLS: [
    { x: -62, y: -92, label: "sql" },
    { x: -34, y: -92, label: "docs" },
    { x: -6, y: -92, label: "notify" },
  ],
  TRAY: { x: 128, y: -42, w: 44, d: 26, r: 2 },
};

const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const at = (P, p) => k.iso(p, P);
const opaque = (svg, op) => (op >= 0.999 ? svg : `<g opacity="${Math.max(0, op).toFixed(3)}">${svg}</g>`);

export function plate(P) {
  const { PLATE, PLATE_H, FOOT_H } = W;
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 22), [0, PLATE.y + 22], [0, PLATE.y + PLATE.d - 22]];
  for (const [x, y] of [...feet].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const corner = k.corners(PLATE, 10);
  out.push(L(corner.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(corner.map(([x, y]) => at(P, [x, y, 0])), { size: 0.5 }));
  return out.join("");
}

export function belt(P, y, b) {
  const out = [];
  const plan = { x: b.x0, y: y - b.w / 2, w: b.x1 - b.x0, d: b.w, r: 2 };
  out.push(S(k.slabOf(plan, 0, 1.6, P, 4, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([b.x0, y - 6.5], [b.x1, y - 6.5], 1.6, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([b.x0, y + 6.5], [b.x1, y + 6.5], 1.6, P), { tone: "faint" }));
  out.push(L(k.topTicks(b.x0 + 4, b.x1 - 4, 6, 4, y - 9.2, 1.6, [1.2, 2.2], P).minor, { tone: "lo" }));
  out.push(D([at(P, [b.x0 + 2.6, y, 1.6]), at(P, [b.x1 - 2.6, y, 1.6])], { size: 0.45 }));
  return out.join("");
}
export const beltMain = (P) => belt(P, W.YM, W.BM);
export const beltLane = (P) => belt(P, W.YL, W.BL);

// gantry arch over one belt (or several): posts at y0 and y1, beam on top
export function archBack(P, x, y0) { return S(k.slabOf({ x: x - 6, y: y0 - 3, w: 12, d: 6, r: 1.2 }, 0, 24, P, 3, 0.5), { tone: "mid" }); }
export function archFront(P, x, y1) { return S(k.slabOf({ x: x - 6, y: y1 - 3, w: 12, d: 6, r: 1.2 }, 0, 24, P, 3, 0.5), { tone: "mid" }); }
export function archTop(P, x, y0, y1, label) {
  const plan = { x: x - 7, y: y0 - 3, w: 14, d: y1 - y0 + 6, r: 1.8 };
  const out = [S(k.slabOf(plan, 24, 7, P, 4, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 2), 31, P, 4), { tone: "faint" }));
  if (label) out.push(k.faceTextSvg(k.topMatrix([x + 1.6, y1 - 1], 31, P, "y"), label, { size: 3, tone: "mid" }));
  return out.join("");
}

export function head(P, x, y, press) {
  const out = [];
  const z = -4 * press;
  out.push(S(k.cylinder(x, y, 2.2, 12 + z, 12 - z, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, 6.5, 6 + z, 6, P, 28, 0.5), { tone: "hi", lit: true }));
  out.push(L(k.knurl(x, y, 6.5, 6 + z, 12 + z, 20, P), { tone: "lo" }));
  return out.join("");
}

export function slip(P, x, y, bars, op = 1, z = 1.6, lit = true) {
  if (op <= 0.003) return "";
  const { w, d } = W.CARD;
  const plan = { x: x - w / 2, y: y - d / 2, w, d, r: 1.2 };
  const out = [S(k.slabOf(plan, z, 1.2, P, 4, 0.3), { tone: "hi", lit, crease: "lo" })];
  bars.forEach((f, i) => out.push(L(k.lineOnTop([x - w / 2 + 2.4, y - d / 2 + 3.6 + i * 3.8], [x - w / 2 + 2.4 + (w - 5) * f, y - d / 2 + 3.6 + i * 3.8], z + 1.2, P), { tone: "lo", free: true })));
  return opaque(out.join(""), op);
}

export function gauge(P, g) {
  const { cx: x, cy: y, R, z: Z, h: H } = g;
  const { A0, SPAN } = W;
  const top = Z + H;
  const out = [];
  const foot = { x: x - 13, y: y - 13, w: 26, d: 26, r: 3 };
  out.push(S(k.slabOf(foot, 0, 4, P, 5, 0.6), { tone: "mid" }));
  out.push(D(k.corners(foot, 3).map(([a, b]) => at(P, [a, b, 4])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 3.4, 4, Z - 4, P, 24), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, R, Z, H, P, 48, 0.7), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, R, top - 3, top, 56, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, R - 2, top, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(x, y, R - 2.6, 40, 5, top, [1.2, 2.5], P, A0, SPAN);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.5, top, P, 16), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + 8.2], top, P, "x"), g.label, { size: 3, tone: "mid", anchor: "middle" }));
  return out.join("");
}
export function needleD(P, g, v) {
  const { cx: x, cy: y, R, z: Z, h: H } = g;
  const a = W.A0 + W.SPAN * v;
  return k.lineOnTop([x - Math.sin(a) * 3, y + Math.cos(a) * 3], [x + Math.sin(a) * (R - 4), y - Math.cos(a) * (R - 4)], Z + H + 0.2, P);
}


// connecting belts between main belt and return lane
export function cross(P, x) {
  const plan = { x: x - 10, y: W.YM - 10, w: 20, d: W.YL - W.YM + 20, r: 2 };
  const out = [S(k.slabOf(plan, 0, 1.6, P, 4, 0.4), { tone: "mid" })];
  out.push(L(k.lineOnTop([x - 6.5, plan.y], [x - 6.5, plan.y + plan.d], 1.6, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([x + 6.5, plan.y], [x + 6.5, plan.y + plan.d], 1.6, P), { tone: "faint" }));
  return out.join("");
}

// the three MCP servers: small boxes with a lamp, lit while a tool is in use
export function tool(P, t, on) {
  const plan = { x: t.x - 11, y: t.y - 8, w: 22, d: 16, r: 2 };
  const out = [S(k.slabOf(plan, 0, 14, P, 4, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 2), 14, P, 4), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([t.x - 8, t.y + 4.4], 14, P, "x"), t.label, { size: 3.4, tone: "mid" }));
  out.push(S(k.cylinder(t.x + 7, t.y - 3.6, 2, 14, 1.6 + 1.6 * on, P, 14), { tone: on > 0.5 ? "hi" : "mid", lit: on > 0.5 }));
  return out.join("");
}

export function wires(P, on) {
  const out = [];
  W.TOOLS.forEach((t, i) => {
    const pt = (q) => at(P, q);
    out.push(k.wireSvg(pt([t.x, t.y + 8, 7]), pt([-30, W.YM - 20, 26]), { via: [pt([t.x, t.y + 24, 7]), pt([-30, W.YM - 30, 7])], tone: "lo", dotted: true, flow: on[i] > 0.5, size: 1 }));
  });
  return out.join("");
}

export function tray(P) {
  const { TRAY } = W;
  const out = [S(k.slabOf(TRAY, 0, 2, P, 4, 0.4), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(TRAY, 2), 2, P, 4), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([TRAY.x + 3, TRAY.y + 22], 2, P, "x"), "stream", { size: 3.4, tone: "mid" }));
  return out.join("");
}

// the task slip: three plan-step bars (a bar is bright once the executor has run that step) and an answer bar
export function planSlip(P, x, y, printed, lit, answer, op = 1) {
  if (op <= 0.003) return "";
  const { w, d } = W.CARD;
  const z = 1.6;
  const plan = { x: x - w / 2, y: y - d / 2, w, d, r: 1.2 };
  const out = [S(k.slabOf(plan, z, 1.2, P, 4, 0.3), { tone: "hi", lit: true, crease: "lo" })];
  [0.85, 0.6, 0.75].forEach((f, i) => {
    const len = (w - 5) * f * printed;
    if (len > 0.4) out.push(L(k.lineOnTop([x - w / 2 + 2.4, y - d / 2 + 3 + i * 3], [x - w / 2 + 2.4 + len, y - d / 2 + 3 + i * 3], z + 1.2, P), { tone: lit[i] ? "lit" : "lo", free: true }));
  });
  if (answer > 0.02) out.push(L(k.lineOnTop([x - w / 2 + 2.4, y - d / 2 + 12], [x - w / 2 + 2.4 + (w - 5) * 0.9 * answer, y - d / 2 + 12], z + 1.2, P), { tone: "hi", free: true }));
  return opaque(out.join(""), op);
}
