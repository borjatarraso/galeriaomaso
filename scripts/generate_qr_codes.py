#!/usr/bin/env python3
"""Generate marketing QR codes for galeriaomaso.com and enriquetahueso.com.

Each QR encodes a vCard 3.0 so the URL, phone, email (and socials, for the
gallery) travel with the code. Two outputs per site:

  * <slug>.svg / <slug>.png      raw QR, vector + 2000px PNG, for embedding
  * <slug>_card.png              printable card with caption + URL, 300dpi

vCard format keeps a URL field that modern scanners render as a tappable link,
so a user can still jump straight to the website from the contact preview.
"""
from __future__ import annotations

import os
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from qrcode.image.svg import SvgPathImage
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "qr-codes"
OUT.mkdir(parents=True, exist_ok=True)

PHONE_DISPLAY = "+34 639 99 03 92"
PHONE_RAW = "+34639990392"
EMAIL = "enriqueta.hueso@gmail.com"

GALERIA_URL = "https://www.galeriaomaso.com"
ARTIST_URL = "https://www.enriquetahueso.com"

SOCIALS = {
    "linkedin":  "https://es.linkedin.com/in/enriqueta-hueso-martinez-24837622",
    "facebook":  "https://www.facebook.com/share/1Dm8mgkBGz/",
    "instagram": "https://www.instagram.com/enriquetahueso",
    "twitter":   "https://x.com/EnriquetaHueso",
    "tiktok":    "https://www.tiktok.com/@enriquetahueso",
}

# vCard 3.0 line endings must be CRLF per RFC 6350.
CRLF = "\r\n"


def build_vcard(*, full_name: str, org: str, primary_url: str,
                include_socials: bool) -> str:
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"N:Hueso Martínez;Enriqueta;;;",
        f"FN:{full_name}",
        f"ORG:{org}",
        f"TEL;TYPE=CELL,VOICE:{PHONE_RAW}",
        f"EMAIL;TYPE=INTERNET:{EMAIL}",
        f"URL:{primary_url}",
    ]
    if include_socials:
        for label, url in SOCIALS.items():
            lines.append(f"URL;TYPE={label}:{url}")
    lines.append("END:VCARD")
    return CRLF.join(lines) + CRLF


def make_qr(payload: str) -> qrcode.QRCode:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=20,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    return qr


def save_svg(qr: qrcode.QRCode, path: Path) -> None:
    img = qr.make_image(image_factory=SvgPathImage)
    img.save(str(path))


def save_png(qr: qrcode.QRCode, path: Path, *, size: int = 2000) -> None:
    img = qr.make_image(fill_color="#111111", back_color="white").convert("RGB")
    img = img.resize((size, size), Image.NEAREST)
    img.save(path, "PNG", optimize=True)


def make_card(qr_png: Path, out_path: Path, *, title: str, subtitle: str,
              footer: str) -> None:
    """Composite a printable card: QR + caption, A6-ish portrait at 300 dpi."""
    W, H = 1240, 1748  # ~A6 portrait at 300dpi (105 x 148 mm)
    bg = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(bg)

    font_dir = "/usr/share/fonts/dejavu-sans-fonts"
    font_title    = ImageFont.truetype(f"{font_dir}/DejaVuSans-Bold.ttf", 72)
    font_subtitle = ImageFont.truetype(f"{font_dir}/DejaVuSans.ttf",       40)
    font_footer   = ImageFont.truetype(f"{font_dir}/DejaVuSans.ttf",       32)

    def centered(text: str, font: ImageFont.FreeTypeFont, y: int, fill="#111"):
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((W - w) // 2, y), text, font=font, fill=fill)

    centered(title, font_title, 120)
    centered(subtitle, font_subtitle, 230, fill="#555")

    qr_img = Image.open(qr_png).convert("RGB")
    qr_size = 900
    qr_img = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    bg.paste(qr_img, ((W - qr_size) // 2, 360))

    centered("Escanéame", font_subtitle, 1310, fill="#555")
    centered(footer, font_footer, 1400, fill="#111")
    centered(f"Tel. {PHONE_DISPLAY}   ·   {EMAIL}",
             ImageFont.truetype(f"{font_dir}/DejaVuSans.ttf", 26),
             1480, fill="#555")

    # Hairline border for a printable feel.
    draw.rectangle([(20, 20), (W - 20, H - 20)], outline="#111", width=3)

    bg.save(out_path, "PNG", optimize=True, dpi=(300, 300))


def emit(slug: str, *, full_name: str, org: str, primary_url: str,
         include_socials: bool, card_title: str, card_subtitle: str) -> None:
    payload = build_vcard(
        full_name=full_name,
        org=org,
        primary_url=primary_url,
        include_socials=include_socials,
    )
    # Save raw vCard for reference.
    (OUT / f"{slug}.vcf").write_text(payload, encoding="utf-8")

    qr = make_qr(payload)
    save_svg(qr, OUT / f"{slug}.svg")
    png_path = OUT / f"{slug}.png"
    save_png(qr, png_path)
    make_card(
        png_path,
        OUT / f"{slug}_card.png",
        title=card_title,
        subtitle=card_subtitle,
        footer=primary_url.replace("https://", "").replace("www.", "www."),
    )
    bytes_used = len(payload.encode("utf-8"))
    print(f"  {slug}: vCard {bytes_used} bytes  ->  svg, png (2000px), card (A6 300dpi)")


def main() -> None:
    print(f"Writing to {OUT}")
    emit(
        "galeriaomaso",
        full_name="Galería O+O — Enriqueta Hueso",
        org="Galería O+O",
        primary_url=GALERIA_URL,
        include_socials=True,
        card_title="Galería O+O",
        card_subtitle="galeriaomaso.com",
    )
    emit(
        "enriquetahueso",
        full_name="Enriqueta Hueso Martínez",
        org="Enriqueta Hueso — Artista",
        primary_url=ARTIST_URL,
        include_socials=False,
        card_title="Enriqueta Hueso",
        card_subtitle="enriquetahueso.com",
    )
    print("Done.")


if __name__ == "__main__":
    main()
