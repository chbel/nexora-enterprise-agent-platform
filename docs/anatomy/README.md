# Agent loop bench: the interactive figure

An isometric, interactive drawing of this repo's planner, executor and critic loop, built with the [Anatomy](https://github.com/wheresryan22/anatomy) Agent Skill by Ryan (MIT). A task slip rides a belt through four arches (memory, planner, executor, critic); three boxes behind the executor stand for the three MCP servers; a return lane carries a rejected answer back for another pass.

| File | What it is |
|---|---|
| `agent-loop-bench-light.html` | The figure, light theme. Standalone: open it in a browser. |
| `agent-loop-bench.html` | The same figure, dark theme. |
| `agent-loop-bench.gif` | A recording of one full cycle, used in the main README. |
| `agent-loop-bench.png` | A still of the finished state. |
| `rig.mjs` | The model: the loop's structure, the pass limit and the timeline. |
| `parts.mjs` | The geometry of every part, shared by the build and the live page. |
| `build.mjs` | Writes the HTML pages. |
| `kit/`, `scripts/` | The Anatomy drawing kit and its capture and line-check scripts, copied unchanged. `LICENSE-anatomy` is its licence. |

## Use it

Hover to scrub through the cycle, click or press Space or Enter to replay, arrow keys to step, Home and End to jump. The figure tours by itself when left alone and shows one still frame under reduced motion.

```bash
node build.mjs --light   # writes agent-loop-bench-light.html  (Node 20.10 or later, nothing to install)
node build.mjs           # writes agent-loop-bench.html
node scripts/lines.mjs agent-loop-bench-light.html --reduced   # every drawn line must end on something (needs Chrome; set CHROME_PATH)
```

## What is real and what is drawn

Real, from `backend/agents/`: the order memory, planner, executor, critic; the executor discovering tools on three MCP servers; the critic sending an answer back to the executor; a maximum of three executor passes (`MAX_REVISIONS = 3`); one plan step executed per pass.

Drawn for the picture: which tools fire, the plan, and the needle positions. No real score is shown.
