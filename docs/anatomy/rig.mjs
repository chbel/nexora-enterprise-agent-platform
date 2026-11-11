// The model behind the figure. Pure functions: the geometry, the motion and the readout all read from here.
// Real, from backend/agents/graph.py, executor.py and critic.py: memory retrieval, then planner, executor and critic;
// the executor discovers tools on three MCP servers (SQL, documents, notifications); the critic can send the answer
// back to the executor; the loop stops after MAX_REVISIONS = 3 executor passes in total.
// Illustrative: which tools fire, the plan contents, and the needle positions (no real score is shown).

export const CYCLE = 34;
export const MAX_PASSES = 3;
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const seg = (u, a, b) => clamp((u - a) / (b - a));
export const ease = (t) => t * t * (3 - 2 * t);
export const wave = (u, a, b) => Math.sin(Math.PI * seg(u, a, b));

export const X = { start: -204, mem: -150, plan: -90, exec: -30, crit: 34, out: 100, tray: 150 };
export const YM = -30;
export const YL = 14;
export const T = {
  toMem: [0.02, 0.08],
  mem: [0.08, 0.13],
  toPlan: [0.13, 0.19],
  plan: [0.19, 0.25],
  toExec: [0.25, 0.3],
  exec1: [0.3, 0.37],
  toCrit: [0.37, 0.43],
  crit1: [0.43, 0.5],
  back: [0.5, 0.6],
  exec2: [0.6, 0.67],
  toCrit2: [0.67, 0.73],
  crit2: [0.73, 0.8],
  toOut: [0.8, 0.87],
  stream: [0.87, 0.94],
  fade: [0.985, 1.0],
};

// slip position along the path: main belt, then down to the return lane, back, up
export function pose(u) {
  const fade = 1 - seg(u, T.fade[0], T.fade[1]);
  const p = { u, fade };
  let x = X.start, y = YM;
  const mv = (a, b, t) => a + (b - a) * ease(seg(u, ...t));
  if (u < T.toMem[1]) x = mv(X.start, X.mem, T.toMem);
  else if (u < T.toPlan[1]) x = mv(X.mem, X.plan, T.toPlan);
  else if (u < T.toExec[1]) x = mv(X.plan, X.exec, T.toExec);
  else if (u < T.toCrit[1]) x = mv(X.exec, X.crit, T.toCrit);
  else if (u < T.back[0]) x = X.crit;
  else if (u < T.exec2[0]) {
    const s = seg(u, ...T.back);
    // down to the lane, left along it, up to the executor
    if (s < 0.25) { x = X.crit; y = YM + (YL - YM) * ease(s / 0.25); }
    else if (s < 0.75) { x = X.crit + (X.exec - X.crit) * ease((s - 0.25) / 0.5); y = YL; }
    else { x = X.exec; y = YL + (YM - YL) * ease((s - 0.75) / 0.25); }
  } else if (u < T.toCrit2[1]) x = mv(X.exec, X.crit, T.toCrit2);
  else if (u < T.toOut[0]) x = X.crit;
  else if (u < T.toOut[1]) x = mv(X.crit, X.out, T.toOut);
  else x = mv(X.out, X.tray, T.stream);
  p.slip = { x, y, shown: u >= T.toMem[0] };
  p.passes = u >= T.toCrit2[0] ? 2 : u >= T.exec1[0] ? 1 : 0;
  p.press = {
    mem: wave(u, ...T.mem),
    plan: wave(u, ...T.plan),
    exec: Math.max(wave(u, ...T.exec1), wave(u, ...T.exec2)),
    crit: Math.max(wave(u, ...T.crit1), wave(u, ...T.crit2)),
  };
  p.printed = seg(u, T.plan[0] + 0.02, T.plan[1]); // plan bars
  p.stepLit = [u >= T.exec1[0] + 0.02 ? 1 : 0, u >= T.exec2[0] + 0.02 ? 1 : 0, 0]; // one plan step per pass
  p.tool = [wave(u, T.exec1[0] + 0.01, T.exec1[1]), wave(u, T.exec2[0] + 0.01, T.exec2[1]), 0]; // sql then docs, illustrative
  p.needle = u < T.crit2[0] ? 0.4 * ease(seg(u, T.crit1[0], T.crit1[1])) : 0.4 + 0.45 * ease(seg(u, T.crit2[0], T.crit2[1])); // illustrative
  p.needle = u >= T.back[0] && u < T.crit2[0] ? 0.4 * (1 - ease(seg(u, T.back[0], T.back[0] + 0.05))) : p.needle;
  p.answer = seg(u, T.toOut[0], T.toOut[1]); // the slip gains answer bars
  p.stream = wave(u, T.stream[0], T.stream[1]);
  return p;
}

export function describe(u) {
  if (u < T.plan[0]) return "memory: retrieve context from the vector store";
  if (u < T.exec1[0]) return "planner: break the task into numbered steps";
  if (u < T.toCrit[0]) return "executor: one plan step, with tools chosen from the MCP servers";
  if (u < T.back[0]) return "critic: score the answer; below the bar, send it back";
  if (u < T.toCrit2[0]) return "second pass: the executor tries again with the critique";
  if (u < T.toOut[0]) return "critic accepts: the answer goes out";
  if (u < T.fade[0]) return "the answer streams to the client over a WebSocket";
  return "ready for the next task";
}
