#!/bin/sh
# Playfair Display ve Inter değişken TTF'lerinden self-host woff2 üretir.
# Kaynak TTF'ler eski bundle'dan tools/unbundle.py ile çıkarılır (git geçmişindeki index.html).
#   sh tools/subset-fonts.sh <ttf-klasoru>
# Gereksinim: pip install fonttools brotli
# - Ağırlık ekseni 400–700'e daraltılır (sitede kullanılan aralık)
# - Latin + Latin Extended-A (Türkçe karakterler) + tipografik noktalama, ₺, oklar
# - Yalnızca tarayıcının varsayılan uyguladığı OpenType özellikleri + site CSS'indeki cv01/cv03/ss03
set -e
SRC=${1:?ttf klasoru}
OUT=$(dirname "$0")/../assets/fonts
TMP=$(mktemp -d)
U="U+0000-00FF,U+0100-017F,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+20BA,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"
sub() { # $1 kaynak-id  $2 çıktı-adı  $3 özellikler
  python3 -m fontTools.varLib.instancer "$SRC/$1.ttf" wght=400:700 -o "$TMP/$2.ttf" -q
  python3 -m fontTools.subset "$TMP/$2.ttf" --unicodes="$U" --layout-features="$3" --flavor=woff2 --output-file="$OUT/$2.woff2"
}
PF='calt,ccmp,locl,liga,rlig,kern,mark,mkmk'
IN='calt,ccmp,locl,cv01,cv03,ss03,kern,mark,mkmk,liga,rlig'
sub 51d2ca68-51e5-408d-bfc7-181407e807ca playfair-display "$PF"
sub 66a50aca-c4d3-4bbc-876a-82289d9bac84 playfair-display-italic "$PF"
sub a5a44645-9ad5-4a0e-99a0-91add3609f2e inter "$IN"
sub f8b793f6-85bf-4afa-a1ab-ff7ff46bc142 inter-italic "$IN"
rm -rf "$TMP"
