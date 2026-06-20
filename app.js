/* =========================================================================
   THE FIVE TASTES — 五味辞典
   Interactive engine: data, rendering, kanji stroke-order player,
   palate diagram, scroll choreography.
   Kanji stroke paths © KanjiVG (Ulrich Apel), CC BY-SA 3.0.
   ========================================================================= */
(() => {
  "use strict";
  const SVGNS = "http://www.w3.org/2000/svg";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------- KANJI STROKES */
  /* viewBox 0 0 109 109, drawn in canonical stroke order. */
  const KANJI = {
    sweet: { char: "甘", strokes: [
      "M13.75,39.2c3,1.07,7.02,0.69,10.14,0.38c13.36-1.31,40.11-3.96,59.61-4.9c3.67-0.18,7.99-0.18,10.99,0.61",
      "M35.17,20c1.06,1.06,1.21,2.38,1.21,4c0,5.13,0.04,42.56,0.02,64.62c0,2.83-0.01,5.41-0.01,7.62",
      "M70.87,14c1.07,1.06,1.46,2.5,1.46,4c0,0.68,0.02,48.38,0.03,68.38c0,4.98,0,8.23,0,8.62",
      "M37.5,61.75c4.25-0.5,30.75-3,33.75-3",
      "M37.25,89.75c6.5-0.25,28-1.75,34-2",
    ]},
    sour: { char: "酸", strokes: [
      "M11.29,23.16c1.96,0.71,3.94,0.69,5.83,0.49c7.18-0.76,21.06-3.17,23.64-3.4c1.57-0.15,3.34-0.62,4.68-0.13",
      "M12.13,39.64c0.87,0.87,1.33,2.36,1.33,3.73c0,0.91-0.03,43.06-0.03,43.52c0,0.46,0.03,2.86,0.03,4.36",
      "M14.16,41.31c8.34-1.18,20.84-2.93,26.1-3.51c2.25-0.25,4.09,1.09,4.09,3.67c0,1.44-0.47,32.83-0.46,42.81c0,1.03,0.11,3.97,0.11,4.66",
      "M23.47,25.49c0.83,0.83,1.27,2.57,1.19,4.06C24,42.38,23,53.5,17.27,63.7",
      "M31.38,23.66c0.86,0.86,1.29,2.18,1.29,3.9c0,5.81,0.06,16.23,0.02,22.98c-0.03,5.86,1.06,6.82,4.04,6.82c3.02,0,4.65-0.11,5.39-0.86",
      "M14.33,72.95c10.67-1.58,19.8-2.83,28.47-3.19",
      "M14.43,87.95c7.82-0.82,20.19-2.29,28.36-2.71",
      "M66.66,12c0.34,1,0.21,2.31-0.1,2.83c-3.43,5.8-7.43,11.05-11.24,16.07c-1.48,1.94-1.9,3.48,0.88,3.02C62.96,32.8,76,29.62,84.8,27.5",
      "M78.4,20.51c4.2,2.36,10.85,9.7,11.91,13.37",
      "M61.56,39.36c0.1,1.02-0.07,1.98-0.51,2.9c-1.43,3.46-5.31,8.8-10.61,12.66",
      "M76.73,33.05c0.67,0.67,1.16,1.95,1.16,3.27c0,3.73,0,5.86,0,8.4c0,5.93,4.26,5.26,8.45,5.26c4.42,0,7.17-0.72,7.95-2.2",
      "M65.35,51.5c0.28,0.75,0.34,1.87,0.16,2.77c-1.06,5.31-7.15,16.96-15.48,24.09",
      "M66.75,59.81c0.25,0.03,1.33,0,2.05-0.09c2.37-0.29,9.21-2.61,12.59-3.5c2.32-0.61,3.87,1.21,2.64,3.6C78.12,71.25,65,88.38,49.67,95.5",
      "M60.81,67.18C67.88,73,78.69,82.92,86.48,88.95c2.53,1.95,4.52,3.3,7.52,4.68",
    ]},
    bitter: { char: "苦", strokes: [
      "M19.5,29.65c3.31,0.68,6.61,0.8,9.93,0.43c17.14-1.91,33.6-3.07,52.71-4.02c3.38-0.14,6.75,0.05,10.1,0.58",
      "M37.25,15.25c1.06,1.06,1.38,2.25,1.5,3.5C39.53,26.53,40.09,31.42,41,39",
      "M71.5,13.75c0.42,1.18,0.6,2.52,0.25,4c-1.5,6.25-2.5,11-4.5,19.5",
      "M15.62,56.19c3.46,0.6,6.92,0.72,10.36,0.27c17-2.22,37.18-3.78,56.63-4.78c3.97-0.2,7.93-0.16,11.89,0.23",
      "M52.83,36.75c1.02,1.02,1.56,2.62,1.56,3.71c0,8.42,0.02,21.42,0.02,29.04",
      "M33.02,71.09c0.82,0.82,1.42,1.87,1.59,3.02c0.84,5.74,1.9,11.46,2.93,18.62c0.18,1.27,0.36,2.53,0.54,3.78",
      "M35.1,72.45c10.08-0.93,31.36-3.31,38.23-3.46c2.84-0.06,4.22,2.34,3.88,3.74c-1.34,5.4-3.09,11.28-5.05,17.96",
      "M39.51,93.83c8.69-0.54,19.65-1.53,29.62-2.19c1.62-0.11,3.15-0.2,4.55-0.27",
    ]},
    salty: { char: "辛", strokes: [
      "M54,13 C56,18 57,22 57,27",
      "M34,31 C45,30 62,29 75,29",
      "M43,39 C47,44 49,48 50,53",
      "M67,38 C64,44 61,49 58,54",
      "M28,59 C42,58 66,56 82,56",
      "M54,58 C54,68 54,82 54,96",
      "M27,79 C42,78 67,76 83,76",
    ]},
    umami: { char: "旨", strokes: [
      "M73.8,13.56c0,1.31-0.68,2.39-1.58,2.92c-10.47,6.26-23.35,10.64-43.35,15.64",
      "M25.23,12.75c0.95,0.95,1.14,2.25,1.14,3.54c0,3.71-0.11,9.71-0.11,17.11c0,11.59,2,12.66,28.91,12.66C81,46.06,82.75,44,82.75,35.25",
      "M31.52,60.05c0.73,0.95,0.98,2.18,0.98,3.33c0,0.85,0.11,19.25,0.11,29.11c0,3.17-0.06,5.34-0.06,5.49",
      "M33.4,62.19c2.94-0.13,30.17-2.82,37.85-3.49c3.82-0.33,5.37,0.3,5.37,4.18c0,5.74,0.05,19.8,0.06,27.88c0,3.27,0.01,5.51,0.01,5.73",
      "M33.72,77.42c6.65-0.67,35.03-2.42,41.63-2.57",
      "M33.77,94.48c9.04-0.61,30.56-1.75,41.82-2.28",
    ]},
  };

  const UMAMI_WORD_STROKES = {
    foodScience: [
      { char: "う", strokes: [
        "M42,15.5c5.62,2.12,9.62,3,12.88,3c8.27,0,8,1.12-0.38,5.5",
        "M33,42.38c2.12,1.12,4.12,2.88,8.5,1.38c4.38-1.5,12.75-7.12,18.5-7c5.75,0.12,10.25,5,10.25,18c0,15.49-8.25,30.24-24.37,41.24",
      ]},
      { char: "ま", strokes: [
        "M29.83,32.28c2.2,1.15,4.43,1.5,7.14,1.26c11.54-1.04,25.94-3.12,34.66-4.85c2.87-0.57,5.45-0.44,7.13-0.44",
        "M33.83,51.84c2.45,1.61,4.94,1.72,7.94,1.26c9.52-1.46,17.87-3.1,27.03-5.16c3.22-0.72,6.34-1.32,8.21-1.32",
        "M55.81,14c1.52,1.8,1.8,4.57,1.8,7.19c0,2.63,0.46,43.88,0.46,54.25c0,21.3-30.07,19.96-30.07,9.86c0-10.79,25.88-9.93,38.57-3.18c6.12,3.25,11.55,6.38,14.8,9.13",
      ]},
      { char: "味", strokes: [
        "M10.46,35.58c0.79,0.79,1.25,2.27,1.43,3.67c0.57,4.36,1.33,11.99,2.07,18.99c0.17,1.56,0.33,3.09,0.49,4.54",
        "M12.64,37.37c4.54-0.72,13.77-2.2,18.75-2.73c3.08-0.32,4.74,1.14,4.01,4.27c-1.06,4.55-2.56,11.44-3.57,17.68",
        "M14.17,58.88c3.12,0,10.34-0.95,15.96-1.42c1.54-0.13,2.95-0.22,4.13-0.25",
        "M45.31,32.77c1.8,0.63,4.34,0.76,6.2,0.59c7.33-0.64,16.7-2.27,24.62-3.07c1.82-0.18,4.04-0.33,5.84,0.05",
        "M40.13,51.5c2.36,0.73,5.09,0.73,7.5,0.38c8.62-1.26,23.37-3.03,36.12-4.3c2.47-0.25,5.16-0.29,7.63,0.17",
        "M61.68,11.5c1.41,1.41,1.93,3.25,1.93,4.75c0,0.88-0.01,54.18-0.02,75.5c0,3.68,0,6.41,0,7.75",
        "M61,51.12c0,1.97-0.91,3.63-1.98,5.21c-7.06,10.48-19.73,23.07-30.64,28.54",
        "M64.65,50.62c3.78,5.82,16.49,19.94,23.74,26.88c2.02,1.93,3.61,3.5,6.36,4.75",
      ]},
    ],
  };
  UMAMI_WORD_STROKES.savory = [
    { char: "旨", strokes: KANJI.umami.strokes },
    { char: "味", strokes: UMAMI_WORD_STROKES.foodScience[2].strokes },
  ];

  /* --------------------------------------------------------------- DATA */
  const TASTES = [
    {
      id: "sweet", en: "Sweet", jp: "甘い", reading: "あまい", romaji: "amai", pos: "い-adjective",
      kanji: { char: "甘", on: "カン", kun: "あま (い)", strokes: 5, radical: "甘", radicalMeaning: "sweet" },
      palate: { intensity: 4, note: "Conceptual map — every taste is sensed across the whole tongue.",
        examples: [
          { kj: "砂糖", rj: "satō", en: "sugar" },
          { kj: "蜂蜜", rj: "hachimitsu", en: "honey" },
          { kj: "桃", rj: "momo", en: "peach" },
          { kj: "餡", rj: "an", en: "red-bean paste" },
        ]},
      m1: {
        lede: "Taste of the tongue, with a taste like sugar.",
        examples: [
          { jp: "このコーヒーは甘い。", en: "This coffee is sweet." },
          { jp: "甘いチョコレートは好（す）きですか。", en: "Do you like sweet chocolate?" },
          { jp: "この酒（さけ）は私には甘すぎる。", en: "This sake tastes too sweet for me." },
        ],
        pills: [["Dictionary", "甘い (あまい)"], ["Pronunciation", "amai"], ["Antonym", "辛い (からい)"]],
      },
      senses: [
        {
          n: "2",
          title: "Overly optimistic · naive",
          body: "Taking an overly optimistic view of a situation or outlook, usually in a negative way. 考えが甘い does not mean 'sweet thinking'; it means naive thinking. 甘く見る means to take things too easy, and 読みが甘い means short-sighted, not thorough enough, or misjudging a situation. 〜すぎる expresses 'too much' or 'overly'.",
          examples: [
            { jp: "考（かんが）えが甘い。", en: "Naive thinking." },
            { jp: "甘く見（み）る。", en: "To take things too easy." },
            { jp: "読（よ）みが甘い。", en: "Not thorough enough; to misjudge a situation." },
            { jp: "彼（かれ）はテストを甘く見（み）ている。", en: "He underestimates the test." },
            { jp: "彼女（かのじょ）の計画（けいかく）は甘すぎる。", en: "Her plan is way too unrealistic." },
          ],
        },
        {
          n: "3",
          title: "Lenient · lax",
          body: "Not severe in judgments, evaluations, or treatments. 甘い先生 does not mean 'sweet teacher'; it means a lenient teacher.",
          examples: [
            { jp: "自分（じぶん）に甘い。", en: "To be too easy on oneself." },
            { jp: "彼（かれ）は子（こ）どもに甘い。", en: "He is lenient with the kids." },
            { jp: "先生（せんせい）は点数（てんすう）を甘くつけた。", en: "The teacher gave a lenient score / grade." },
          ],
        },
      ],
      grammar: [
        { form: "Dictionary", jp: "甘い", kana: "あまい", romaji: "amai", en: "is sweet" },
        { form: "Past", jp: "甘かった", kana: "あまかった", romaji: "amakatta", en: "was sweet" },
        { form: "Negative", jp: "甘くない", kana: "あまくない", romaji: "amakunai", en: "is not sweet" },
        { form: "Neg. past", jp: "甘くなかった", kana: "あまくなかった", romaji: "amakunakatta", en: "was not sweet" },
      ],
      relations: {
        syn: { kind: "Expression", term: "甘いマスク", rj: "amai masuku", gloss: "A beautiful face; mainly used to call someone handsome or charming." },
        ant: { term: "辛い", rj: "karai", gloss: "Hot, spicy, salty, or dry in taste. このカレーは辛い means 'This curry is hot'; 辛い酒 means dry sake." },
        idiom: { term: "甘い汁を吸う", rj: "amai shiru o suu", lit: "to suck the sweet juice", gloss: "To get profit without making an effort by exploiting others." },
        extra: [
          { kind: "Idiom", term: "甘い言葉", rj: "amai kotoba", lit: "sweet words", gloss: "Sweet talk; in Japanese it can imply manipulating or scamming someone, while in English it often carries the meaning of gentle talk." },
        ],
      },
    },
    {
      id: "sour", en: "Sour", jp: "酸っぱい", reading: "すっぱい", romaji: "suppai", pos: "い-adjective",
      kanji: { char: "酸", on: "サン", kun: "す (い)", strokes: 14, radical: "酉", radicalMeaning: "wine jar" },
      palate: { intensity: 4, note: "Conceptual map — every taste is sensed across the whole tongue.",
        examples: [
          { kj: "酢", rj: "su", en: "vinegar" },
          { kj: "梅", rj: "ume", en: "ume plum" },
          { kj: "レモン", rj: "remon", en: "lemon" },
          { kj: "杏", rj: "anzu", en: "apricot" },
        ]},
      m1: {
        lede: "Taste on the tongue: having a sharp, sometimes unpleasant, taste or smell.",
        examples: [
          { jp: "このレモンは酸っぱい。", en: "This lemon is sour." },
          { jp: "この梅干（うめぼ）しは酸っぱい。", en: "This pickled plum is sour." },
          { jp: "ワインに酸っぱみがある。", en: "The wine has a sour taste." },
        ],
        pills: [["Dictionary", "酸っぱい (すっぱい)"], ["Pronunciation", "suppai"], ["Smell examples", "sweat, vinegar, rotten food"]],
      },
      senses: [
        {
          n: "2",
          title: "Unpleasant smell",
          body: "酸っぱい can describe smell as well as taste. A sour smell usually indicates sweat, but it can also include rotten food or vinegar.",
          examples: [
            { jp: "酸っぱい匂（にお）いがする。", en: "It smells sour." },
            { jp: "酸っぱい汗（あせ）のにおい。", en: "A sour smell of sweat." },
            { jp: "この牛乳（ぎゅうにゅう）は酸っぱいです。", en: "This milk tastes sour; it has spoiled." },
            { jp: "タオルが酸っぱくなっている。", en: "The towel has become sour-smelling." },
          ],
        },
      ],
      grammar: [
        { form: "Dictionary", jp: "酸っぱい", kana: "すっぱい", romaji: "suppai", en: "is sour" },
        { form: "Past", jp: "酸っぱかった", kana: "すっぱかった", romaji: "suppakatta", en: "was sour" },
        { form: "Negative", jp: "酸っぱくない", kana: "すっぱくない", romaji: "suppakunai", en: "is not sour" },
        { form: "Neg. past", jp: "酸っぱくなかった", kana: "すっぱくなかった", romaji: "suppakunakatta", en: "was not sour" },
      ],
      relations: {
        syn: { term: "酸い", rj: "sui", gloss: "Sour; an older or more literary form related to 酸っぱい." },
        ant: { term: "甘い", rj: "amai", gloss: "Sweet; the common taste contrast with sour." },
        idiom: { term: "口を酸っぱくして", rj: "kuchi o suppaku shite", lit: "to make one's mouth sour", gloss: "To tell someone the same thing over and over until the person's mouth tastes sour; to repeatedly give advice or warnings." },
      },
    },
    {
      id: "bitter", en: "Bitter", jp: "苦い", reading: "にがい", romaji: "nigai", pos: "い-adjective",
      kanji: { char: "苦", on: "ク", kun: "にが (い) · くる (しい)", strokes: 8, radical: "艹", radicalMeaning: "grass" },
      palate: { intensity: 4, note: "Conceptual map — every taste is sensed across the whole tongue.",
        examples: [
          { kj: "珈琲", rj: "kōhī", en: "coffee" },
          { kj: "ゴーヤ", rj: "gōya", en: "bitter melon" },
          { kj: "茶", rj: "cha", en: "green tea" },
          { kj: "カカオ", rj: "kakao", en: "cacao" },
        ]},
      m1: {
        lede: "Taste on the tongue: an unpleasantly sharp, astringent, or lingering flavor that causes a slight drying or puckering sensation in the mouth.",
        examples: [
          { jp: "このビールは少（すこ）し苦いです。", en: "This beer is a little bitter." },
          { jp: "苦いチョコレートが好（す）きです。", en: "I like bitter chocolate." },
          { jp: "苦い薬（くすり）はよく効（き）きます。", en: "Bitter medicine works well." },
        ],
        pills: [["Dictionary", "苦い (にがい)"], ["Pronunciation", "nigai"], ["Notes", "薬 means medicine; 効く means to be effective"]],
      },
      senses: [
        {
          n: "2",
          title: "Hard · painful experience",
          body: "A hard or painful experience that carries unpleasant feelings.",
          examples: [
            { jp: "苦い経験（けいけん）をした。", en: "I had a bitter experience." },
            { jp: "それは学生（がくせい）の時（とき）の苦い思（おも）い出です。", en: "That is a bitter memory from my school days." },
          ],
        },
        {
          n: "3",
          title: "Sad · regrettable · bittersweet feeling",
          body: "A feeling that is sad, disappointing, regrettable, harsh, or bittersweet.",
          examples: [
            { jp: "ほろ苦い恋（こい）。", en: "A bittersweet romance." },
            { jp: "苦い気持（きも）ちの一日でした。", en: "It was a day filled with bitter feelings." },
          ],
        },
      ],
      grammar: [
        { form: "Dictionary", jp: "苦い", kana: "にがい", romaji: "nigai", en: "is bitter" },
        { form: "Past", jp: "苦かった", kana: "にがかった", romaji: "nigakatta", en: "was bitter" },
        { form: "Negative", jp: "苦くない", kana: "にがくない", romaji: "nigakunai", en: "is not bitter" },
        { form: "Neg. past", jp: "苦くなかった", kana: "にがくなかった", romaji: "nigakunakatta", en: "was not bitter" },
      ],
      relations: {
        syn: { term: "ほろ苦い", rj: "horonigai", gloss: "Slightly bitter." },
        ant: { term: "甘い", rj: "amai", gloss: "Sweet; the common taste contrast with bitter." },
        idiom: { term: "苦い顔をする", rj: "nigai kao o suru", lit: "to make a bitter face", gloss: "To show unpleasant feelings by making a sour face." },
      },
    },
    {
      id: "salty", en: "Spicy / Salty", jp: "辛い", reading: "からい", romaji: "karai", pos: "い-adjective",
      kanji: { char: "辛", on: "シン", kun: "から (い)", strokes: 7, radical: "辛", radicalMeaning: "bitter/spicy" },
      palate: { intensity: 5, note: "Conceptual map — every taste is sensed across the whole tongue.",
        examples: [
          { kj: "カレー", rj: "karē", en: "curry" },
          { kj: "辛口の酒", rj: "karakuchi no sake", en: "dry sake" },
          { kj: "スープ", rj: "sūpu", en: "salty soup" },
          { kj: "唐辛子", rj: "tōgarashi", en: "chili pepper" },
        ]},
      m1: {
        lede: "Having a hot, spicy, salty, or dry taste.",
        noteLabel: "Usage note",
        note: "辛い can mean the tingling heat of chili peppers, but it can also describe something salty or dry, such as 辛口のお酒. When 辛い means hot or spicy, its opposite is 甘い in the sense of mild or less spicy, not necessarily sweet-tasting.",
        pills: [["Dictionary", "辛い (からい)"], ["Pronunciation", "karai"], ["Antonym", "甘い (あまい)"]],
      },
      senses: [
        {
          n: "2",
          title: "Strict · harsh",
          body: "辛い can describe severe judgments and evaluations. The opposite in this sense is 甘い, meaning lenient or easy.",
          examples: [
            { jp: "あの先生は採点が辛い。", en: "That teacher grades strictly." },
            { jp: "この人の意見は辛い。", en: "That person's opinion is harsh." },
          ],
        },
        {
          n: "3",
          title: "からい vs つらい",
          body: "辛い can also be read つらい, but the meaning changes. つらい describes mental or physical suffering, or difficulty. Since Japanese dictionaries are searched by hiragana pronunciation rather than kanji, this dictionary focuses only on からい.",
          ex: { jp: "辛い（からい） / 辛い（つらい）", en: "Same kanji, different readings and meanings." },
        },
      ],
      grammar: [
        { form: "Dictionary", jp: "辛い", kana: "からい", romaji: "karai", en: "is spicy / salty / dry" },
        { form: "Past", jp: "辛かった", kana: "からかった", romaji: "karakatta", en: "was spicy / salty / dry" },
        { form: "Negative", jp: "辛くない", kana: "からくない", romaji: "karakunai", en: "is not spicy / salty / dry" },
        { form: "Neg. past", jp: "辛くなかった", kana: "からくなかった", romaji: "karakunakatta", en: "was not spicy / salty / dry" },
      ],
      relations: {
        syn: { term: "辛口", rj: "karakuchi", gloss: "Dry, spicy, or critical depending on context, as in 辛口のお酒 or 辛口のレビュー." },
        ant: { term: "甘い", rj: "amai", gloss: "Sweet, mild, or lenient depending on context." },
        idiom: { term: "辛口のレビュー", rj: "karakuchi no rebyū", lit: "a dry/spicy review", gloss: "A harsh review or a critical opinion." },
        extra: [
          { kind: "Expression", term: "辛口カレー", rj: "karakuchi karē", lit: "spicy curry", gloss: "Hot or spicy curry, opposite of 甘口 curry, which is mild or not spicy." },
        ],
      },
    },
    {
      id: "umami", en: "Umami", jp: "うま味・旨味", reading: "うまみ", romaji: "umami", pos: "noun",
      kanji: { char: "旨", on: "シ", kun: "うま (い) · むね", strokes: 6, radical: "日", radicalMeaning: "sun" },
      palate: { intensity: 5, note: "Conceptual map — every taste is sensed across the whole tongue.",
        examples: [
          { kj: "出汁", rj: "dashi", en: "stock" },
          { kj: "昆布", rj: "konbu", en: "kelp" },
          { kj: "椎茸", rj: "shiitake", en: "shiitake" },
          { kj: "トマト", rj: "tomato", en: "tomato" },
        ]},
      m1: {
        lede: "Taste on the tongue: a strong taste that is not sweet, sour, salty, or bitter and is often called the fifth taste.",
        examples: [
          { jp: "トマトにはうま味があります。", en: "Tomatoes contain umami." },
          { jp: "だしは日本料理（にほんりょうり）のうま味のもとです。", en: "Dashi is the source of umami in Japanese cooking." },
        ],
        pills: [["Dictionary", "うま味・旨味"], ["Pronunciation", "umami"], ["Meaning", "the fifth taste"]],
      },
      senses: [
        {
          n: "2",
          title: "Savory richness",
          body: "In everyday Japanese, umami is spelled 旨み or 旨味, meaning savory richness or delicious flavor. In food science and nutrition, umami is written as うま味 and refers specifically to the fifth basic taste.",
          examples: [
            { jp: "このスープは旨みが強（つよ）い。", en: "This soup has a strong savory flavor." },
            { jp: "魚（さかな）の旨味がよく出（で）ている。", en: "The fish's flavor is brought out well." },
            { jp: "肉（にく）の旨みを引（ひ）き出（だ）す。", en: "To bring out the meat's flavor." },
          ],
        },
      ],
      grammar: [
        { form: "Dictionary", jp: "うま味", kana: "うまみ", romaji: "umami", en: "umami; the fifth taste" },
        { form: "Everyday spelling", jp: "旨み", kana: "うまみ", romaji: "umami", en: "savory richness" },
        { form: "Kanji spelling", jp: "旨味", kana: "うまみ", romaji: "umami", en: "savory richness / delicious flavor" },
      ],
      relations: {
        syn: { kind: "Everyday spelling", term: "旨み", rj: "umami", gloss: "Everyday spelling for savory richness or delicious flavor." },
        ant: { kind: "Food science", term: "うま味", rj: "umami", gloss: "Food-science spelling for the fifth basic taste." },
        idiom: { kind: "Kanji spelling", term: "旨味", rj: "umami", lit: "savory richness", gloss: "Kanji spelling used for savory richness or delicious flavor." },
      },
    },
  ];

  /* ---------------------------------------------------------- utilities */
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const svgEl = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rubyHTML = (s) => {
    const text = String(s);
    const re = /([\u3400-\u9fff々〆〇]+)[（(]\s*([ぁ-んァ-ンー\s]+)\s*[）)]/g;
    let out = "";
    let last = 0;
    for (const m of text.matchAll(re)) {
      out += esc(text.slice(last, m.index));
      out += `<ruby>${esc(m[1])}<rt>${esc(m[2].replace(/\s+/g, ""))}</rt></ruby>`;
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  };
  const startXY = (d) => {
    const m = d.match(/^M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
  };

  /* =================================================== STROKE-ORDER GRID */
  function gridGroup() {
    const g = svgEl("g", { class: "gw-grid" });
    g.appendChild(svgEl("rect", { class: "gw-frame", x: 3, y: 3, width: 103, height: 103, rx: 5 }));
    g.appendChild(svgEl("line", { x1: 54.5, y1: 4, x2: 54.5, y2: 105 }));
    g.appendChild(svgEl("line", { x1: 4, y1: 54.5, x2: 105, y2: 54.5 }));
    return g;
  }

  /* main animated player */
  function buildPlayer(stage, strokesData) {
    const svg = svgEl("svg", { viewBox: "0 0 109 109" });
    svg.appendChild(gridGroup());
    const numbers = svgEl("g", {});
    const paths = strokesData.map((d, i) => {
      const p = svgEl("path", { d, class: "gw-stroke ghost" });
      svg.appendChild(p);
      const s = startXY(d);
      const t = svgEl("text", { class: "gw-num", x: s.x - 3.5, y: s.y + 2 });
      t.textContent = i + 1;
      numbers.appendChild(t);
      return p;
    });
    svg.appendChild(numbers);
    stage.querySelector(".stroke-stage__inner").appendChild(svg);

    const lens = paths.map((p) => p.getTotalLength());
    paths.forEach((p, i) => {
      p.style.strokeDasharray = lens[i];
      p.style.strokeDashoffset = lens[i];
    });

    let shown = 0; // number of fully revealed strokes
    let runId = 0;

    const setGhost = (p) => { p.classList.remove("draw", "current"); p.classList.add("ghost"); };
    const setDrawn = (p, i) => { p.classList.remove("ghost", "current"); p.classList.add("draw"); p.style.transition = "none"; p.style.strokeDashoffset = 0; };

    function renderInstant(n) {
      shown = n;
      paths.forEach((p, i) => {
        if (i < n) setDrawn(p, i);
        else { setGhost(p); p.style.transition = "none"; p.style.strokeDashoffset = lens[i]; }
      });
    }

    function animateStroke(i) {
      return new Promise((res) => {
        const p = paths[i];
        const dur = prefersReduced ? 0 : Math.min(900, Math.max(360, lens[i] * 7));
        p.classList.remove("ghost");
        p.classList.add("draw", "current");
        p.style.transition = "none";
        p.style.strokeDashoffset = lens[i];
        // force reflow so the transition takes
        void p.getBoundingClientRect();
        p.style.transition = `stroke-dashoffset ${dur}ms var(--ease-stroke)`;
        p.style.strokeDashoffset = 0;
        window.setTimeout(() => { p.classList.remove("current"); res(); }, dur + 40);
      });
    }

    async function play() {
      const myRun = ++runId;
      renderInstant(0);
      for (let i = 0; i < paths.length; i++) {
        if (myRun !== runId) return;
        await animateStroke(i);
        shown = i + 1;
        if (myRun !== runId) return;
        if (!prefersReduced) await new Promise((r) => setTimeout(r, 120));
      }
    }

    function next() {
      runId++;
      if (shown >= paths.length) return;
      const i = shown;          // index of the stroke to add
      renderInstant(i);         // 0..i-1 solid, i..end ghost
      animateStroke(i);         // draw stroke i (fire-and-forget; runId guards play())
      shown = i + 1;            // update synchronously to avoid rapid-click desync
    }
    function prev() { runId++; if (shown > 0) renderInstant(shown - 1); }
    function reset() { runId++; renderInstant(0); }

    renderInstant(0);
    return { play, next, prev, reset, total: paths.length, get shown() { return shown; } };
  }

  /* cumulative build-up strip (one cell per stroke) */
  function buildBuildup(container, strokesData) {
    strokesData.forEach((_, idx) => {
      const count = idx + 1;
      const cell = el("div", "bcell");
      const svg = svgEl("svg", { viewBox: "0 0 109 109" });
      svg.appendChild(svgEl("rect", { class: "bframe", x: 4, y: 4, width: 101, height: 101, rx: 6 }));
      svg.appendChild(svgEl("line", { class: "bx", x1: 54.5, y1: 6, x2: 54.5, y2: 103 }));
      svg.appendChild(svgEl("line", { class: "bx", x1: 6, y1: 54.5, x2: 103, y2: 54.5 }));
      for (let i = 0; i < count; i++) {
        svg.appendChild(svgEl("path", { d: strokesData[i], class: "bs" + (i === idx ? " new" : "") }));
      }
      cell.appendChild(svg);
      cell.appendChild(el("small", null, count));
      container.appendChild(cell);
    });
  }

  /* ========================================== TONGUE ATLAS (palate diagram)
     The flavour map is a real 3D tongue (geometry from tongue.glb) rendered by
     palate3d.js, with the five classic taste zones marked and the current
     taste's zone lit in its accent. Here we build the DOM + flavour-profile
     panel and hand the host to window.TongueAtlas (queueing if the module is
     still loading three.js). It degrades to the flavour panel + a static glyph
     when WebGL is unavailable. */
  const DRAG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.3-6.4M21 12a9 9 0 0 1-15.3 6.4"/><path d="M18 3v3.6h-3.6M6 21v-3.6h3.6"/></svg>`;

  function palateHTML(t) {
    const foods = t.palate.examples.map((e) => `
        <button class="food" type="button" data-jp="${esc(e.kj)} · ${esc(e.rj)}" data-en="${esc(e.en)}">
          <span class="food__jp" lang="ja">${esc(e.kj)}</span>
          <span class="food__rj">${esc(e.rj)}</span>
        </button>`).join("");
    const pips = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= t.palate.intensity ? "on" : ""}"></i>`).join("");
    const first = t.palate.examples[0];
    return `
      <div class="palate" data-palate="${t.id}">
        <div class="palate__stage">
          <div class="tongue-stage" tabindex="0" role="img" aria-label="Interactive 3D tongue — the ${esc(t.en)} taste zone is highlighted; drag or use arrow keys to rotate, and tap a zone to spotlight it"></div>
          <div class="tongue-labels" aria-hidden="true"></div>
          <div class="palate__hint">${DRAG_ICON}<span>Drag · tap a zone</span></div>
        </div>
        <div class="flavor">
          <div class="flavor__bar">
            <span class="flavor__label">Flavour profile</span>
            <div class="intensity" title="typical intensity" aria-label="typical intensity ${t.palate.intensity} of 5">${pips}</div>
          </div>
          <div class="flavor__foods">${foods}</div>
          <div class="flavor__readout" aria-live="polite"><span class="ro-jp" lang="ja">${esc(first.kj)} · ${esc(first.rj)}</span><span class="ro-en">${esc(first.en)}</span></div>
          <p class="flavor__note">${esc(t.palate.note)}</p>
        </div>
      </div>`;
  }

  function mountTongue(host, t) {
    // hand off to the 3D atlas (queue if the module hasn't loaded three.js yet)
    if (window.TongueAtlas) window.TongueAtlas.mount(host, t);
    else (window.__tongueQueue || (window.__tongueQueue = [])).push([host, t]);

    // flavour-profile chips drive the readout + pulse the highlighted zone
    const ro = host.querySelector(".flavor__readout");
    const roJp = ro.querySelector(".ro-jp");
    const roEn = ro.querySelector(".ro-en");
    const foods = [...host.querySelectorAll(".food")];
    const activate = (f) => {
      foods.forEach((x) => x.classList.toggle("is-on", x === f));
      roJp.textContent = f.dataset.jp;
      roEn.textContent = f.dataset.en;
      if (window.TongueAtlas) window.TongueAtlas.pulse(host);
    };
    foods.forEach((f) => {
      f.addEventListener("mouseenter", () => activate(f));
      f.addEventListener("focus", () => activate(f));
      f.addEventListener("click", () => activate(f));
    });
  }

  /* ============================================================ TEMPLATES */
  const pill = (label, val) => `<span class="pill">${esc(label)} · <b>${esc(val)}</b></span>`;

  function examplesHTML(examples) {
    return examples.map((ex) => `
      <div class="ex">
        <span class="jp" lang="ja">${rubyHTML(ex.jp)}</span>
        <span class="en">${esc(ex.en)}</span>
      </div>`).join("");
  }

  /* Stroke order for a multi-character umami spelling, rendered with the same
     "How to write it" layout as every other taste — one stage + panel per
     character, stacked vertically (no box card, no single "draw all" button). */
  const isKanjiChar = (c) => /[㐀-鿿々〆〇]/.test(c);
  function wordWritingHTML(key, term) {
    const chars = UMAMI_WORD_STROKES[key];
    return `
      <section class="word-writing reveal" data-word-writing="${key}" aria-label="Stroke order for ${esc(term)}">
        <div class="word-writing__head">
          <span class="sense__label">Stroke practice</span>
          <h4>Stroke order for <span lang="ja">${esc(term)}</span></h4>
        </div>
        <div class="word-writing__stack">
          ${chars.map((item, i) => `
            <div class="write">
              <div class="stroke-stage" data-word-stage="${key}-${i}"><div class="stroke-stage__inner"></div></div>
              <div class="write__panel">
                <div class="stroke-meta">
                  ${pill(isKanjiChar(item.char) ? "Kanji" : "Kana", item.char)}
                  ${pill("Strokes", String(item.strokes.length))}
                </div>
                <div class="stroke-controls" data-word-controls="${key}-${i}">
                  <button class="sbtn primary" type="button" data-act="play">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/></svg>
                    Draw
                  </button>
                  <button class="sbtn" type="button" data-act="prev" aria-label="Previous stroke">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button class="sbtn" type="button" data-act="next" aria-label="Next stroke">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button class="sbtn toggle" type="button" data-act="numbers" aria-pressed="false">Numbers</button>
                </div>
                <div class="buildup">
                  <div class="buildup__label">Stroke by stroke</div>
                  <div class="buildup__row" data-word-build="${key}-${i}"></div>
                </div>
              </div>
            </div>`).join("")}
        </div>
      </section>`;
  }

  function entryHTML(t) {
    const grammar = t.grammar.map((g) => `
      <article class="gcard reveal" data-d="${(t.grammar.indexOf(g) % 4) + 1}">
        <div class="form">${esc(g.form)}</div>
        <div class="jp" lang="ja">${esc(g.jp)}</div>
        <div class="rj">${esc(g.kana)} · ${esc(g.romaji)}</div>
        <div class="en">${esc(g.en)}</div>
      </article>`).join("");

    const senses = t.senses.map((s) => {
      const examples = s.examples || (s.ex ? [s.ex] : []);
      const writingAfter = t.id === "umami" && s.n === "2" ? wordWritingHTML("savory", "旨味") : "";
      return `
      <div class="sense reveal">
        <div class="sense__n">${esc(s.n)}</div>
        <div>
          <span class="sense__label">Meaning ${esc(s.n)}</span>
          <h4>${esc(s.title)}</h4>
          <p>${esc(s.body)}</p>
          ${examplesHTML(examples)}
        </div>
      </div>
      ${writingAfter}`;
    }).join("");

    const r = t.relations;
    const extraRelations = (r.extra || []).map((x, i) => `
      <article class="rcard idiom reveal" data-d="${4 + i}"><div class="rcard__inner">
        <span class="kind">${esc(x.kind || "Expression")}</span>
        <div class="term" lang="ja">${esc(x.term)}</div>
        <div class="rj">${esc(x.rj)}</div>
        ${x.lit ? `<p class="lit">&ldquo;${esc(x.lit)}&rdquo;</p>` : ""}
        <p class="gloss">${esc(x.gloss)}</p>
      </div></article>`).join("");
    const relations = `
      <article class="rcard reveal" data-d="1"><div class="rcard__inner">
        <span class="kind">${esc(r.syn.kind || "Synonym")}</span>
        <div class="term" lang="ja">${esc(r.syn.term)}</div>
        <div class="rj">${esc(r.syn.rj)}</div>
        <p class="gloss">${esc(r.syn.gloss)}</p>
      </div></article>
      <article class="rcard reveal" data-d="2"><div class="rcard__inner">
        <span class="kind">${esc(r.ant.kind || "Antonym")}</span>
        <div class="term" lang="ja">${esc(r.ant.term)}</div>
        <div class="rj">${esc(r.ant.rj)}</div>
        <p class="gloss">${esc(r.ant.gloss)}</p>
      </div></article>
      <article class="rcard idiom reveal" data-d="3"><div class="rcard__inner">
        <span class="kind">${esc(r.idiom.kind || "Idiom · 慣用句")}</span>
        <div class="term" lang="ja">${esc(r.idiom.term)}</div>
        <div class="rj">${esc(r.idiom.rj)}</div>
        <p class="lit">&ldquo;${esc(r.idiom.lit)}&rdquo;</p>
        <p class="gloss">${esc(r.idiom.gloss)}</p>
      </div></article>
      ${extraRelations}`;

    return `
    <section class="entry" data-taste="${t.id}" id="${t.id}" aria-labelledby="hd-${t.id}">
      <div class="entry__watermark" aria-hidden="true"><span lang="ja">${esc(t.kanji.char)}</span></div>
      <div class="wrap">

        <header class="entry__head">
          <div class="entry__title">
            <h2 class="entry__en reveal" id="hd-${t.id}">${esc(t.en)}</h2>
            <div class="entry__jpline reveal" data-d="1">
              <span class="entry__jp" lang="ja">${esc(t.jp)}</span>
              <span class="entry__romaji">${esc(t.reading)} · ${esc(t.romaji)}</span>
              <span class="entry__pos">${esc(t.pos)}</span>
            </div>
          </div>
          <div class="entry__glyph" lang="ja" aria-hidden="true">${esc(t.kanji.char)}</div>
        </header>

        <!-- dictionary meanings + interactive diagram -->
        <div class="block sense-1">
          <div class="sense-1__text">
            <div class="dictionary-senses">
              <div class="sense sense--primary reveal">
                <div class="sense__n">1</div>
                <div>
                  <span class="sense__label">Meaning 1 · taste</span>
                  <h4>On the tongue</h4>
                  <p class="lede">${esc(t.m1.lede)}</p>
                  ${t.m1.note ? `<p class="note"><span class="note-label">${esc(t.m1.noteLabel || "Usage note")}</span>${rubyHTML(t.m1.note)}</p>` : ""}
                  ${t.m1.examples ? `<div class="primary-examples"><span class="note-label">Examples</span>${examplesHTML(t.m1.examples)}</div>` : ""}
                  <div class="sense-1__meta">${t.m1.pills.map((p) => pill(p[0], p[1])).join("")}</div>
                </div>
              </div>
              <div class="palate-under-meaning reveal" data-d="1">${palateHTML(t)}</div>
              ${t.id === "umami" ? wordWritingHTML("foodScience", "うま味") : ""}
              ${senses}
            </div>
          </div>
        </div>

        <!-- (2) HOW TO WRITE — stroke order -->
        <div class="block" ${t.id === "umami" ? "hidden" : ""}>
          <div class="block__head"><span class="step">2</span><div><h3>How to write it</h3><span class="sub">${t.kanji.strokes} strokes · in order</span></div></div>
          <div class="write">
            <div class="stroke-stage" data-stage="${t.id}"><div class="stroke-stage__inner"></div></div>
            <div class="write__panel">
              <div class="stroke-meta">
                ${pill("Kanji", t.kanji.char)}
                ${pill("On", t.kanji.on)}
                ${pill("Kun", t.kanji.kun)}
                ${pill("Strokes", String(t.kanji.strokes))}
                ${pill("Radical", `${t.kanji.radical} (${t.kanji.radicalMeaning})`)}
              </div>
              <div class="stroke-controls" data-controls="${t.id}">
                <button class="sbtn primary" data-act="play">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/></svg>
                  Draw
                </button>
                <button class="sbtn" data-act="prev" aria-label="Previous stroke">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button class="sbtn" data-act="next" aria-label="Next stroke">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <button class="sbtn toggle" data-act="numbers" aria-pressed="false">Numbers</button>
              </div>
              <div class="buildup">
                <div class="buildup__label">Stroke by stroke</div>
                <div class="buildup__row" data-build="${t.id}"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- (3) GRAMMAR -->
        <div class="block">
          <div class="block__head"><span class="step">3</span><div><h3>${t.id === "umami" ? "Forms & spelling" : "Grammar · N5"}</h3><span class="sub">${t.id === "umami" ? "food science · everyday Japanese · kanji spelling" : "い-adjective: dictionary, past, negative, negative-past"}</span></div></div>
          <div class="grammar__grid">${grammar}</div>
        </div>

        <!-- (4) SYNONYM · ANTONYM · IDIOM -->
        <div class="block">
          <div class="block__head"><span class="step">4</span><div><h3>In the wider language</h3><span class="sub">${t.id === "umami" ? "spellings · context · usage" : "synonym · antonym · idiom"}</span></div></div>
          <div class="relations">${relations}</div>
        </div>

      </div>
    </section>`;
  }

  /* ================================================================ MOUNT */
  function mount() {
    // footer taste list
    const footTaste = document.getElementById("footTaste");

    TASTES.forEach((t) => {
      // footer
      const f = el("a");
      f.href = `#${t.id}`;
      f.setAttribute("data-taste", t.id);
      f.innerHTML = `${esc(t.en)} <span lang="ja">${esc(t.jp)} · ${esc(t.romaji)}</span>`;
      footTaste.appendChild(f);
    });

    // entries
    document.getElementById("entries").innerHTML = `
      <div class="results-head" id="resultsHead">
        <div class="wrap results-head__inner">
          <div>
            <span class="eyebrow">Search results</span>
            <h2 id="resultsTitle">Choose a taste</h2>
            <p id="resultsSummary">Type in the search field to open a taste page.</p>
          </div>
          <button class="results-head__clear" type="button" id="resultsClear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            Clear
          </button>
        </div>
      </div>
      ${TASTES.map(entryHTML).join("")}`;

    // build interactive widgets
    TASTES.forEach((t) => {
      const k = KANJI[t.id];
      const stage = document.querySelector(`.stroke-stage[data-stage="${t.id}"]`);
      const player = buildPlayer(stage, k.strokes);
      t._player = player;
      stage._player = player;
      buildBuildup(document.querySelector(`[data-build="${t.id}"]`), k.strokes);

      const controls = document.querySelector(`[data-controls="${t.id}"]`);
      controls.querySelector('[data-act="play"]').addEventListener("click", () => player.play());
      controls.querySelector('[data-act="next"]').addEventListener("click", () => player.next());
      controls.querySelector('[data-act="prev"]').addEventListener("click", () => player.prev());
      const numBtn = controls.querySelector('[data-act="numbers"]');
      numBtn.addEventListener("click", () => {
        const on = stage.classList.toggle("show-num");
        numBtn.classList.toggle("is-on", on);
        numBtn.setAttribute("aria-pressed", String(on));
      });

      mountTongue(document.querySelector(`.palate[data-palate="${t.id}"]`), t);
    });

    document.querySelectorAll("[data-word-writing]").forEach((block) => {
      const key = block.dataset.wordWriting;
      const chars = UMAMI_WORD_STROKES[key];
      chars.forEach((item, i) => {
        const stage = block.querySelector(`[data-word-stage="${key}-${i}"]`);
        const player = buildPlayer(stage, item.strokes);
        stage._player = player;          // lets autoplayInView() drive it like any other stage
        buildBuildup(block.querySelector(`[data-word-build="${key}-${i}"]`), item.strokes);

        const controls = block.querySelector(`[data-word-controls="${key}-${i}"]`);
        controls.querySelector('[data-act="play"]').addEventListener("click", () => player.play());
        controls.querySelector('[data-act="next"]').addEventListener("click", () => player.next());
        controls.querySelector('[data-act="prev"]').addEventListener("click", () => player.prev());
        const numBtn = controls.querySelector('[data-act="numbers"]');
        numBtn.addEventListener("click", () => {
          const on = stage.classList.toggle("show-num");
          numBtn.classList.toggle("is-on", on);
          numBtn.setAttribute("aria-pressed", String(on));
        });
      });
    });

    initSearch();
    initReveal();
    initMotion();
    autoplayInView();
  }

  /* -------------------------------------------------------- reveal on view */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach((i) => io.observe(i));
  }

  /* ----------------------------------------------- play kanji when in view */
  function autoplayInView() {
    if (prefersReduced || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !seen.has(e.target) && e.target._player) {
          seen.add(e.target);
          e.target._player.play();
        }
      });
    }, { threshold: 0.55 });
    document.querySelectorAll(".stroke-stage").forEach((s) => io.observe(s));
  }

  /* ----------------------------------------------------- GSAP / parallax */
  function initMotion() {
    if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;
    const { gsap } = window;
    gsap.registerPlugin(window.ScrollTrigger);

    // hero watermark drift
    gsap.to(".hero__watermark", {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
    });

    // section watermark drift — the same scrubbed parallax as the hero kanji
    document.querySelectorAll(".entry__watermark > span").forEach((w) => {
      gsap.fromTo(w, { yPercent: -12 }, {
        yPercent: 16, ease: "none",
        scrollTrigger: { trigger: w.closest(".entry"), start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });

    // entry radical glyph parallax (the small corner mark)
    document.querySelectorAll(".entry__glyph").forEach((g) => {
      gsap.fromTo(g, { yPercent: -8 }, {
        yPercent: 10, ease: "none",
        scrollTrigger: { trigger: g.closest(".entry"), start: "top bottom", end: "bottom top", scrub: 0.8 },
      });
    });
  }

  /* ============================================================== SEARCH
     A dictionary lookup for the home page: type any of the five words (in
     English, kana, kanji or romaji) and the definition pops up as a card,
     with a link down to the full entry. Forgiving aliases ("salt", "savory"…)
     keep it feeling like a real dictionary. Combobox keyboard model. */
  function initSearch() {
    const root = document.getElementById("search");
    const input = document.getElementById("searchInput");
    const panel = document.getElementById("searchPanel");
    const clearBtn = document.getElementById("searchClear");
    const form = root && root.querySelector(".search__bar");
    const resultsTitle = document.getElementById("resultsTitle");
    const resultsSummary = document.getElementById("resultsSummary");
    const resultsClear = document.getElementById("resultsClear");
    if (!root || !input || !panel) return;

    // forgiving extra spellings, beyond en/jp/reading/romaji/kanji
    const ALIASES = {
      sweet:  ["sweet", "sugar", "sugary", "amai"],
      sour:   ["sour", "tart", "acid", "acidic", "suppai", "sui"],
      bitter: ["bitter", "nigai"],
      salty:  ["salty", "salt", "spicy", "hot", "dry", "karai", "karakuchi", "tsurai", "辛口"],
      umami:  ["umami", "savory", "savoury", "savouriness", "umami taste", "うまみ", "旨み", "旨味"],
    };

    const norm = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();

    // searchable token list per taste
    const index = TASTES.map((t) => {
      const tokens = new Set([t.en, t.jp, t.reading, t.romaji, t.kanji.char, ...(ALIASES[t.id] || [])]);
      t.en.split(/\s+/).forEach((w) => tokens.add(w));
      return { t, tokens: [...tokens] };
    });

    function search(qRaw) {
      const q = norm(qRaw);
      if (!q) return [];
      const scored = index.map((ix) => {
        let score = 0;
        for (const tok of ix.tokens) {
          const nt = norm(tok);
          if (!nt) continue;
          if (nt === q) score = Math.max(score, 5);
          else if (nt.startsWith(q)) score = Math.max(score, 3);
          else if (nt.includes(q)) score = Math.max(score, 1);
        }
        if (norm(ix.t.en).startsWith(q)) score += 2;
        return { t: ix.t, score };
      });
      return scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.t.en.localeCompare(b.t.en));
    }

    /* ------------------------------------------------------------ templates */
    const ARROW = `<svg class="sresult__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`;

    const rowHTML = (t) => `
      <button type="button" class="sresult" role="option" id="opt-${t.id}" data-id="${t.id}" data-taste="${t.id}" aria-selected="false">
        <span class="sresult__glyph" lang="ja" aria-hidden="true">${esc(t.kanji.char)}</span>
        <span class="sresult__body">
          <span class="sresult__head">
            <span class="sresult__en">${esc(t.en)}</span>
            <span class="sresult__jp" lang="ja">${esc(t.jp)}</span>
            <span class="sresult__rj">${esc(t.reading)} · ${esc(t.romaji)}</span>
          </span>
          <span class="sresult__gloss">${esc(t.m1.lede)}</span>
        </span>
        ${ARROW}
      </button>`;

    const cardHTML = (t) => {
      const pills = t.m1.pills.map((p) => `<span class="pill">${esc(p[0])} · <b>${esc(p[1])}</b></span>`).join("");
      return `
      <article class="scard" data-taste="${t.id}">
        <div class="scard__top">
          <div class="scard__glyph" lang="ja" aria-hidden="true">${esc(t.kanji.char)}</div>
          <div class="scard__id">
            <h3 class="scard__en">${esc(t.en)}</h3>
            <div class="scard__jpline">
              <span class="scard__jp" lang="ja">${esc(t.jp)}</span>
              <span class="scard__rj">${esc(t.reading)} · ${esc(t.romaji)}</span>
            </div>
            <span class="scard__pos">${esc(t.pos)}</span>
          </div>
        </div>
        <p class="scard__def"><span class="scard__num">1.</span>${esc(t.m1.lede)}</p>
        <div class="scard__pills">${pills}</div>
        <div class="scard__rel">
          <span class="scard__chip"><i>Synonym</i> <b lang="ja">${esc(t.relations.syn.term)}</b></span>
          <span class="scard__chip"><i>Antonym</i> <b lang="ja">${esc(t.relations.ant.term)}</b></span>
        </div>
        <a class="scard__cta" href="#${t.id}" data-jump="${t.id}">Read the full entry <i>&rarr;</i></a>
      </article>`;
    };

    const emptyHTML = (q) => `
      <div class="search__empty">
        <p>No taste called &ldquo;${esc(q)}&rdquo; — there are only five.</p>
        <div class="search__empty-row">
          ${TASTES.map((t) => `<button type="button" class="qchip" data-taste="${t.id}" data-id="${t.id}"><b lang="ja">${esc(t.kanji.char)}</b><span>${esc(t.en)}</span></button>`).join("")}
        </div>
      </div>`;

    /* --------------------------------------------------------------- state */
    let mode = "list";   // "list" | "card"
    let currentId = null;
    let rows = [];
    let active = -1;

    const open = () => { root.classList.add("is-open"); input.setAttribute("aria-expanded", "true"); };
    const close = () => { root.classList.remove("is-open"); input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); active = -1; };

    function setActive(i) {
      active = i;
      rows.forEach((r, idx) => {
        const on = idx === i;
        r.classList.toggle("is-active", on);
        r.setAttribute("aria-selected", String(on));
        if (on) { input.setAttribute("aria-activedescendant", r.id); r.scrollIntoView({ block: "nearest" }); }
      });
      if (i < 0) input.removeAttribute("aria-activedescendant");
    }

    function setPageResults(results, qRaw) {
      const q = qRaw.trim();
      const hasQuery = Boolean(q);
      const hasMatches = hasQuery && results.length > 0;
      document.body.classList.toggle("has-results", hasQuery);
      document.body.classList.toggle("has-matches", hasMatches);

      TASTES.forEach((t) => {
        const section = document.getElementById(t.id);
        if (section) section.hidden = !hasQuery || !results.some((r) => r.id === t.id);
      });

      if (!resultsTitle || !resultsSummary) return;
      if (!hasQuery) {
        resultsTitle.textContent = "Choose a taste";
        resultsSummary.textContent = "Type in the search field to open a taste page.";
      } else if (results.length === 0) {
        resultsTitle.textContent = "No taste found";
        resultsSummary.textContent = `No taste called "${q}". Try sweet, sour, bitter, salty or umami.`;
      } else {
        resultsTitle.textContent = `${results.length} ${results.length === 1 ? "taste" : "tastes"} found`;
        resultsSummary.textContent = results.map((t) => `${t.en} (${t.jp})`).join(", ");
      }
    }

    function updateResults(qRaw, scrollToResults = false) {
      const q = qRaw.trim();
      const results = q ? search(q).map((r) => r.t) : [];
      setPageResults(results, qRaw);
      renderList(qRaw);
      if (scrollToResults && q && results.length) {
        const head = document.getElementById("resultsHead");
        if (head) head.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      }
      return results;
    }

    function renderList(qRaw) {
      mode = "list"; currentId = null;
      const q = qRaw.trim();
      if (!q) { rows = []; close(); return; }   // empty field → no dropdown
      const results = search(q).map((r) => r.t);
      if (results.length === 0) {
        panel.innerHTML = emptyHTML(q);
        rows = []; active = -1; input.removeAttribute("aria-activedescendant");
        open(); return;
      }
      panel.innerHTML =
        `<div class="search__label">${results.length} ${results.length === 1 ? "match" : "matches"}</div>` +
        `<div class="search__list">${results.map(rowHTML).join("")}</div>`;
      rows = [...panel.querySelectorAll(".sresult")];
      setActive(-1);
      open();
    }

    function showCard(id) {
      const t = TASTES.find((x) => x.id === id);
      if (!t) return;
      input.value = t.en;
      clearBtn.hidden = false;
      updateResults(input.value, true);
      close();
    }

    function jumpTo(id) {
      const t = TASTES.find((x) => x.id === id);
      const sec = document.getElementById(id);
      close();
      if (!t || !sec) return;
      input.value = t.en;
      clearBtn.hidden = false;
      setPageResults([t], t.en);
      sec.hidden = false;
      sec.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      sec.classList.remove("is-found");
      void sec.offsetWidth;            // restart the flash
      sec.classList.add("is-found");
      window.setTimeout(() => sec.classList.remove("is-found"), 1900);
      const h = sec.querySelector(".entry__en");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }

    /* --------------------------------------------------------------- events */
    if (form) form.addEventListener("submit", (e) => e.preventDefault());

    input.addEventListener("focus", () => { if (input.value.trim()) renderList(input.value); });
    input.addEventListener("input", () => {
      clearBtn.hidden = !input.value;
      updateResults(input.value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!root.classList.contains("is-open")) return renderList(input.value);
        if (mode === "list" && rows.length) setActive((active + 1) % rows.length);
      } else if (e.key === "ArrowUp") {
        if (mode === "list" && rows.length) { e.preventDefault(); setActive((active - 1 + rows.length) % rows.length); }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "card" && currentId) return jumpTo(currentId);
        if (rows.length) showCard(rows[active >= 0 ? active : 0].dataset.id);
      } else if (e.key === "Escape") {
        if (root.classList.contains("is-open")) { e.preventDefault(); close(); }
      }
    });

    clearBtn.addEventListener("click", () => {
      input.value = ""; clearBtn.hidden = true; updateResults(""); input.focus();
    });

    if (resultsClear) resultsClear.addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      updateResults("");
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      window.setTimeout(() => input.focus(), prefersReduced ? 0 : 420);
    });

    panel.addEventListener("click", (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) { e.preventDefault(); return jumpTo(jump.dataset.jump); }
      const chip = e.target.closest(".qchip");
      if (chip) return showCard(chip.dataset.id);
      const res = e.target.closest(".sresult");
      if (res) showCard(res.dataset.id);
    });

    panel.addEventListener("mousemove", (e) => {
      const res = e.target.closest(".sresult");
      if (res && mode === "list") setActive(rows.indexOf(res));
    });

    document.addEventListener("click", (e) => {
      const jump = e.target.closest('a[data-jump]');
      if (!jump || panel.contains(jump)) return;
      e.preventDefault();
      jumpTo(jump.dataset.jump);
    });

    // close when clicking away, or when scrolled well past the hero
    document.addEventListener("pointerdown", (e) => {
      if (!root.contains(e.target)) close();
    });
    window.addEventListener("scroll", () => {
      if (root.classList.contains("is-open") && input.getBoundingClientRect().bottom < 0) close();
    }, { passive: true });

    updateResults(input.value);
  }

  /* ----------------------------------------------------------------- boot */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
