from xh import *
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import os
F = "caveat-latin-600-normal.woff2"

# 1. plan, do, check, again
c = Canvas(51, F)
for x, n in [(250, "plan"), (620, "do"), (990, "check")]:
    c.rect(x - 90, 330, 180, 100, fill="#fff")
    c.text(x, 395, n, BLACK, 52, "middle")
c.arrow([(350, 380), (510, 380)]); c.arrow([(720, 380), (880, 380)])
c.line([(990, 440), (990, 520), (620, 520), (620, 445)], RED, 5)
c.line([(620, 445), (606, 470)], RED, 5); c.line([(620, 445), (636, 470)], RED, 5)
c.text(805, 570, "not good enough? try again", RED, 42, "middle")
c.xiaohei(620, 330, 0.7, look=.6, hands=[(545, 345), None])
c.text(990, 235, "a second model scores\nthe answer", BLUE, 36, "middle")
c.text(690, 690, "at most 3 passes by the executor", BLACK, 38, "middle")
c.save("13-plan-do-check.svg")

# 2. tools behind plugs
c = Canvas(52, F)
c.rect(180, 340, 260, 110, fill="#fff")
c.text(310, 405, "agent", BLACK, 54, "middle")
for i, (n, y) in enumerate([("sql", 250), ("docs", 390), ("notify", 530)]):
    c.rect(900, y, 220, 90, fill="#fff")
    c.text(1010, y + 58, n, BLACK, 46, "middle")
    c.circle(890, y + 45, 12, BLACK, "#fff", 3)
    c.line([(440, 395), (600, 395 if i == 1 else (y + 45)), (878, y + 45)], ORANGE if i == 0 else BLACK, 4 if i == 0 else 2.6)
c.xiaohei(640, 710, 0.9, look=-.8, hands=[None, None])
c.text(660, 205, "tools live behind MCP servers", BLACK, 42, "middle")
c.text(310, 560, "the model asks,\nthe server does", RED, 44, "middle")
c.text(310, 660, "add a server, not agent code", BLUE, 34, "middle")
c.save("14-tools-behind-plugs.svg")

# 3. enforce it in the database
c = Canvas(53, F)
c.rect(860, 280, 280, 260, fill="#fff")
c.text(1000, 250, "database", BLACK, 46, "middle")
c.line([(900, 330), (1100, 330)], BLACK, 3); c.line([(900, 400), (1100, 400)], BLACK, 3); c.line([(900, 470), (1100, 470)], BLACK, 3)
c.rect(560, 380, 200, 90, fill="#fff", rot=-2)
c.text(660, 440, "\"SELECT ...\"", BLACK, 40, "middle")
c.arrow([(770, 420), (850, 420)])
c.xiaohei(380, 570, 1.0, look=.8, hands=[(550, 430), None])
c.text(360, 230, "a text check on the query\nis a first fence only", BLACK, 38, "middle")
c.text(900, 640, "enforce read-only\nin the database role too", RED, 46, "middle")
c.save("15-enforce-in-database.svg")
