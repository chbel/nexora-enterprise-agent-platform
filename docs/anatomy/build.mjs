// Builds the interactive agent-loop bench: node build.mjs [--light]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";
import * as rig from "./rig.mjs";
import * as g from "./parts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 860;
const HEIGHT = 400;
const { W } = g;
const { X, YM } = rig;
const REST = 0.975;

const P = k.fitProjection(
  [...k.boxCorners(W.PLATE, -17, 0), [-30, -92, 20], [34, -76, 30], [150, -30, 12], [-150, -30, 34]],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: 62 },
);

const slipOf = (p) => (p.slip.shown ? g.planSlip(P, p.slip.x, p.slip.y, p.printed, p.stepLit, p.answer, p.fade) : "");
const headsOf = (p) => [[X.mem, p.press.mem], [X.plan, p.press.plan], [X.exec, p.press.exec], [X.crit, p.press.crit]].map(([x, pr]) => g.head(P, x, YM, pr)).join("");
const toolsOf = (p) => W.TOOLS.map((t, i) => g.tool(P, t, p.tool[i])).join("");

function scene(u) {
  const p = rig.pose(u);
  return [
    g.plate(P),
    g.beltMain(P),
    g.beltLane(P),
    g.cross(P, X.exec),
    g.cross(P, X.crit),
    `<g data-part="tools">${toolsOf(p)}</g>`,
    g.tray(P),
    g.gauge(P, W.GAUGE),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${g.needleD(P, W.GAUGE, p.needle)}" style="stroke-width:1"/>`,
    ...[X.mem, X.plan, X.exec, X.crit].map((x) => g.archBack(P, x, YM - 17)),
    `<g data-part="slip">${slipOf(p)}</g>`,
    `<g data-part="heads">${headsOf(p)}</g>`,
    g.archTop(P, X.mem, YM - 17, YM + 17, "memory"),
    g.archTop(P, X.plan, YM - 17, YM + 17, "plan"),
    g.archTop(P, X.exec, YM - 17, YM + 17, "execute"),
    g.archTop(P, X.crit, YM - 17, YM + 17, "critic"),
    ...[X.mem, X.plan, X.exec, X.crit].map((x) => g.archFront(P, x, YM + 17)),
    `<g data-part="wires">${g.wires(P, p.tool)}</g>`,
  ];
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A bench that works like the agent loop in this repo. A task slip rides a belt through four arches: memory, planner, executor and critic. Three small boxes behind the executor stand for the SQL, document and notification MCP servers and light up when a tool is used. The critic's dial reads the answer; below the bar, the slip drops onto a return lane and goes back to the executor for another pass; once accepted it leaves to a stream tray.",
  body: scene(REST),
});

const strip = (file) => readFileSync(join(HERE, file), "utf8").replace(/^export /gm, "").replace(/^import .*$/gm, "");
const kitNames = Object.keys(k).join(", ");

const live = `
const P = ${JSON.stringify(P)};
const REST = ${REST};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const E = Object.fromEntries(["tools", "slip", "heads", "wires", "needle"].map((n) => [n, part(n)]));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const cache = {};
const put = (key, node, html) => { if (cache[key] !== html) { cache[key] = html; node.innerHTML = html; } };
const q4 = (v) => Math.round(v * 4) / 4;
const q20 = (v) => Math.round(v * 20) / 20;
const q8 = (v) => Math.round(v * 8) / 8;
let u = still.matches ? REST : 0, target = u, touring = !still.matches, frame = 0, last = 0, visible = false, idleTimer = 0;

function render() {
  const p = pose(u);
  put("slip", E.slip, p.slip.shown ? planSlip(P, q4(p.slip.x), q4(p.slip.y), q20(p.printed), p.stepLit, q20(p.answer), q20(p.fade)) : "");
  put("heads", E.heads, [[X.mem, p.press.mem], [X.plan, p.press.plan], [X.exec, p.press.exec], [X.crit, p.press.crit]].map(([x, v]) => head(P, x, YM, q8(v))).join(""));
  put("tools", E.tools, W.TOOLS.map((t, i) => tool(P, t, q20(p.tool[i]))).join(""));
  put("wires", E.wires, wires(P, p.tool.map(q20)));
  E.needle.setAttribute("d", needleD(P, W.GAUGE, p.needle));
  const text = describe(u);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(u * 100)));
  stage.setAttribute("aria-valuetext", text);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { u += dt / CYCLE; if (u >= 1) u -= 1; target = u; }
  else { u = still.matches ? target : u + (target - u) * (1 - Math.exp(-dt / 0.12)); if (Math.abs(target - u) < 0.0004) u = target; }
  render();
  frame = visible && (touring || u !== target) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const hold = () => { touring = false; clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = !still.matches; run(); }, 3600); run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); target = clamp(((event.clientX - box.left) / box.width - 0.06) / 0.88, 0, 0.995); hold(); });
stage.addEventListener("pointerleave", () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = !still.matches; run(); }, 1200); });
stage.addEventListener("click", () => { u = target = 0; touring = !still.matches; if (still.matches) u = target = REST; clearTimeout(idleTimer); render(); run(); });
stage.addEventListener("keydown", (event) => {
  const key = event.key;
  if (key === "ArrowRight" || key === "ArrowUp") target = clamp(target + 0.03, 0, 0.995);
  else if (key === "ArrowLeft" || key === "ArrowDown") target = clamp(target - 0.03, 0, 0.995);
  else if (key === "Home") target = 0;
  else if (key === "End") target = REST;
  else if (key === " " || key === "Enter") { event.preventDefault(); u = target = 0; touring = !still.matches; render(); run(); return; }
  else return;
  event.preventDefault();
  hold();
});
window.__set = (uu) => { u = target = uu; touring = false; render(); };
render();
`;

const phone = `<style>@media (max-width:560px){.iso-plate-corner[data-corner="hint"]{display:none}.iso-plate-corner[data-corner="readout"]{left:0;right:0;white-space:normal;text-align:right;font-size:9.5px;line-height:1.35}}</style>`;
const body = phone + k.plateHtml({
  fig: "Fig 1",
  title: "Agent loop bench",
  hint: "Hover to scrub · click to replay",
  readout: rig.describe(REST),
  keys: [
    { mark: "lit", label: "The task slip, a plan step once it has run, and the critic's needle" },
    { mark: "raised", label: "Four arches: memory, planner, executor, critic; three MCP boxes behind" },
  ],
  caption:
    "A task rides through memory retrieval, the planner and the executor, which can call tools on three MCP servers. The critic scores the answer; below its bar the slip returns to the executor, up to three executor passes in all. Each pass runs one plan step, so a plan's later steps run only if the critic asks for another pass. Which tools fire, the plan and the needle positions are illustrative.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Agent loop bench: hover to scrub, click to replay, arrow keys step" aria-valuemin="0" aria-valuemax="100" aria-valuenow="97">${svg}</div>`,
});

const script = kitScript() + `\nconst k = { ${kitNames} };\n` + strip("rig.mjs") + "\n" + strip("parts.mjs") + "\n" + live;
const file = theme === "light" ? "agent-loop-bench-light.html" : "agent-loop-bench.html";
writeFileSync(join(HERE, file), k.pageHtml({ title: "Agent loop bench", theme, body, script, width: 900 }));
console.log("wrote", file);
