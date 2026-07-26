#!/usr/bin/env node
// ============================================================================
// ultra-auditoria · progresso.mjs — compara duas rodadas de auditoria.
//
// O loop de correção só é honesto se cada rodada for comparada com a anterior.
// Sem isso o relatório vira "melhorou bastante" — e "melhorou bastante" não é
// um número. Este script responde: o que subiu, o que caiu, o que foi resolvido
// e o que APARECEU (correção que quebra outra coisa é rotina, não exceção).
//
// Uso:
//   node progresso.mjs ./audit/rodada-1/audit-report.json ./audit/rodada-2/audit-report.json
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const [, , aPath, bPath] = process.argv;
if (!aPath || !bPath) {
  console.error("uso: node progresso.mjs <antes.json> <depois.json>");
  process.exit(2);
}
const read = (p) => JSON.parse(fs.readFileSync(path.resolve(p), "utf8"));
const A = read(aPath), B = read(bPath);

const key = (f) => `${f.axis}::${f.id}`;
const failsOf = (r) => new Map(r.findings.filter((f) => f.status === "fail").map((f) => [key(f), f]));
const fa = failsOf(A), fb = failsOf(B);

const resolved = [...fa.values()].filter((f) => !fb.has(key(f)));
const novos = [...fb.values()].filter((f) => !fa.has(key(f)));
const persistem = [...fb.values()].filter((f) => fa.has(key(f)));

const arrow = (d) => (d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : "= 0");
const L = [];
L.push(`# Progresso — rodada ${A.meta.round} → ${B.meta.round}`);
L.push("");
L.push(`\`${B.meta.target}\``);
L.push("");
L.push("| Eixo | Antes | Depois | Δ |");
L.push("|---|---:|---:|---:|");
for (const k of Object.keys(B.scores.per)) {
  const before = A.scores.per[k]?.score, after = B.scores.per[k]?.score;
  const d = before != null && after != null ? after - before : null;
  L.push(`| ${B.scores.per[k].label} | ${before ?? "—"} | ${after ?? "—"} | ${d === null ? "—" : arrow(d)} |`);
}
const dO = (B.scores.overall ?? 0) - (A.scores.overall ?? 0);
L.push(`| **GERAL** | **${A.scores.overall ?? "—"}** | **${B.scores.overall ?? "—"}** | **${arrow(dO)}** |`);
L.push("");
L.push(`P0 abertos: ${A.scores.p0Total} → **${B.scores.p0Total}** · Gate: ${B.scores.gate ? "✅ PASSOU" : "❌ não passou"}`);
L.push("");

const bloco = (titulo, lista, vazio) => {
  L.push(`## ${titulo} (${lista.length})`);
  L.push("");
  if (!lista.length) { L.push(`_${vazio}_`, ""); return; }
  for (const f of lista.sort((x, y) => x.severity.localeCompare(y.severity))) {
    L.push(`- **${f.severity}** \`${f.id}\` — ${f.title}`);
  }
  L.push("");
};
bloco("✅ Resolvidos nesta rodada", resolved, "nada saiu da lista — a rodada não moveu ponteiro.");
bloco("🆕 Apareceram agora (regressão ou achado novo)", novos, "nenhuma regressão: as correções não quebraram nada novo.");
bloco("⏳ Ainda abertos", persistem, "lista limpa.");

// Parada honesta: o loop precisa de um critério que não seja "achei que já deu".
L.push("## Veredito do loop");
L.push("");
if (B.scores.gate) L.push("✅ **Gate atingido** (zero P0 · todos os eixos ≥ 90). Pode encerrar o loop e entregar.");
else if (Math.abs(dO) < 3) L.push(`⏸️ **Platô** (ganho de ${dO} ponto(s) na nota geral). Se a rodada anterior também variou menos de 3, pare o loop e reporte o que travou — insistir aqui é queimar tempo sem mover a nota.`);
else L.push(`🔁 **Vale continuar** (${arrow(dO)} na nota geral). Ataque a próxima faixa de severidade e re-rode.`);
if (novos.length) L.push("", `⚠️ ${novos.length} achado(s) novo(s) — confira se alguma correção desta rodada quebrou outra coisa antes de seguir.`);
L.push("");

const out = path.join(path.dirname(path.resolve(bPath)), "PROGRESSO.md");
fs.writeFileSync(out, L.join("\n"), "utf8");
console.log(L.join("\n"));
console.log(`\n  → ${out}\n`);
