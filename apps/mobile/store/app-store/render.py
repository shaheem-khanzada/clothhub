"""
Renders the App Store screenshots (1320 x 2868, the 6.9" iPhone size) from
iPhone 17 Pro simulator captures.

    1. Put the captures in captures/ as s1.png, s2.png, ... (not committed).
    2. pip install playwright && python3 render.py   (or: python3 render.py 2 4)
    3. Upload screenshots/*.png in App Store Connect, in order.
"""
import base64
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
MOBILE = HERE.parents[1]
CAPTURES = HERE / "captures"
OUT = HERE / "screenshots"
OUT.mkdir(exist_ok=True)

W, H = 1320, 2868

# (screenshot, eyebrow, headline with <em> for the silk word, subline)
SLIDES = [
    ("s1", "Pakistan's fashion brands", "Every brand.<br><em>One feed.</em>", "Saya, Limelight, Nishat and more,<br>side by side in one app."),
    ("s2", "Whole collections", "Browse it all,<br><em>no tabs.</em>", "Thousands of new pieces, without<br>opening a single website."),
    ("s3", "Full-screen reel", "See every<br><em>detail.</em>", "Swipe through every photo,<br>edge to edge."),
    ("s5", "Save &amp; share", "Save it.<br><em>Share it.</em>", "Heart it for later, or send it<br>to whoever helps you decide."),
    ("s6", "Shop on brand", "Love it?<br><em>Shop it.</em>", "Price, sizes, fabric and stock, then<br>buy on the brand's own site."),
    ("s7", "Sort &amp; filter", "Find it<br><em>faster.</em>", "Filter by price, stock and sale.<br>Sort by newest or price."),
]


def data_uri(path: pathlib.Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


FONTS = "".join(
    f"@font-face{{font-family:'{name}';src:url('{data_uri(MOBILE / 'assets' / 'fonts' / f'BricolageGrotesque-{name}.ttf', 'font/ttf')}')}}"
    for name in ("DisplayBold", "Medium", "SemiBold")
)
MARK = data_uri(MOBILE / "assets" / "brand" / "mark.svg", "image/svg+xml")

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
{fonts}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;background:#0B0B0C}}
.stage{{position:relative;width:100%;height:100%;overflow:hidden;
  background:
    radial-gradient(70% 38% at 50% 74%, rgba(227,154,134,.30), rgba(227,154,134,.10) 45%, rgba(11,11,12,0) 75%),
    radial-gradient(60% 30% at 85% 4%, rgba(238,201,174,.10), rgba(11,11,12,0) 70%),
    #0B0B0C}}
.grain{{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}}
.copy{{position:absolute;top:150px;left:0;right:0;text-align:center;padding:0 90px}}
.eyebrow{{display:inline-flex;align-items:center;gap:22px;font:500 38px/1 'Medium';letter-spacing:.16em;text-transform:uppercase;color:#D9B8A6}}
.eyebrow img{{width:62px;height:auto}}
h1{{margin-top:46px;font:700 132px/1.02 'DisplayBold';letter-spacing:-.02em;color:#F6EFE8}}
h1 em{{font-style:normal;background:linear-gradient(115deg,#FFF6EA 0%,#EEC9AE 40%,#D99A88 75%,#B9706F 100%);-webkit-background-clip:text;background-clip:text;color:transparent}}
p{{margin-top:40px;font:500 44px/1.38 'Medium';color:rgba(246,239,232,.62)}}
.phone{{position:absolute;left:50%;top:870px;width:1000px;transform:translateX(-50%);
  border-radius:150px;padding:22px;background:linear-gradient(160deg,#3a3431,#151313 40%,#2a2523);
  box-shadow:0 0 0 3px rgba(255,255,255,.07) inset,0 60px 140px rgba(0,0,0,.65),0 0 120px rgba(227,154,134,.16)}}
.phone img{{display:block;width:100%;border-radius:128px}}
</style></head><body><div class="stage"><div class="grain"></div>
<div class="copy"><div class="eyebrow"><img src="{mark}">{eyebrow}</div><h1>{headline}</h1><p>{sub}</p></div>
<div class="phone"><img src="{shot}"></div>
</div></body></html>"""


def main() -> None:
    only = set(sys.argv[1:])
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        for index, (shot, eyebrow, headline, sub) in enumerate(SLIDES, start=1):
            if only and str(index) not in only:
                continue
            html = PAGE.format(
                fonts=FONTS, w=W, h=H, mark=MARK, eyebrow=eyebrow, headline=headline, sub=sub,
                shot=data_uri(CAPTURES / f"{shot}.png", "image/png"),
            )
            page.set_content(html, wait_until="load")
            page.evaluate("document.fonts.ready")
            target = OUT / f"clothhub-{index:02d}.png"
            page.screenshot(path=str(target), full_page=False)
            print("wrote", target)
        browser.close()


if __name__ == "__main__":
    main()
