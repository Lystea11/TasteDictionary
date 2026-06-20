# The Five Tastes · 五味辞典

An interactive, editorial **dictionary of taste**. One entry for each of the five
basic tastes — **sweet, sour, bitter, salty, umami** — built from a hand sketch
(`REFERENCE.png`) into a polished single‑page site.

Open `index.html` in any modern browser. No build step, no server.

## Every entry contains

Following the reference layout, each taste is a full dictionary entry:

1. **Meaning 1 — on the tongue** + an **interactive 3-D tongue atlas**: a real tongue
   model (Three.js) with the five classic taste zones labelled and the current taste's
   zone lit in its accent colour. Drag — or use the arrow keys — to rotate it. Below it,
   a **flavour profile**: tappable example-food chips, a typical-intensity meter, and a
   readout.
2. **Meaning 2** and **Meaning 3** — where the word travels beyond food, with example sentences.
3. **How to write it** — an **animated kanji stroke‑order player** on a genkō‑yōshi grid
   (Draw / step / stroke numbers), plus a cumulative **stroke‑by‑stroke** build‑up row
   (一 → 十 → … → 甘), exactly as in the sketch.
4. **Grammar · N5** — the い‑adjective in **dictionary, past, negative and negative‑past**
   forms, each with kana + romaji + gloss.
5. **In the wider language** — **synonym · antonym · idiom**.

| Taste | Word | Kanji | Strokes | Accent |
| --- | --- | --- | --- | --- |
| Sweet | 甘い · amai | 甘 | 5 | dusty rose |
| Sour | 酸っぱい · suppai | 酸 | 14 | citron |
| Bitter | 苦い · nigai | 苦 | 8 | umber |
| Salty | 塩辛い · shiokarai | 塩 | 13 | sea‑slate |
| Umami | 旨い · umai (旨味) | 旨 | 6 | terracotta |

## Notes on accuracy

- All Japanese (readings, conjugations, meanings, synonyms/antonyms, idioms) was
  independently fact‑checked. For umami, the *taste* sense is correctly attributed to the
  noun **うま味 / 旨味**, while the adjective **旨い** means "delicious".
- The tongue atlas shows the **classic** taste-zone map as a teaching aid — in reality
  every taste is sensed across the whole tongue (the "tongue map" is a myth), as the
  caption under each diagram notes.

## Build

- Vanilla HTML / CSS / JS. **GSAP** (CDN) adds scroll parallax and **Three.js** (r136
  UMD, CDN) renders the tongue; everything degrades gracefully without them (the flavour
  panel and a static glyph remain). Motion respects `prefers-reduced-motion`.
- The tongue geometry is extracted from `tongue.glb` into `tongue-geometry.js` (inlined
  base64 typed arrays) and the renderer uses the classic UMD Three build, so the page —
  including the 3-D tongue — runs straight from `file://` with **no build step and no
  server**.
- Type: **Fraunces** (display), **Geist / Geist Mono** (text), **Shippori Mincho /
  Zen Kaku Gothic New** (Japanese).

## Attribution

- Kanji stroke‑order paths © **KanjiVG** (Ulrich Apel), **CC BY‑SA 3.0** —
  <http://kanjivg.tagaini.net>. Source SVGs kept in `assets/kanji/`.
