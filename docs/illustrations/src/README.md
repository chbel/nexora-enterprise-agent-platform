# Illustration sources

The three images one level up are drawn by `agent.py` with the small kit in `xh.py` (wobbly black lines, a black creature with white dot eyes, orange for the path, red for the key point, blue for side notes). They are hand-authored vector drawings, not AI-generated art.

```bash
python3 agent.py                                                        # writes 13-plan-do-check.svg, 14-tools-behind-plugs.svg, 15-enforce-in-database.svg
node render.js 13-plan-do-check 14-tools-behind-plugs 15-enforce-in-database   # needs playwright with Chromium; writes the PNGs
```

The lettering font is Caveat (SIL Open Font License 1.1), embedded in each SVG from `caveat-latin-600-normal.woff2`.

The drawings show no measured data. The third one is a recommendation, not a description of current behaviour: see the Limitations section of the main README.
