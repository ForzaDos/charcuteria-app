from PIL import Image, ImageDraw
import os

BASE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(BASE, "res")

FILL = (199, 91, 69)
RING = (142, 63, 48)
DOT = (247, 231, 216)

# Coordenadas del logo SVG (viewBox 48x48)
DOTS = [(17, 19, 2.4), (28, 16, 1.8), (31, 27, 2.6), (21, 30, 1.7), (24, 23, 1.2)]


def dibujar(diametro_rel, con_relleno, px):
    S = 1024
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = S / 2.0
    r = S * diametro_rel / 2.0

    if con_relleno:
        d.ellipse([c - r, c - r, c + r, c + r], fill=FILL)

    d.ellipse([c - r, c - r, c + r, c + r], outline=RING, width=int(S * 0.062))

    for x, y, rr in DOTS:
        px_ = c + (x - 24) / 24.0 * r
        py_ = c + (y - 24) / 24.0 * r
        rad = rr / 24.0 * r
        d.ellipse([px_ - rad, py_ - rad, px_ + rad, py_ + rad], fill=DOT)

    return img.resize((px, px), Image.LANCZOS)


DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

for nombre, escala in DENS.items():
    carpeta = os.path.join(RES, "mipmap-" + nombre)
    os.makedirs(carpeta, exist_ok=True)

    legacy = int(48 * escala)
    foreground = int(108 * escala)

    # Ícono clásico: la salchicha ocupa casi todo el cuadrado
    dibujar(0.88, True, legacy).save(os.path.join(carpeta, "ic_launcher.png"))
    # Foreground adaptativo: arte dentro de la zona segura (66/108)
    dibujar(0.611, False, foreground).save(os.path.join(carpeta, "ic_launcher_foreground.png"))
    print(nombre, legacy, foreground)
