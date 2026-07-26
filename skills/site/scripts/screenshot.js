#!/usr/bin/env node
// ultra-site — full-page screenshots (desktop 1440 + mobile 390) pro review adversarial.
// Caminho provado nesta máquina: puppeteer-core + Chrome instalado + file://
// (NÃO usar preview_screenshot — trava em página pesada).
//
// Uso: node screenshot.js <index.html | url> <out_dir>
// Saída: <out_dir>/desktop-1440.png + <out_dir>/mobile-390.png

const path = require("path");
const fs = require("fs");

function requirePuppeteer() {
  const candidates = [
    "puppeteer-core",
    path.join(__dirname, "node_modules", "puppeteer-core"),
    path.join(process.env.APPDATA || "", "npm", "node_modules", "puppeteer-core"),
  ];
  for (const c of candidates) {
    try { return require(c); } catch (_) {}
  }
  console.error("puppeteer-core não encontrado. Rode uma vez:\n  cd " + __dirname + " && npm init -y && npm i puppeteer-core");
  process.exit(1);
}

function findChrome() {
  const cands = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  console.error("Chrome não encontrado — edite findChrome().");
  process.exit(1);
}

(async () => {
  const [, , target, outDir] = process.argv;
  if (!target || !outDir) {
    console.error("Uso: node screenshot.js <index.html|url> <out_dir>");
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const url = /^https?:\/\//.test(target)
    ? target
    : "file:///" + path.resolve(target).replace(/\\/g, "/");

  const puppeteer = requirePuppeteer();
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: "new",
    args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
  });

  const shots = [
    { name: "desktop-1440", width: 1440, height: 900 },
    { name: "mobile-390", width: 390, height: 844 },
  ];
  for (const s of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: s.width, height: s.height });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    // CICATRIZ 2026-07-14: headless roda com document.hidden === true, então
    // imagens loading="lazy" NUNCA carregam sozinhas (o IntersectionObserver
    // não dispara) — o screenshot mostrava slots vazios e o review não sabia
    // se era bug real ou só lazy+oculto. Forçar eager + rolar a página inteira
    // + esperar todas completarem, pra o full-page refletir o que o usuário vê.
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((i) => {
        i.loading = "eager";
        if (i.dataset && i.dataset.src && !i.src) i.src = i.dataset.src;
      });
      const step = window.innerHeight;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await Promise.all(
        [...document.querySelectorAll("img")].map((i) =>
          i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })
        )
      );
    });
    // settle: fontes/lazy-decode/animações de mount
    await new Promise((r) => setTimeout(r, 1500));
    const file = path.join(outDir, `${s.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("  " + file);
    await page.close();
  }
  await browser.close();
  console.log("OK");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
