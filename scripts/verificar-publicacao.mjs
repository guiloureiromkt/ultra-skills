#!/usr/bin/env node
// ============================================================================
// verificar-publicacao.mjs — o gate antes de qualquer skill virar pública.
//
// Existe porque a varredura manual já pegou três vazamentos reais neste mesmo
// repositório, poucos minutos antes de irem ao ar: o caminho de um cofre de
// credenciais, o caminho de uma ferramenta privada, e o setor de um cliente
// identificável numa cicatriz "anonimizada".
//
// Nenhum deles era segredo técnico. Todos eram coisas que fazem sentido na
// máquina de quem escreveu e nenhum sentido no mundo — que é exatamente o tipo
// de erro que passa na revisão de quem escreveu.
//
//   node scripts/verificar-publicacao.mjs
//
// Sai com código 1 se achar bloqueio. Use antes de todo commit que publica.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(process.argv[2] || "skills");

// severidade: "bloqueia" (não pode ir ao ar) · "confere" (olha antes de decidir)
const REGRAS = [
  { id: "caminho-maquina", sev: "bloqueia", re: /C:\\Users\\(?!SEU-USUARIO)[A-Za-z0-9_.-]+|\/Users\/(?!SEU-USUARIO)[A-Za-z0-9_.-]+\//g,
    diz: "caminho da máquina de quem escreveu — não existe no computador de ninguém mais" },
  { id: "caminho-vault", sev: "bloqueia", re: /C:\\GuiOS|C:\/GuiOS|\b(10_Canon|90_Meta|20_Projetos|01_Raw|00_Inbox)\b/g,
    diz: "referência ao vault pessoal — a skill não funciona sem ele" },
  { id: "cofre", sev: "bloqueia", re: /\.secrets|gmail-accounts\.env|id_rsa|\.pem\b/g,
    diz: "caminho de cofre de credenciais" },
  { id: "credencial", sev: "bloqueia", re: /\b(sk-[A-Za-z0-9]{16,}|r8_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{16,}|AIza[A-Za-z0-9_-]{20,})\b/g,
    diz: "isso tem cara de credencial de verdade" },
  { id: "endpoint-privado", sev: "confere", re: /https?:\/\/[a-z0-9.-]*\.(local|internal|vpn)[^\s)"']*|localhost:\d+/g,
    diz: "endereço interno que ninguém de fora alcança" },
  { id: "cliente", sev: "confere", re: /\b(3mais|3mAIs|pipedrive-3mais|spriggan|zupper|kontik|actionaid|gashi)\b/gi,
    diz: "nome de cliente ou projeto interno — confirme se a menção é intencional" },
  { id: "pessoa", sev: "confere", re: /\b(leandro|escobar|bianca|patricia|taubert|speroni|caroline|schlegel)\b/gi,
    diz: "nome de pessoa real — cicatriz precisa ser anônima de verdade, não só sem sobrenome" },
  { id: "email", sev: "confere", re: /\b[a-z0-9._%+-]+@(?!exemplo|example|seu|osite|meusite)[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    diz: "e-mail real no texto" },
];

function arquivos(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    e.isDirectory() ? arquivos(p, acc) : acc.push(p);
  }
  return acc;
}

// Este arquivo contém, por definição, todos os termos que ele procura — as
// próprias regras. Sem se excluir, ele se acusa e o gate nunca passa.
const EU = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const lista = arquivos(RAIZ)
  .filter((f) => /\.(md|json|mjs|js|py|txt|ya?ml)$/i.test(f))
  .filter((f) => path.resolve(f) !== EU);
const achados = [];

for (const f of lista) {
  let texto;
  try { texto = fs.readFileSync(f, "utf8"); } catch { continue; }
  const linhas = texto.split("\n");
  for (const regra of REGRAS) {
    linhas.forEach((linha, i) => {
      regra.re.lastIndex = 0;
      const m = linha.match(regra.re);
      if (!m) return;
      achados.push({
        arquivo: path.relative(process.cwd(), f).replace(/\\/g, "/"),
        linha: i + 1, regra, trecho: [...new Set(m)].join(" · "),
        contexto: linha.trim().slice(0, 110),
      });
    });
  }
}

const bloqueios = achados.filter((a) => a.regra.sev === "bloqueia");
const conferir = achados.filter((a) => a.regra.sev === "confere");

console.log(`\nVERIFICAÇÃO DE PUBLICAÇÃO · ${lista.length} arquivo(s) em ${path.relative(process.cwd(), RAIZ) || "."}`);
console.log("=".repeat(70));

const mostra = (titulo, itens) => {
  if (!itens.length) return;
  console.log(`\n${titulo} (${itens.length})\n`);
  for (const a of itens) {
    console.log(`  ${a.arquivo}:${a.linha}`);
    console.log(`    ${a.regra.diz}`);
    console.log(`    → ${a.trecho}`);
    console.log(`    | ${a.contexto}`);
  }
};
mostra("🔴 BLOQUEIA — não pode ir ao ar assim", bloqueios);
mostra("🟡 CONFERE — pode ser intencional, mas olhe", conferir);

console.log("\n" + "=".repeat(70));
if (!achados.length) {
  console.log("  ✅ Nada encontrado. Pode publicar.\n");
} else {
  console.log(`  ${bloqueios.length} bloqueio(s) · ${conferir.length} para conferir\n`);
}

// Só bloqueio derruba o gate. "Confere" é para o olho humano — travar nele
// treinaria todo mundo a ignorar o verificador, que é como ferramenta morre.
process.exit(bloqueios.length ? 1 : 0);
