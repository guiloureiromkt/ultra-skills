#!/usr/bin/env node
// ultra-site — screenshots + checks que a captura sozinha não pega.
//
// Captura full-page nas larguras que importam e, em cada uma, mede o que o
// olho não vê num PNG: scroll horizontal, elemento preso em opacity:0 com
// prefers-reduced-motion, ordem de tab e foco coberto por header fixo, alvo
// de toque menor que 24px, contraste de texto, deslocamento de layout (CLS)
// e tarefas longas durante o scroll.
//
// Uso:
//   node screenshot.js <index.html | url> <out_dir> [opções]
//     --viewports 1440,390,360,320     larguras a medir (default: 1440,390,360,320)
//     --shots 1440,390                 larguras que também viram PNG full-page (default: 1440,390)
//     --dark                           captura extra em prefers-color-scheme: dark (na 1ª largura)
//     --no-checks                      só os PNGs
//
// Saída: <out_dir>/desktop-1440.png, mobile-390.png (...), checks.json e checks.md.
// Exit code 1 quando algum check bloqueante falha (overflow, reveal preso,
// foco coberto) — pra servir de gate em script.
//
// puppeteer-core + Chrome instalado + file://. Headless de painel/preview
// congela em página pesada; este script não.

const path = require("path");
const fs = require("fs");
const os = require("os");

function requirePuppeteer() {
  const candidates = [
    "puppeteer-core",
    path.join(__dirname, "node_modules", "puppeteer-core"),
    path.join(process.env.APPDATA || "", "npm", "node_modules", "puppeteer-core"),
    "/usr/lib/node_modules/puppeteer-core",
    "/usr/local/lib/node_modules/puppeteer-core",
  ];
  for (const c of candidates) {
    try { return require(c); } catch (_) {}
  }
  console.error("puppeteer-core não encontrado. Rode uma vez:\n  cd " + __dirname + " && npm i puppeteer-core");
  process.exit(1);
}

function walk(dir, depth) {
  if (depth < 0) return [];
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p, depth - 1)); else out.push(p);
  }
  return out;
}

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const home = os.homedir();
  const cands = [
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(home, ".cache", "puppeteer", "chrome"),
  ];
  for (const c of cands) {
    if (!c || !fs.existsSync(c)) continue;
    if (fs.statSync(c).isFile()) return c;
    // ~/.cache/puppeteer/chrome/<build>/chrome-linux64/chrome
    const found = walk(c, 4).find((f) => /(^|[\\/])chrome(\.exe)?$/.test(f) && fs.statSync(f).isFile());
    if (found) return found;
  }
  console.error("Chrome não encontrado. Instale o Chrome ou exporte CHROME_PATH=/caminho/do/chrome");
  process.exit(1);
}

function parseArgs(argv) {
  const a = { viewports: [1440, 390, 360, 320], shots: [1440, 390], dark: false, checks: true, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--viewports") a.viewports = argv[++i].split(",").map(Number);
    else if (k === "--shots") a.shots = argv[++i].split(",").map(Number);
    else if (k === "--dark") a.dark = true;
    else if (k === "--no-checks") a.checks = false;
    else a.rest.push(k);
  }
  return a;
}

// Roda no navegador. Tudo que devolve é medido, não deduzido.
const CHECKS_IN_PAGE = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; else if (el.className && typeof el.className === "string" && el.className.trim()) s += "." + el.className.trim().split(/\\s+/).slice(0, 2).join("."); const t = (el.innerText || el.getAttribute("aria-label") || el.alt || "").trim().slice(0, 40); return t ? s + ' "' + t + '"' : s; };
  const W = innerWidth;
  // 1. overflow horizontal: quem passa da borda direita
  const docW = document.documentElement.scrollWidth;
  const overflow = { scrollWidth: docW, innerWidth: W, culprits: [] };
  if (docW > W + 1) {
    for (const el of document.querySelectorAll("body *")) {
      if (!vis(el)) continue; const r = el.getBoundingClientRect();
      if (r.right > W + 1 && r.width <= docW) overflow.culprits.push({ el: sel(el), right: Math.round(r.right), width: Math.round(r.width) });
      if (overflow.culprits.length >= 8) break;
    }
  }
  // 2. alvo de toque < 24px (WCAG 2.5.8); links dentro de frase ficam de fora
  const targets = [];
  for (const el of document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],summary")) {
    if (!vis(el)) continue; const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && el.parentElement && getComputedStyle(el).display === "inline" && (el.parentElement.innerText || "").length > (el.innerText || "").length + 20;
    if (!inline && (r.width < 24 || r.height < 24)) targets.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height) });
    if (targets.length >= 12) break;
  }
  // 3. contraste: cor do texto × fundo efetivo (sobe até achar cor opaca)
  const parse = (c) => { const m = (c || "").match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map(parseFloat); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const cs = getComputedStyle(n); const c = parse(cs.backgroundColor); if (c && c.a >= 0.99) return c; if (cs.backgroundImage && cs.backgroundImage !== "none") return null; n = n.parentElement; } const c = parse(getComputedStyle(document.body).backgroundColor); return c && c.a > 0 ? c : { r: 255, g: 255, b: 255, a: 1 }; };
  const contrast = []; let checked = 0, unmeasured = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set(); let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim(); if (t.length < 3) continue;
    const el = node.parentElement; if (!el || seen.has(el) || !vis(el)) continue; seen.add(el);
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); const bg = bgOf(el);
    if (!fg || !bg) { unmeasured++; continue; }
    checked++;
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const r = ratio(fg, bg); const min = large ? 3 : 4.5;
    if (r < min && contrast.length < 15) contrast.push({ el: sel(el), ratio: Math.round(r * 100) / 100, min, fontSize: Math.round(size) });
  }
  // 4. elementos visíveis presos em opacity 0 (reveal que nunca disparou)
  const stuck = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el); if (cs.opacity !== "0") continue;
    const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 12) continue;
    if (el.closest("[aria-hidden=true]") || el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
    if (!(el.innerText || "").trim() && !el.querySelector("img,video,canvas,svg")) continue;
    stuck.push({ el: sel(el), top: Math.round(r.top + scrollY) }); if (stuck.length >= 12) break;
  }
  // 5. header fixo/sticky, pra conferir foco coberto
  const fixed = [];
  for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if ((cs.position === "fixed" || cs.position === "sticky") && vis(el)) { const r = el.getBoundingClientRect(); if (r.width > W * 0.6) fixed.push({ el: sel(el), top: Math.round(r.top), bottom: Math.round(r.bottom) }); } if (fixed.length >= 4) break; }
  const scrollPadding = getComputedStyle(document.documentElement).scrollPaddingTop;
  return { overflow, targets, contrast: { checked, unmeasured, low: contrast }, stuck, fixed, scrollPaddingTop: scrollPadding, hasMain: !!document.querySelector("main,[role=main]"), lang: document.documentElement.lang || null };
})()`;

// Tab por tab: onde o foco cai, se é visível, se ficou coberto por algo fixo.
async function tabOrder(page, max = 40) {
  const seq = [];
  await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inView = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      const hit = inView ? document.elementFromPoint(Math.min(Math.max(cx, 1), innerWidth - 1), Math.min(Math.max(cy, 1), innerHeight - 1)) : null;
      const obscured = inView && r.height > 0 && hit && hit !== el && !el.contains(hit) && !hit.contains(el);
      const noFocusStyle = cs.outlineStyle === "none" && cs.boxShadow === "none";
      const tag = el.tagName.toLowerCase(); const t = (el.innerText || el.getAttribute("aria-label") || el.value || "").trim().slice(0, 40);
      return { el: tag + (t ? ' "' + t + '"' : ""), obscured: !!obscured, noFocusStyle, inView };
    });
    if (!info) break;
    if (seq.length && info.el === seq[0].el && i > 0) break; // deu a volta
    seq.push(info);
  }
  return seq;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const [target, outDir] = args.rest;
  if (!target || !outDir) {
    console.error("Uso: node screenshot.js <index.html|url> <out_dir> [--viewports 1440,390,360,320] [--shots 1440,390] [--dark] [--no-checks]");
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const url = /^https?:\/\//.test(target) ? target : "file:///" + path.resolve(target).replace(/\\/g, "/");

  const puppeteer = requirePuppeteer();
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: "new",
    args: ["--hide-scrollbars", "--force-device-scale-factor=1", "--no-sandbox"],
  });

  const report = { target: url, when: new Date().toISOString(), viewports: {}, blocking: [] };
  const nameFor = (w) => (w >= 1024 ? `desktop-${w}` : w >= 600 ? `tablet-${w}` : `mobile-${w}`);
  const settle = (ms) => new Promise((r) => setTimeout(r, ms));
  const loadAndScroll = async (page) => {
    // Headless não dispara lazy-load nem reveals por viewport sozinho: forçar
    // eager, rolar a página inteira e esperar — o full-page tem que mostrar o
    // que o usuário vê. Slot de imagem vazio depois disto é bug real.
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((i) => { i.loading = "eager"; if (i.dataset && i.dataset.src && !i.src) i.src = i.dataset.src; });
      const step = window.innerHeight;
      for (let y = 0; y <= document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
      await Promise.all([...document.querySelectorAll("img")].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })));
    });
    await settle(1500);
  };

  for (const w of args.viewports) {
    const page = await browser.newPage();
    const h = w >= 1024 ? 900 : w >= 600 ? 1024 : 844;
    await page.setViewport({ width: w, height: h });
    // CLS e long tasks precisam de observer instalado ANTES do load
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0; window.__longtasks = 0;
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } catch {}
      try { new PerformanceObserver((l) => { window.__longtasks += l.getEntries().length; }).observe({ type: "longtask", buffered: true }); } catch {}
    });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    await loadAndScroll(page);

    const v = { width: w };
    if (args.shots.includes(w)) {
      const file = path.join(outDir, `${nameFor(w)}.png`);
      await page.screenshot({ path: file, fullPage: true });
      v.screenshot = file; console.log("  " + file);
    }
    if (args.checks) {
      const base = await page.evaluate(CHECKS_IN_PAGE);
      base.cls = await page.evaluate(() => Math.round((window.__cls || 0) * 1000) / 1000);
      base.longTasksDuringScroll = await page.evaluate(() => window.__longtasks || 0);
      Object.assign(v, base);
      v.tabOrder = await tabOrder(page);
      v.focusObscured = v.tabOrder.filter((t) => t.obscured).map((t) => t.el);
      v.focusWithoutStyle = v.tabOrder.filter((t) => t.noFocusStyle).map((t) => t.el);
      // reduced-motion: página NOVA com a preferência ligada antes do load
      // (emular e recarregar na mesma aba perde a corrida com a 1ª pintura).
      // Nada pode ficar invisível: quem desliga a animação não pode perder o conteúdo.
      const rm = await browser.newPage();
      await rm.setViewport({ width: w, height: h });
      await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await rm.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
      await loadAndScroll(rm);
      await settle(1000);
      v.reducedMotionStuck = (await rm.evaluate(CHECKS_IN_PAGE)).stuck;
      await rm.close();
      if (args.dark && w === args.viewports[0]) {
        const dk = await browser.newPage();
        await dk.setViewport({ width: w, height: h });
        await dk.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
        await dk.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
        await loadAndScroll(dk);
        const file = path.join(outDir, `${nameFor(w)}-dark.png`);
        await dk.screenshot({ path: file, fullPage: true }); v.darkScreenshot = file; console.log("  " + file);
        await dk.close();
      }
      // bloqueantes
      if (v.overflow.scrollWidth > w + 1) report.blocking.push(`${w}px: scroll horizontal (${v.overflow.scrollWidth}px em ${w}px) · ${v.overflow.culprits.map((c) => c.el).slice(0, 3).join(", ")}`);
      if (v.stuck.length) report.blocking.push(`${w}px: ${v.stuck.length} bloco(s) presos em opacity:0 depois do load · ${v.stuck.map((c) => c.el).slice(0, 3).join(", ")}`);
      if (v.reducedMotionStuck.length) report.blocking.push(`${w}px: ${v.reducedMotionStuck.length} bloco(s) invisíveis com prefers-reduced-motion · ${v.reducedMotionStuck.map((c) => c.el).slice(0, 3).join(", ")}`);
      if (v.focusObscured.length) report.blocking.push(`${w}px: foco coberto por elemento fixo em ${v.focusObscured.length} parada(s) de Tab · ${v.focusObscured.slice(0, 3).join(", ")}`);
    }
    report.viewports[w] = v;
    await page.close();
  }
  await browser.close();

  if (args.checks) {
    fs.writeFileSync(path.join(outDir, "checks.json"), JSON.stringify(report, null, 2));
    const L = [`# checks · ${url}`, ""];
    for (const [w, v] of Object.entries(report.viewports)) {
      L.push(`## ${w}px`);
      L.push(`- scroll horizontal: ${v.overflow.scrollWidth > Number(w) + 1 ? `**SIM** (${v.overflow.scrollWidth}px) · ${v.overflow.culprits.map((c) => `${c.el} right=${c.right}`).join(" · ")}` : "não"}`);
      L.push(`- alvos < 24px: ${v.targets.length ? v.targets.map((t) => `${t.el} ${t.w}×${t.h}`).join(" · ") : "nenhum"}`);
      L.push(`- contraste abaixo do mínimo: ${v.contrast.low.length ? v.contrast.low.map((c) => `${c.el} ${c.ratio}:1 (mín ${c.min})`).join(" · ") : "nenhum"} (${v.contrast.checked} medidos · ${v.contrast.unmeasured} sobre imagem/gradiente, não medidos)`);
      L.push(`- presos em opacity:0 após load: ${v.stuck.length || "nenhum"} · com reduced-motion: ${v.reducedMotionStuck.length || "nenhum"}`);
      L.push(`- Tab: ${v.tabOrder.length} paradas · foco coberto: ${v.focusObscured.length ? v.focusObscured.join(", ") : "nenhum"} · sem estilo de foco: ${v.focusWithoutStyle.length ? v.focusWithoutStyle.slice(0, 5).join(", ") : "nenhum"}`);
      L.push(`- CLS: ${v.cls} · long tasks no scroll: ${v.longTasksDuringScroll} · header fixo: ${v.fixed.length ? v.fixed.map((f) => f.el).join(", ") + ` · scroll-padding-top: ${v.scrollPaddingTop}` : "nenhum"}`);
      L.push(`- landmark <main>: ${v.hasMain ? "sim" : "**não**"} · lang: ${v.lang || "**ausente**"}`);
      L.push("");
    }
    L.push(report.blocking.length ? `## BLOQUEANTES (${report.blocking.length})\n` + report.blocking.map((b) => `- ${b}`).join("\n") : "## Nenhum bloqueante");
    fs.writeFileSync(path.join(outDir, "checks.md"), L.join("\n") + "\n");
    console.log("  " + path.join(outDir, "checks.md"));
    console.log(report.blocking.length ? `\n${report.blocking.length} BLOQUEANTE(S):\n  ` + report.blocking.join("\n  ") : "\nSem bloqueantes.");
    if (report.blocking.length) process.exitCode = 1;
  }
  console.log("OK");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
