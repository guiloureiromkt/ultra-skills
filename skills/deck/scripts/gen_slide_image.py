#!/usr/bin/env python
"""ultra:deck · gera as METÁFORAS SEM TEXTO dos slides (Replicate, 16:9). Método herdado da killer-decks.

Uso:
    python -X utf8 gen_slide_image.py <spec.json> <out_dir> [modelo_default]

spec.json: cada entrada é string OU objeto —
    "s01": "prompt sem texto ..."
    "s02": {"prompt": "...", "model": "nano", "ar": "16:9",
            "resolution": "2K", "refs": ["out_dir/s01.jpg", "https://..."]}

REGRA DE OURO: o prompt NUNCA pede texto. O texto entra depois, como HTML nítido.
Todo prompt recebe um sufixo anti-texto automático (não precisa repetir no spec).

modelo (por entrada via "model", ou default global no 3º argumento):
    'flux-pro' (padrão · black-forest-labs/flux-1.1-pro) — barato (~US$0,04/img),
               sem `refs`. Bom pra maioria dos slides (assinatura estética repetida).
    'nano'     (google/nano-banana-pro, ~US$0,15/img) — aceita `refs` (vira
               `image_input`) pra CONTINUIDADE ENCADEADA (passar o slide anterior
               e/ou a imagem-âncora como referência, estilo Nano Banana workflow).
               ⚠️ Ainda é OPT-IN, não o padrão do deck — refs acumula drift entre
               muitos slides; a assinatura estética repetida no prompt continua
               sendo a alavanca primária.
               `refs` aceita path local (relativo ao out_dir ou absoluto) ou URL —
               local vira data URI automaticamente.

Token: variável de ambiente REPLICATE_API_TOKEN (ou um arquivo .env no diretório
atual, linha REPLICATE_API_TOKEN=...). Nunca é impresso.
"""
import os, sys, json, time, base64, mimetypes
from pathlib import Path

ENV = Path(".env")  # fallback opcional — o caminho principal é a env var
NO_TEXT = (" Absolutely NO text, no words, no letters, no numbers, no logos, no captions, "
           "no UI labels, no watermark anywhere in the image.")
MODELS = {
    "flux-pro": "black-forest-labs/flux-1.1-pro",
    "nano": "google/nano-banana-pro",
}


def load_token():
    tok = os.environ.get("REPLICATE_API_TOKEN")
    if tok:
        return tok
    if ENV.exists():
        for line in ENV.read_text(encoding="utf-8").splitlines():
            if line.startswith("REPLICATE_API_TOKEN"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("REPLICATE_API_TOKEN não encontrado — exporte a variável de ambiente ou crie um .env")


def as_uri(ref: str, out_dir: Path) -> str:
    """Local path (absoluto ou relativo ao out_dir) -> data URI; URL/data URI passa direto."""
    if ref.startswith(("http://", "https://", "data:")):
        return ref
    p = Path(ref)
    if not p.is_absolute() and not p.exists():
        p = out_dir / ref
    mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def build_input(entry: dict, default_model: str, out_dir: Path) -> tuple[str, dict]:
    model = MODELS.get(entry.get("model", default_model), MODELS[default_model])
    inp = {
        "prompt": entry["prompt"] + NO_TEXT,
        "aspect_ratio": entry.get("ar", "16:9"),
        "output_format": "jpg",
    }
    if model == MODELS["nano"]:
        inp["resolution"] = entry.get("resolution", "2K")  # case-sensitive: "2K"!
        refs = [as_uri(r, out_dir) for r in entry.get("refs", [])]
        if refs:
            inp["image_input"] = refs
    else:
        inp["output_quality"] = entry.get("output_quality", 95)
        inp["prompt_upsampling"] = True
        inp["safety_tolerance"] = 2
    return model, inp


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = Path(sys.argv[2]); out_dir.mkdir(parents=True, exist_ok=True)
    default_model = sys.argv[3] if len(sys.argv) > 3 else "flux-pro"
    if default_model not in MODELS:
        default_model = "flux-pro"

    try:
        import truststore; truststore.inject_into_ssl()   # Windows AVG-SSL MITM
    except Exception:
        pass
    import requests
    tok = load_token()
    H = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "Prefer": "wait"}

    ok = 0
    for name, raw in spec.items():
        entry = {"prompt": raw} if isinstance(raw, str) else dict(raw)
        model, inp = build_input(entry, default_model, out_dir)
        url = f"https://api.replicate.com/v1/models/{model}/predictions"
        j = requests.post(url, headers=H, json={"input": inp}, timeout=180).json()
        pid = j.get("id")
        for _ in range(90):
            if j.get("status") in ("succeeded", "failed", "canceled"):
                break
            time.sleep(3)
            j = requests.get(f"https://api.replicate.com/v1/predictions/{pid}", headers=H, timeout=60).json()
        if j.get("status") == "succeeded":
            out = j["output"]; u = out[0] if isinstance(out, list) else out
            (out_dir / f"{name}.jpg").write_bytes(requests.get(u, timeout=180).content)
            print(f"  {name}: OK ({model.split('/')[-1]})"); ok += 1
        else:
            print(f"  {name}: ERRO {str(j.get('error'))[:160]}")
    print(f"done ({ok}/{len(spec)})")


if __name__ == "__main__":
    main()
