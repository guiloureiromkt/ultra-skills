#!/usr/bin/env bash
set -e
mkdir -p site
cat > site/index.html <<'HTML'
<!doctype html>
<html lang="pt-BR"><head>
<title>Marca Certa | Material de construção em São Paulo</title>
<meta name="description" content="Loja de material de construção em São Paulo com entrega em 24 horas na capital e preço de atacado para obra.">
<meta name="robots" content="max-image-preview:large, max-snippet:0">
<link rel="canonical" href="https://www.marca-certa.com.br/">
<script src="/app.js"></script>
</head><body>
<h1>Material de construção com entrega em 24 horas</h1>
<p>Somos uma agência de comunicação e marketing com 25 anos de estrada e atendemos marcas nacionais e internacionais de diversos setores.</p>
<h2>Quanto custa a entrega?</h2>
<p>Entrega grátis acima de R$ 500 na capital; abaixo disso, R$ 39.</p>
<video autoplay loop><source src="/loja.mp4"></video>
<img src="/loja.jpg">
<form><input name="email" type="email"><button>Enviar</button></form>
</body></html>
HTML
cat > site/robots.txt <<'TXT'
User-agent: *
Allow: /

User-agent: Claude-SearchBot
Disallow: /

Sitemap: https://www.marca-certa.com.br/sitemap.xml
TXT
printf '<urlset><url><loc>https://www.marca-certa.com.br/</loc></url></urlset>' > site/sitemap.xml
