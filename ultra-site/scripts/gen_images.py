#!/usr/bin/env python
"""Generate ultra-site boards/assets via Replicate.

Usage:
    python gen_images.py <spec.json> <out_dir> [default_ar=16:9]

spec.json — cada entrada pode ser string ou objeto:
    "board-hero": "prompt..."
    "hero-final": {"prompt": "...", "ar": "16:9", "model": "nano",
                   "resolution": "2K", "refs": ["caminho-local.jpg", "https://..."]}

Models:
    nano (default) = google/nano-banana-pro — direção de arte, 2K, aceita refs
                     (image_input) p/ manter identidade / re-grade.
    flux           = black-forest-labs/flux-dev — barato, texturas/plates.

Writes <out_dir>/<name>.jpg. Run with PYTHONUTF8=1.

Token (nesta ordem, o 1o que existir vence · nunca e impresso):
    1. variavel de ambiente REPLICATE_API_TOKEN   <- o caminho portatil
    2. arquivo .env / .env.local na pasta atual
    3. REPLICATE_ENV_FILE=<caminho> apontando um .env
"""
import os, sys, json, time, base64, mimetypes
from pathlib import Path

# Sem caminho de maquina cravado: a skill roda igual em qualquer computador.
ENV_CANDIDATOS = [
    Path(os.environ["REPLICATE_ENV_FILE"]) if os.environ.get("REPLICATE_ENV_FILE") else None,
    Path.cwd() / ".env.local",
    Path.cwd() / ".env",
]

AJUDA_TOKEN = """
REPLICATE_API_TOKEN nao encontrado.

A ultra-site gera as imagens de direcao de arte no Replicate (pago, por uso).
Custo tipico de um site inteiro: US$ 5 a 15 em imagens. Video de hero custa mais.

Como resolver, em 3 passos:
  1. Crie a conta em https://replicate.com e pegue o token em /account/api-tokens
  2. Guarde o token numa variavel de ambiente:
       Windows (PowerShell, permanente):
         setx REPLICATE_API_TOKEN "r8_seu_token_aqui"
         (feche e abra o terminal depois)
       Mac/Linux:
         echo 'export REPLICATE_API_TOKEN="r8_seu_token_aqui"' >> ~/.zshrc
  3. Rode de novo.

Alternativa: um arquivo .env na pasta do projeto com a linha
  REPLICATE_API_TOKEN=r8_seu_token_aqui
"""

MODELS = {
    "nano": "google/nano-banana-pro",
    "flux": "black-forest-labs/flux-dev",
}


def load_token():
    tok = os.environ.get("REPLICATE_API_TOKEN", "").strip()
    if tok:
        return tok
    for env in ENV_CANDIDATOS:
        if not env or not env.exists():
            continue
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("REPLICATE_API_TOKEN"):
                v = line.split("=", 1)[1].strip().strip('"').strip("'")
                if v:
                    return v
    raise SystemExit(AJUDA_TOKEN)


def as_uri(ref: str) -> str:
    """Local path -> data URI; URL passes through."""
    if ref.startswith(("http://", "https://", "data:")):
        return ref
    p = Path(ref)
    mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def build_input(entry: dict, default_ar: str) -> tuple[str, dict]:
    model = MODELS.get(entry.get("model", "nano"), MODELS["nano"])
    ar = entry.get("ar", default_ar)
    inp = {"prompt": entry["prompt"], "aspect_ratio": ar, "output_format": "jpg"}
    if model == MODELS["nano"]:
        inp["resolution"] = entry.get("resolution", "2K")  # case-sensitive: "2K"!
        refs = [as_uri(r) for r in entry.get("refs", [])]
        if refs:
            inp["image_input"] = refs
    else:
        inp["output_quality"] = 94
    return model, inp


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = Path(sys.argv[2]); out_dir.mkdir(parents=True, exist_ok=True)
    default_ar = sys.argv[3] if len(sys.argv) > 3 else "16:9"

    try:
        import truststore; truststore.inject_into_ssl()  # Windows AVG-SSL
    except Exception:
        pass
    import requests
    tok = load_token()
    H = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "Prefer": "wait"}

    fails = 0
    for name, raw in spec.items():
        entry = {"prompt": raw} if isinstance(raw, str) else dict(raw)
        model, inp = build_input(entry, default_ar)
        url = f"https://api.replicate.com/v1/models/{model}/predictions"
        j = requests.post(url, headers=H, json={"input": inp}, timeout=180).json()
        pid = j.get("id")
        for _ in range(90):
            if j.get("status") in ("succeeded", "failed", "canceled"):
                break
            time.sleep(4)
            j = requests.get(f"https://api.replicate.com/v1/predictions/{pid}", headers=H, timeout=60).json()
        if j.get("status") == "succeeded":
            out = j["output"]; u = out[0] if isinstance(out, list) else out
            (out_dir / f"{name}.jpg").write_bytes(requests.get(u, timeout=180).content)
            print(f"  {name}: OK ({model.split('/')[-1]})")
        else:
            fails += 1
            print(f"  {name}: ERRO {str(j.get('error'))[:160]}")
    print(f"done ({fails} fail)" if fails else "done")


if __name__ == "__main__":
    main()
