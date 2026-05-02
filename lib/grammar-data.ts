export type GrammarLevel = "intermediate" | "upper-intermediate" | "advanced" | "advanced-plus";

export interface GrammarQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number; // index
  explanation: string; // neden bu cevap?
}

export interface GrammarSection {
  title: string;
  content: string; // markdown-style
  examples?: string[];
}

export interface GrammarTopic {
  id: string;
  level: GrammarLevel;
  levelLabel: string;
  title: string;           // Türkçe başlık
  subtitle: string;        // İngilizce gramer adı
  emoji: string;
  description: string;     // kısa açıklama
  sections: GrammarSection[];
  questions: GrammarQuestion[];
}

// ─── PLACEMENT TEST QUESTIONS ────────────────────────────────────────────────
export interface PlacementQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  level: GrammarLevel; // bu soru hangi seviyeye ait
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "p1",
    question: "There ___ a big market here last year, but now it's closed.",
    options: ["is", "was", "were", "be"],
    correct: 1,
    level: "intermediate",
  },
  {
    id: "p2",
    question: "When Peter came home, I ___ my homework.",
    options: ["did", "was doing", "have done", "do"],
    correct: 1,
    level: "upper-intermediate",
  },
  {
    id: "p3",
    question: "I ___ to London twice. It's a beautiful city.",
    options: ["went", "go", "have been", "was going"],
    correct: 2,
    level: "upper-intermediate",
  },
  {
    id: "p4",
    question: "If it ___ sunny tomorrow, we will go to the park.",
    options: ["is", "was", "will be", "would be"],
    correct: 0,
    level: "advanced",
  },
  {
    id: "p5",
    question: "By the time we got to the theatre, the play ___ already ___.",
    options: ["was / started", "has / started", "had / started", "did / start"],
    correct: 2,
    level: "advanced",
  },
  {
    id: "p6",
    question: "English ___ in many countries around the world.",
    options: ["speaks", "is spoken", "has spoken", "was speak"],
    correct: 1,
    level: "advanced",
  },
  {
    id: "p7",
    question: "If I ___ a lot of money, I would buy a sports car.",
    options: ["have", "had", "would have", "will have"],
    correct: 1,
    level: "advanced",
  },
  {
    id: "p8",
    question: "I wish I ___ more handsome. (present wish)",
    options: ["am", "was/were", "have been", "will be"],
    correct: 1,
    level: "advanced-plus",
  },
  {
    id: "p9",
    question: "She ___ fixing the car all morning. (action still in progress)",
    options: ["has been", "was", "is", "had been"],
    correct: 0,
    level: "advanced-plus",
  },
  {
    id: "p10",
    question: "I know ___ you won't trust me again.",
    options: ["what", "that", "which", "if"],
    correct: 1,
    level: "advanced-plus",
  },
];

// ─── GRAMMAR TOPICS ──────────────────────────────────────────────────────────

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  // ═══════════════════════════════════════════════════════════════════
  // INTERMEDIATE
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "there-was-were",
    level: "intermediate",
    levelLabel: "A2 – Intermediate",
    title: "There was / There were",
    subtitle: "There was / There were + Used to",
    emoji: "📍",
    description: "Geçmişte var olan şeyleri ve eski alışkanlıkları anlatmayı öğren.",
    sections: [
      {
        title: "There was / There were — Vardı / Yoktu",
        content: `**There is / There are** kalıbının geçmiş halini ifade eder.

**Olumlu:**
- **There was** → tekil ve sayılamayan isimler için
- **There were** → çoğul isimler için

**Olumsuz:**
- **There wasn't** (there was not)
- **There weren't** (there were not)

**Soru:**
- **Was there...?** / **Were there...?**`,
        examples: [
          "There was a big market here last year. (Geçen yıl burada büyük bir market vardı.)",
          "There were many apples here. Did you eat them? (Burada çok elma vardı. Yedin mi?)",
          "There wasn't a good film at the cinema. (Sinemada iyi bir film yoktu.)",
          "There weren't any curtains in our school. (Okulumuzda perde yoktu.)",
          "Was there a reason to be so angry? (Bu kadar kızmanın sebebi var mıydı?)",
        ],
      },
      {
        title: "Used to — Eskiden yapardım",
        content: `**Used to** kalıbı geçmişte **düzenli yapılan** ama artık **yapılmayan** eylemleri anlatır.

**Yapısı:**
- Olumlu: **Subject + used to + V1**
- Olumsuz: **Subject + didn't use to + V1**
- Soru: **Did + Subject + use to + V1?**

⚠️ **Dikkat:** Olumsuz ve soru yapısında "used to" → "use to" olur!`,
        examples: [
          "I used to walk to school. (Eskiden okula yürüyerek giderdim — artık gitmiyor.)",
          "She used to have long hair. (Eskiden uzun saçları vardı.)",
          "I didn't use to like coffee. (Eskiden kahveyi sevmezdim.)",
          "Did you use to play football? (Eskiden futbol oynar mıydın?)",
        ],
      },
    ],
    questions: [
      {
        id: "twa1",
        question: "There ___ many people at the party last night.",
        options: ["is", "are", "was", "were"],
        correct: 3,
        explanation: "'Many people' çoğul olduğu için 'were' kullanılır.",
      },
      {
        id: "twa2",
        question: "There ___ a bank on this street, but it closed down.",
        options: ["were", "was", "is", "are"],
        correct: 1,
        explanation: "'A bank' tekil olduğu için 'was' kullanılır.",
      },
      {
        id: "twa3",
        question: "___ there any milk in the fridge? I couldn't find any.",
        options: ["Were", "Was", "Is", "Are"],
        correct: 1,
        explanation: "Milk sayılamayan isim, tekil sayılır → 'Was there'.",
      },
      {
        id: "twa4",
        question: "I ___ live in Ankara, but now I live in Istanbul.",
        options: ["use to", "used to", "was used to", "am used to"],
        correct: 1,
        explanation: "Geçmişteki alışkanlık için 'used to + V1' kullanılır.",
      },
      {
        id: "twa5",
        question: "She didn't ___ like vegetables when she was a child.",
        options: ["used to", "use to", "uses to", "using"],
        correct: 1,
        explanation: "'Didn't' yardımcı fiilden sonra 'use to' (d'siz) kullanılır.",
      },
      {
        id: "twa6",
        question: "___ you use to play any sports at school?",
        options: ["Did", "Does", "Was", "Were"],
        correct: 0,
        explanation: "'Use to' soru yapısında 'Did' kullanılır.",
      },
      {
        id: "twa7",
        question: "There weren't ___ chairs in the classroom.",
        options: ["some", "a", "any", "much"],
        correct: 2,
        explanation: "Olumsuz cümlelerde 'any' kullanılır.",
      },
    ],
  },

  {
    id: "regular-irregular-verbs",
    level: "intermediate",
    levelLabel: "A2 – Intermediate",
    title: "Düzenli ve Düzensiz Fiiller",
    subtitle: "Regular & Irregular Verbs (V1/V2/V3)",
    emoji: "📝",
    description: "Simple Past ve Present Perfect için fiillerin geçmiş hallerini öğren.",
    sections: [
      {
        title: "Regular Verbs — Düzenli Fiiller",
        content: `Düzenli fiillerin geçmiş hali **(V2)** ve geçmiş katılım hali **(V3)** aynıdır: fiilin sonuna **-ed** eklenir.

**Kurallar:**
- Çoğu fiil: **+ed** → work → worked
- E ile bitenler: **+d** → love → loved
- Consonant + y ile bitenler: **y → ied** → study → studied
- Kısa fiillerde son ünsüz çift yazılır: **+ed** → stop → stopped`,
        examples: [
          "work → worked → worked (çalışmak)",
          "love → loved → loved (sevmek)",
          "study → studied → studied (çalışmak/okumak)",
          "stop → stopped → stopped (durmak)",
          "play → played → played (oynamak)",
        ],
      },
      {
        title: "Irregular Verbs — Düzensiz Fiiller",
        content: `Düzensiz fiillerin geçmiş halleri kurala uymaz, **ezberlenmelidir**.

**En sık kullanılan düzensiz fiiller:**

| V1 | V2 | V3 | Anlam |
|---|---|---|---|
| be | was/were | been | olmak |
| go | went | gone | gitmek |
| come | came | come | gelmek |
| see | saw | seen | görmek |
| get | got | got/gotten | almak |
| take | took | taken | almak |
| make | made | made | yapmak |
| give | gave | given | vermek |
| know | knew | known | bilmek |
| think | thought | thought | düşünmek |
| buy | bought | bought | satın almak |
| eat | ate | eaten | yemek |
| write | wrote | written | yazmak |`,
      },
    ],
    questions: [
      {
        id: "riv1",
        question: "What is the past simple (V2) of 'go'?",
        options: ["goed", "gone", "went", "going"],
        correct: 2,
        explanation: "'Go' düzensiz bir fiildir: go → went → gone.",
      },
      {
        id: "riv2",
        question: "What is the past participle (V3) of 'write'?",
        options: ["wrote", "writed", "written", "writing"],
        correct: 2,
        explanation: "'Write' düzensiz: write → wrote → written.",
      },
      {
        id: "riv3",
        question: "She ___ (study) hard for the exam last night.",
        options: ["studyed", "studied", "study", "studies"],
        correct: 1,
        explanation: "Consonant + y → ied: study → studied.",
      },
      {
        id: "riv4",
        question: "They ___ (stop) the car suddenly.",
        options: ["stoped", "stop", "stopped", "stopping"],
        correct: 2,
        explanation: "Kısa fiil, son ünsüz çiftlenir: stop → stopped.",
      },
      {
        id: "riv5",
        question: "What is the V2 of 'buy'?",
        options: ["buyed", "bough", "bought", "buyd"],
        correct: 2,
        explanation: "'Buy' düzensiz: buy → bought → bought.",
      },
      {
        id: "riv6",
        question: "I ___ (see) that film three times.",
        options: ["seed", "saw", "seen", "see"],
        correct: 1,
        explanation: "Simple past için V2 kullanılır: see → saw.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // UPPER-INTERMEDIATE
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "past-continuous",
    level: "upper-intermediate",
    levelLabel: "B1 – Upper Intermediate",
    title: "Geçmiş Sürekli Zaman",
    subtitle: "Past Continuous Tense",
    emoji: "⏳",
    description: "Geçmişte devam eden eylemleri ve kesilen hareketleri anlatmayı öğren.",
    sections: [
      {
        title: "Yapısı",
        content: `**Subject + was/were + V-ing**

- I / He / She / It → **was** + Ving
- You / We / They → **were** + Ving

**Olumsuz:** wasn't / weren't + Ving
**Soru:** Was/Were + Subject + Ving?`,
        examples: [
          "I was watching TV when you called. (Sen aradığında TV izliyordum.)",
          "They were playing football at 5 pm. (Saat 5'te futbol oynuyorlardı.)",
          "She wasn't sleeping when I arrived. (Ben geldiğimde uyumuyordu.)",
          "Were you studying all evening? (Bütün akşam ders mi çalışıyordun?)",
        ],
      },
      {
        title: "Ne Zaman Kullanılır?",
        content: `**1. Geçmişte devam eden eylemler:**
Belirli bir süre boyunca devam etmiş eylemleri anlatırken.

**2. Başka bir eylemle kesilen eylemler (when/while):**
- **When** + Simple Past → kesintiye uğrayan eylem Past Continuous olur
- **While** + Past Continuous → devam ederken başka bir şey oldu

**3. Aynı anda olan iki eylem:**
Past Continuous + Past Continuous

**⚠️ Non-progressive verbs kullanılmaz:** know, love, like, want, need, believe...`,
        examples: [
          "When Peter came home, I was doing my homework. (While bağlacı da kullanılabilir.)",
          "While mum was ironing, dad was watching TV. (İkisi de devam ediyor.)",
          "It was getting darker and it was snowing. (Hikaye arka planı)",
        ],
      },
    ],
    questions: [
      {
        id: "pc1",
        question: "I ___ my homework when mum called me for dinner.",
        options: ["did", "was doing", "have done", "do"],
        correct: 1,
        explanation: "Başka bir eylem (called) tarafından kesilen devam eden eylem → Past Continuous.",
      },
      {
        id: "pc2",
        question: "While I ___ a shower, someone knocked on the door.",
        options: ["took", "was taking", "take", "had taken"],
        correct: 1,
        explanation: "'While' + Past Continuous: devam eden eylem.",
      },
      {
        id: "pc3",
        question: "___ you studying all evening yesterday?",
        options: ["Did", "Was", "Were", "Have"],
        correct: 2,
        explanation: "'You' öznesiyle Past Continuous soru: Were you...?",
      },
      {
        id: "pc4",
        question: "She ___ (not sleep) when I arrived.",
        options: ["didn't sleep", "wasn't sleeping", "hasn't slept", "don't sleep"],
        correct: 1,
        explanation: "Olumsuz Past Continuous: wasn't + Ving.",
      },
      {
        id: "pc5",
        question: "At 10 pm, they ___ dinner at the restaurant.",
        options: ["had", "were having", "have had", "have"],
        correct: 1,
        explanation: "Belirli bir geçmiş saatte devam eden eylem → Past Continuous.",
      },
      {
        id: "pc6",
        question: "I ___ know the answer. (Doğru şekli seç)",
        options: ["was knowing", "knew", "were knowing", "knowed"],
        correct: 1,
        explanation: "'Know' non-progressive (stative) bir fiildir. Past Continuous yapılamaz → Simple Past kullanılır.",
      },
      {
        id: "pc7",
        question: "When the fire started, everyone ___ in the office.",
        options: ["worked", "was working", "works", "have worked"],
        correct: 1,
        explanation: "Yangın çıktığında (when + Simple Past) devam eden eylem Past Continuous.",
      },
    ],
  },

  {
    id: "present-perfect",
    level: "upper-intermediate",
    levelLabel: "B1 – Upper Intermediate",
    title: "Present Perfect Tense",
    subtitle: "Present Perfect Tense — Yakın Geçmiş",
    emoji: "✅",
    description: "Yakın geçmişi, deneyimleri ve hâlâ devam eden eylemleri anlatmayı öğren.",
    sections: [
      {
        title: "Yapısı",
        content: `**Subject + have/has + V3 (Past Participle)**

- I / You / We / They → **have** + V3
- He / She / It → **has** + V3

**Olumsuz:** haven't / hasn't + V3
**Soru:** Have/Has + Subject + V3?`,
        examples: [
          "I have finished my project. (Projemi bitirdim.)",
          "She has eaten her hamburger. (Hamburgeri yedi.)",
          "I haven't done my homework. (Ödevimi yapmadım — henüz.)",
          "Have you graduated from university? (Üniversiteden mezun oldun mu?)",
        ],
      },
      {
        title: "Ne Zaman Kullanılır?",
        content: `**1. Yakın geçmişte biten eylemler** (etkisi hala var):
→ *I have just finished. / She has already left.*

**2. Belirli bir zaman söylenmeksizin deneyimler:**
→ *I have been to Paris.* (Ne zaman olduğu önemli değil)

**3. Geçmişte başlayıp hala devam eden eylemler** (since / for ile):
→ *My father has worked here since 1995.*

**4. "Henüz yapılmadı" anlamı** (yet, still):
→ *She hasn't tidied her room yet.*

**⏱️ Sık kullanılan zaman ifadeleri:**
already, just, yet, ever, never, since, for, lately, recently`,
        examples: [
          "I have recently been to London. (Son zamanlarda Londra'ya gittim.)",
          "Have you ever eaten sushi? (Hiç sushi yedin mi?)",
          "I have never been to Japan. (Hiç Japonya'ya gitmedim.)",
          "She has lived here for 10 years. (10 yıldır burada yaşıyor.)",
        ],
      },
    ],
    questions: [
      {
        id: "pp1",
        question: "I ___ just ___ my homework. (finish)",
        options: ["have / finished", "did / finish", "had / finished", "was / finishing"],
        correct: 0,
        explanation: "'Just' ile Present Perfect: have just + V3.",
      },
      {
        id: "pp2",
        question: "She ___ to London three times.",
        options: ["went", "goes", "has been", "had gone"],
        correct: 2,
        explanation: "Deneyim ifadesi (kaç kez gittiği) → Present Perfect.",
      },
      {
        id: "pp3",
        question: "Have you ___ sushi before?",
        options: ["never", "ever", "yet", "just"],
        correct: 1,
        explanation: "Soru cümlelerinde deneyim sormak için 'ever' kullanılır.",
      },
      {
        id: "pp4",
        question: "I haven't done my homework ___.",
        options: ["already", "yet", "ever", "since"],
        correct: 1,
        explanation: "Olumsuz cümlelerde 'yet' kullanılır (henüz yapmadım).",
      },
      {
        id: "pp5",
        question: "My dad ___ here since 1995.",
        options: ["works", "worked", "has worked", "is working"],
        correct: 2,
        explanation: "Geçmişte başlayıp hala devam eden eylem + since → Present Perfect.",
      },
      {
        id: "pp6",
        question: "I ___ in Ankara for 5 years. (still living there)",
        options: ["lived", "was living", "have lived", "had lived"],
        correct: 2,
        explanation: "Hala devam ediyor + for → Present Perfect: have lived.",
      },
      {
        id: "pp7",
        question: "___ you ever seen a shooting star?",
        options: ["Did", "Have", "Do", "Had"],
        correct: 1,
        explanation: "Present Perfect soru: Have + subject + ever + V3.",
      },
    ],
  },

  {
    id: "comparatives-superlatives",
    level: "upper-intermediate",
    levelLabel: "B1 – Upper Intermediate",
    title: "Karşılaştırma ve Üstünlük",
    subtitle: "Comparatives and Superlatives",
    emoji: "📊",
    description: "Şeyleri ve kişileri birbirleriyle karşılaştırmayı öğren.",
    sections: [
      {
        title: "Comparatives — Karşılaştırma (-den daha...)",
        content: `**A is + [karşılaştırma] + than + B**

**Kurallar:**
- Kısa sıfatlar (1 hece): **sıfat + -er** → tall → taller
- -e ile bitenler: **+r** → large → larger
- Consonant + vowel + consonant: son harf çiftlenir → big → bigger
- y ile bitenler: **y → ier** → happy → happier
- Uzun sıfatlar (2+ hece): **more + sıfat** → more beautiful, more expensive

**Düzensiz:**
good → better / bad → worse / far → farther/further`,
        examples: [
          "She is taller than her brother. (Kardeşinden daha uzun.)",
          "This car is more expensive than that one. (Bu araba daha pahalı.)",
          "Today is better than yesterday. (Bugün dünden daha iyi.)",
        ],
      },
      {
        title: "Superlatives — En üstün (-in en...si)",
        content: `**the + [üstünlük] (+ in/of)**

**Kurallar:**
- Kısa sıfatlar: **the + sıfat + -est** → tall → the tallest
- Uzun sıfatlar: **the most + sıfat** → the most beautiful

**Düzensiz:**
good → the best / bad → the worst`,
        examples: [
          "She is the tallest student in the class. (Sınıftaki en uzun öğrenci.)",
          "This is the most expensive restaurant in the city.",
          "He is the best player on the team.",
        ],
      },
    ],
    questions: [
      {
        id: "cs1",
        question: "My sister is ___ than me. (tall)",
        options: ["more tall", "taller", "tallest", "most tall"],
        correct: 1,
        explanation: "Tek heceli sıfat → comparative: tall + er = taller.",
      },
      {
        id: "cs2",
        question: "This phone is ___ than the old one. (expensive)",
        options: ["more expensive", "expensiver", "most expensive", "expensivest"],
        correct: 0,
        explanation: "Uzun sıfat (3 hece) → more + sıfat.",
      },
      {
        id: "cs3",
        question: "He is the ___ student in the school. (good)",
        options: ["better", "more good", "goodest", "best"],
        correct: 3,
        explanation: "Good → düzensiz → the best (superlative).",
      },
      {
        id: "cs4",
        question: "Today is ___ day of the year. (hot)",
        options: ["hotter", "more hot", "the hottest", "the most hot"],
        correct: 2,
        explanation: "Short + consonant-vowel-consonant → çift son harf: hot → the hottest.",
      },
      {
        id: "cs5",
        question: "My bag is ___ than yours. (heavy)",
        options: ["heavyer", "more heavy", "heavier", "heaviest"],
        correct: 2,
        explanation: "Consonant + y → comparative: y → ier: heavy → heavier.",
      },
      {
        id: "cs6",
        question: "This is ___ film I've ever seen. (bad)",
        options: ["worse", "the worst", "more bad", "the baddest"],
        correct: 1,
        explanation: "Bad → düzensiz → the worst (superlative).",
      },
    ],
  },

  {
    id: "adverbs",
    level: "upper-intermediate",
    levelLabel: "B1 – Upper Intermediate",
    title: "Zarflar",
    subtitle: "Adverbs",
    emoji: "🎯",
    description: "Fiilleri, sıfatları ve diğer zarfları niteleyen zarfları öğren.",
    sections: [
      {
        title: "Adverbs — Zarflar",
        content: `Zarflar fiilleri, sıfatları veya diğer zarfları niteler.

**Nasıl yapılır?**
Çoğu sıfatın sonuna **-ly** eklenerek zarf yapılır:
- quick → quickly / careful → carefully

**Düzensiz zarflar:**
- good → **well** (iyi) ⚠️
- fast → fast (hızlı — değişmez)
- hard → hard (sert — değişmez)
- late → late (geç — değişmez)

**Yer ve zaman zarfları:**
here, there, now, then, always, never, sometimes, often, usually...`,
        examples: [
          "She speaks English fluently. (Akıcı konuşur.)",
          "He runs fast. (Hızlı koşar.)",
          "She sings well. (İyi şarkı söyler.)",
          "I always wake up early. (Her zaman erken kalkarım.)",
        ],
      },
    ],
    questions: [
      {
        id: "adv1",
        question: "She speaks English very ___. (good → zarf)",
        options: ["good", "goodly", "well", "better"],
        correct: 2,
        explanation: "Good'un zarfı 'well'dir. 'Goodly' diye bir şey yoktur.",
      },
      {
        id: "adv2",
        question: "He drives ___. (careful → zarf)",
        options: ["careful", "carefully", "more careful", "carefuler"],
        correct: 1,
        explanation: "Sıfat + -ly = zarf: careful → carefully.",
      },
      {
        id: "adv3",
        question: "She is a ___ worker. (sıfat olarak kullan)",
        options: ["hardly", "hard", "hardly", "well"],
        correct: 1,
        explanation: "'Worker'ı niteleyen bir sıfat gerekiyor → hard (sıfat). 'Hardly' = neredeyse hiç değil — farklı anlam!",
      },
      {
        id: "adv4",
        question: "I ___ eat fast food. (her zaman için doğru kelime)",
        options: ["never", "always", "sometimes", "seldom"],
        correct: 1,
        explanation: "Her zaman = always. Ancak cümle olumlu olduğu için 'always' uygundur.",
      },
      {
        id: "adv5",
        question: "The car was ___ fast for me to follow.",
        options: ["too", "very", "enough", "quite"],
        correct: 0,
        explanation: "'Too' = 'çok / aşırı' — olumsuz anlam içerir: too fast = takip edemeyecek kadar hızlı.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADVANCED
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "past-perfect",
    level: "advanced",
    levelLabel: "B2 – Advanced",
    title: "Past Perfect Tense",
    subtitle: "Past Perfect — Geçmiş Zamanın Hikayesi",
    emoji: "⏮️",
    description: "Geçmişte bir olaydan önce yaşanan başka bir olayı anlatmayı öğren.",
    sections: [
      {
        title: "Yapısı ve Mantığı",
        content: `**Subject + had + V3 (Past Participle)**

Geçmişte iki eylem var; **önce olan eylem** Past Perfect ile anlatılır.

**Olumsuz:** hadn't + V3
**Soru:** Had + Subject + V3?

⚠️ **had** burada yardımcı fiildir, "have" (sahip olmak) anlamıyla karıştırma!`,
        examples: [
          "Before I went to work, I had drunk a cup of coffee. (İşe gitmeden önce kahve içmiştim.)",
          "When my dad arrived home, mum had already cooked dinner.",
          "By the time we got to the theatre, the play had already started.",
          "Dad had already left when I arrived home from school.",
          "Sorry mum, I hadn't cleaned my room before I went out.",
        ],
      },
      {
        title: "Sık Kullanılan Bağlaçlar",
        content: `Past Perfect genellikle şu bağlaçlarla kullanılır:

- **before** → ...dan önce
- **after** → ...dan sonra
- **when** → ...dığında (o zaman zaten olmuştu)
- **by the time** → ...a kadar zaten
- **already** → zaten (vurgu için)
- **just** → daha yeni (az önce)

**Cümle yapısı örnekleri:**
- After I **had eaten**, I went for a walk.
- When she arrived, I **had already finished**.`,
        examples: [
          "I had learnt English before I moved to the US.",
          "After I had made pasta, I made the tomato sauce.",
          "Had you done your homework before you went out?",
        ],
      },
    ],
    questions: [
      {
        id: "ppt1",
        question: "By the time we arrived, the film ___ already ___.",
        options: ["has / started", "had / started", "was / starting", "did / start"],
        correct: 1,
        explanation: "'By the time' + past = önceki eylem Past Perfect: had started.",
      },
      {
        id: "ppt2",
        question: "She ___ never ___ sushi before that day.",
        options: ["has / eaten", "had / eaten", "was / eating", "did / eat"],
        correct: 1,
        explanation: "O güne kadar daha önce hiç yememişti → Past Perfect: had never eaten.",
      },
      {
        id: "ppt3",
        question: "I went to the cinema after I ___ my homework.",
        options: ["finish", "finished", "had finished", "have finished"],
        correct: 2,
        explanation: "Önce ödev → sonra sinema: önce olan eylem Past Perfect.",
      },
      {
        id: "ppt4",
        question: "___ you seen that movie before she recommended it?",
        options: ["Did", "Have", "Had", "Were"],
        correct: 2,
        explanation: "Past Perfect soru: Had + subject + V3.",
      },
      {
        id: "ppt5",
        question: "When I arrived, everyone ___.",
        options: ["left", "has left", "had left", "was leaving"],
        correct: 2,
        explanation: "Ben geldiğimde herkes çoktan gitmişti → Past Perfect.",
      },
      {
        id: "ppt6",
        question: "Dad ___ already ___ when I got home.",
        options: ["has / slept", "had / slept", "was / sleeping", "did / sleep"],
        correct: 1,
        explanation: "Geçmişte zaten olmuş eylem: had already slept.",
      },
    ],
  },

  {
    id: "conditionals-0-1",
    level: "advanced",
    levelLabel: "B2 – Advanced",
    title: "Şart Cümleleri: Type 0 ve 1",
    subtitle: "Conditional Sentences: Type 0 and Type 1",
    emoji: "🔀",
    description: "Gerçek koşullar ve olası gelecek durumlar için if cümlelerini öğren.",
    sections: [
      {
        title: "Type 0 — Genel Gerçekler",
        content: `**Yapısı:** If + Simple Present , Simple Present

"If" burada "eğer" değil, "ne zaman / olduğunda" anlamı taşır.

**Kullanımı:**
- Bilimsel gerçekler
- Genel doğrular
- Talimatlar (imperative)`,
        examples: [
          "If you boil water, it evaporates. (Su kaynarsa buharlaşır.)",
          "If it rains, the roads get wet. (Yağmur yağarsa yollar ıslanır.)",
          "If you are hungry, make yourself a sandwich. (Açsanız sandviç yap.)",
        ],
      },
      {
        title: "Type 1 — Olası Gelecek",
        content: `**Yapısı:** If + Simple Present , will + V1

Şart gerçekleşirse olacak şeyi anlatır. Gerçekleşmesi **mümkün ve muhtemel**.

⚠️ **Dikkat:** "if" olan cümlede "will" KULLANILMAZ!

**Unless = if...not:**
- If we don't hurry → Unless we hurry

**"Will" yerine:** can, may, might, must, should da kullanılabilir (main clause'da).`,
        examples: [
          "If it is sunny, we will go to the park. (Hava güzel olursa parka gideceğiz.)",
          "If you study hard, you will pass the exam.",
          "If I go home late, dad will be angry.",
          "Unless we hurry, we won't catch the bus.",
        ],
      },
    ],
    questions: [
      {
        id: "c01_1",
        question: "If you ___ water, it evaporates. (Type 0)",
        options: ["boil", "boiled", "will boil", "would boil"],
        correct: 0,
        explanation: "Type 0: If + Simple Present → Simple Present.",
      },
      {
        id: "c01_2",
        question: "If it ___ tomorrow, we will cancel the trip. (Type 1)",
        options: ["rains", "will rain", "rained", "would rain"],
        correct: 0,
        explanation: "Type 1: If-clause'da will kullanılmaz → Simple Present.",
      },
      {
        id: "c01_3",
        question: "If you give me your number, I ___ you.",
        options: ["call", "called", "will call", "would call"],
        correct: 2,
        explanation: "Type 1 main clause: will + V1.",
      },
      {
        id: "c01_4",
        question: "___ we don't hurry, we will miss the bus.",
        options: ["If", "Unless", "When", "While"],
        correct: 0,
        explanation: "Olumlu if-clause ile Type 1. (Unless = if not — cümle zaten olumsuz yapılırdı.)",
      },
      {
        id: "c01_5",
        question: "___ you study, you won't pass. (If not = Unless)",
        options: ["If", "Unless", "When", "Although"],
        correct: 1,
        explanation: "Unless = if...not: Unless you study = If you don't study.",
      },
      {
        id: "c01_6",
        question: "If I ___ to the party, I will call you. (come)",
        options: ["come", "will come", "came", "would come"],
        correct: 0,
        explanation: "If-clause'da will kullanılmaz → Simple Present: come.",
      },
      {
        id: "c01_7",
        question: "If you touch fire, your hand ___. (Type 0 — bilimsel gerçek)",
        options: ["will get burnt", "gets burnt", "got burnt", "would get burnt"],
        correct: 1,
        explanation: "Type 0: If + SP → SP: gets burnt.",
      },
    ],
  },

  {
    id: "conditionals-2",
    level: "advanced",
    levelLabel: "B2 – Advanced",
    title: "Şart Cümleleri: Type 2",
    subtitle: "Conditional Sentences: Type 2",
    emoji: "💭",
    description: "Hayal ürünü ve pek gerçekleşmesi beklenmeyen durumları anlatmayı öğren.",
    sections: [
      {
        title: "Type 2 — Hayali / Olası Olmayan Durumlar",
        content: `**Yapısı:** If + Simple Past , would + V1

Gerçekleşmesi **pek muhtemel olmayan** ya da **hayal ürünü** durumları anlatır.

Anlam şimdiki veya gelecek zamana aittir, ama if-clause'da Simple Past kullanılır.

⚠️ I / he / she / it için **"were"** kullanımı daha yaygındır (was da olabilir):
→ *If I were you...*

⚠️ If-clause'da **would ASLA kullanılmaz!**

**Would yerine:** could, might de kullanılabilir.`,
        examples: [
          "If I had lots of money, I would buy a sports car. (Param olsa spor araba alırdım — ama yok.)",
          "If I were you, I wouldn't tell my secrets to everyone.",
          "What would you do if you won the lottery?",
          "If Ali lived close, I would see him more.",
        ],
      },
    ],
    questions: [
      {
        id: "c2_1",
        question: "If I ___ rich, I would travel the world.",
        options: ["am", "was/were", "will be", "would be"],
        correct: 1,
        explanation: "Type 2 if-clause: Simple Past → were/was.",
      },
      {
        id: "c2_2",
        question: "If I were you, I ___ trust him.",
        options: ["won't", "don't", "wouldn't", "didn't"],
        correct: 2,
        explanation: "Type 2 main clause: would + V1 → wouldn't trust.",
      },
      {
        id: "c2_3",
        question: "If it ___ raining, we could go for a walk.",
        options: ["stops", "stopped", "will stop", "would stop"],
        correct: 1,
        explanation: "Type 2 if-clause: Simple Past → stopped.",
      },
      {
        id: "c2_4",
        question: "What ___ you do if you saw a ghost?",
        options: ["will", "do", "would", "should"],
        correct: 2,
        explanation: "Type 2 soru: What would + subject + V1?",
      },
      {
        id: "c2_5",
        question: "If I ___ time, I would come with you. (have → Type 2)",
        options: ["have", "had", "will have", "would have"],
        correct: 1,
        explanation: "Type 2 if-clause: Simple Past → had.",
      },
      {
        id: "c2_6",
        question: "Type 1 mi, Type 2 mi? 'If I had wings, I would fly.'",
        options: ["Type 0", "Type 1", "Type 2", "None"],
        correct: 2,
        explanation: "Kanatların olması imkânsız → Type 2 (hayali durum). If + Simple Past + would.",
      },
    ],
  },

  {
    id: "passive-voice",
    level: "advanced",
    levelLabel: "B2 – Advanced",
    title: "Edilgen Yapı",
    subtitle: "Passive Voice — Present & Past Simple",
    emoji: "🔄",
    description: "Eylemi yapanı değil, yapılanı ön plana çıkaran yapıyı öğren.",
    sections: [
      {
        title: "Passive Voice Mantığı",
        content: `**Etken (Active):** Özne eylemi yapar → Hakan cleans my car.
**Edilgen (Passive):** Eylem yapılır, kim yaptığı ikinci plandadır → My car is cleaned (by Hakan).

**Ne zaman kullanılır?**
- Kimin yaptığı bilinmiyorsa veya önemli değilse
- Genel doğrular için (English is spoken in many countries.)
- Resmi/bilimsel metinlerde`,
      },
      {
        title: "Simple Present Passive",
        content: `**Subject + am/is/are + V3**

Active → Passive:
- She writes reports. → Reports **are written** by her.
- They clean the office. → The office **is cleaned** (by them).`,
        examples: [
          "English is spoken in many countries.",
          "Picasso's paintings are admired by millions.",
          "The windows aren't broken.",
          "Is this car bought by Lucy?",
        ],
      },
      {
        title: "Simple Past Passive",
        content: `**Subject + was/were + V3**

Active → Passive:
- Sue washed the car. → The car **was washed** by Sue.
- They chose the players. → The players **were chosen**.`,
        examples: [
          "This book was written by a famous author.",
          "A lot of mistakes were made.",
          "Was the car washed?",
          "Letters weren't written by John.",
        ],
      },
    ],
    questions: [
      {
        id: "pv1",
        question: "English ___ in many countries. (speak — present passive)",
        options: ["speaks", "is speaking", "is spoken", "was spoken"],
        correct: 2,
        explanation: "Present Simple Passive: is/are + V3 → is spoken.",
      },
      {
        id: "pv2",
        question: "This book ___ by a famous author. (write — past passive)",
        options: ["wrote", "is written", "was written", "has written"],
        correct: 2,
        explanation: "Simple Past Passive: was/were + V3 → was written.",
      },
      {
        id: "pv3",
        question: "The windows ___ broken. They are safe.",
        options: ["are", "aren't", "is", "isn't"],
        correct: 1,
        explanation: "Present Passive olumsuz: aren't broken (çoğul: windows).",
      },
      {
        id: "pv4",
        question: "___ the car washed yesterday?",
        options: ["Is", "Was", "Were", "Did"],
        correct: 1,
        explanation: "Past Simple Passive soru: Was + subject + V3.",
      },
      {
        id: "pv5",
        question: "A lot of mistakes ___ (make) during the project.",
        options: ["made", "were made", "are made", "was made"],
        correct: 1,
        explanation: "Çoğul özne (mistakes) → were + V3: were made.",
      },
      {
        id: "pv6",
        question: "The office ___ every day. (clean — present passive)",
        options: ["cleans", "cleaned", "is cleaning", "is cleaned"],
        correct: 3,
        explanation: "Present Simple Passive (singular): is + V3 → is cleaned.",
      },
    ],
  },

  {
    id: "gerunds-infinitives",
    level: "advanced",
    levelLabel: "B2 – Advanced",
    title: "Gerunds & Infinitives",
    subtitle: "Gerunds and Infinitives",
    emoji: "🌀",
    description: "Fiillerin isim gibi kullanıldığı gerund (-ing) ve infinitive (to + V1) yapılarını öğren.",
    sections: [
      {
        title: "Gerunds — Fiil + -ing (isim görevi)",
        content: `**Gerund:** Fiil + -ing → bir isim gibi işlev görür.

**Kullanımı:**
- Cümlenin öznesi olarak: **Swimming** is good exercise.
- Belirli fiillerden sonra: enjoy, avoid, finish, mind, suggest, keep, consider, practice...
- Edatlardan sonra: interested **in** reading, good **at** cooking`,
        examples: [
          "I enjoy swimming. (Yüzmekten zevk alıyorum.)",
          "She avoided answering the question.",
          "He is good at playing guitar.",
          "I finished reading the book.",
        ],
      },
      {
        title: "Infinitives — to + V1",
        content: `**Belirli fiillerden sonra:** want, decide, plan, hope, need, agree, refuse, promise, manage...

**Sıfatlardan sonra:** happy to help, easy to understand, difficult to learn

**Amaç bildirmek için:** I went to the store **to buy** milk.`,
        examples: [
          "I want to learn English. (İngilizce öğrenmek istiyorum.)",
          "She decided to leave early.",
          "It's easy to make mistakes.",
          "He went to the store to buy bread.",
        ],
      },
      {
        title: "Her İkisini de Alan Fiiller",
        content: `Bazı fiiller hem gerund hem infinitive alır — **anlam değişebilir!**

| Fiil | Gerund (-ing) | Infinitive (to) |
|---|---|---|
| remember | geçmişi hatırlamak | yapmayı unutmamak |
| forget | geçmişi unutmak | yapmayı unutmak |
| stop | bir şeyi durdurmak | durup başka şey yapmak |
| try | denemek (çaba) | bir şeyi test etmek |

- I remember **meeting** him. (Onu tanıştığımı hatırlıyorum.)
- Remember **to call** me! (Beni aramayı unutma!)`,
      },
    ],
    questions: [
      {
        id: "gi1",
        question: "I enjoy ___ in the rain. (walk)",
        options: ["to walk", "walking", "walk", "walked"],
        correct: 1,
        explanation: "'Enjoy' her zaman gerund (-ing) alır: enjoy walking.",
      },
      {
        id: "gi2",
        question: "She decided ___ early. (leave)",
        options: ["leaving", "leave", "to leave", "left"],
        correct: 2,
        explanation: "'Decide' infinitive alır: decided to leave.",
      },
      {
        id: "gi3",
        question: "He is good at ___ English. (speak)",
        options: ["speak", "to speak", "speaking", "spoke"],
        correct: 2,
        explanation: "Edat (at) + gerund: good at speaking.",
      },
      {
        id: "gi4",
        question: "I stopped ___ cigarettes last year. (smoke)",
        options: ["to smoke", "smoking", "smoke", "smoked"],
        correct: 1,
        explanation: "'Stop smoking' = sigara içmeyi bırakmak. 'Stop to smoke' = durup sigara içmek.",
      },
      {
        id: "gi5",
        question: "Remember ___ the door! (lock)",
        options: ["locking", "lock", "to lock", "locked"],
        correct: 2,
        explanation: "'Remember to lock' = kilitlemeyi unutma (gelecekteki eylem).",
      },
      {
        id: "gi6",
        question: "___ English is not easy.",
        options: ["Learn", "To learning", "Learning", "Learned"],
        correct: 2,
        explanation: "Cümlenin öznesi → gerund: Learning English...",
      },
    ],
  },

  {
    id: "relative-clauses",
    level: "advanced",
    levelLabel: "B2 – Advanced",
    title: "İlgi Cümleleri",
    subtitle: "Relative Clauses",
    emoji: "🔗",
    description: "who, which, that, where kullanarak isimleri niteleyen yan cümleler kuruyorsun.",
    sections: [
      {
        title: "Relative Pronouns",
        content: `İlgi zamiri ile bir ismi niteleyen yan cümle kurulur.

| Zamir | Kullanım |
|---|---|
| **who** | insanlar için (özne / nesne) |
| **which** | nesneler ve hayvanlar için |
| **that** | insanlar ve nesneler için (resmi olmayan) |
| **whose** | iyelik (kimin) |
| **where** | yer için |
| **when** | zaman için |`,
        examples: [
          "The woman who called me is my teacher. (Beni arayan kadın öğretmenim.)",
          "The book which I bought is great. (Aldığım kitap harika.)",
          "The house where I grew up was destroyed. (Büyüdüğüm ev yıkıldı.)",
          "The man whose car was stolen called the police.",
        ],
      },
      {
        title: "Defining vs Non-Defining",
        content: `**Defining (Tanımlayıcı):** Hangi isimden bahsettiğimizi belirtir. Virgül yok.
→ The student **who studies hard** will pass.

**Non-defining (Ek Bilgi Veren):** Ek bilgi verir, virgülle ayrılır. "that" kullanılmaz.
→ My sister, **who lives in London**, is a doctor.`,
      },
    ],
    questions: [
      {
        id: "rc1",
        question: "The woman ___ called me is my teacher.",
        options: ["which", "whose", "who", "where"],
        correct: 2,
        explanation: "İnsan için özne konumunda relative pronoun: who.",
      },
      {
        id: "rc2",
        question: "The book ___ I bought last week is very interesting.",
        options: ["who", "whose", "where", "which/that"],
        correct: 3,
        explanation: "Nesne için: which veya that kullanılır.",
      },
      {
        id: "rc3",
        question: "The man ___ car was stolen called the police.",
        options: ["who", "which", "whose", "whom"],
        correct: 2,
        explanation: "İyelik (arabasının) → whose.",
      },
      {
        id: "rc4",
        question: "The restaurant ___ we had dinner was amazing.",
        options: ["which", "who", "where", "when"],
        correct: 2,
        explanation: "Yer için: where.",
      },
      {
        id: "rc5",
        question: "My sister, ___ lives in London, is a doctor.",
        options: ["that", "who", "which", "whom"],
        correct: 1,
        explanation: "Non-defining clause (virgüllü) → 'that' kullanılmaz → 'who'.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADVANCED+
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "present-perfect-continuous",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Present Perfect Continuous",
    subtitle: "Present Perfect Continuous Tense",
    emoji: "🔄",
    description: "Geçmişte başlayıp hala devam eden ve henüz bitmemiş eylemleri anlatmayı öğren.",
    sections: [
      {
        title: "Yapısı",
        content: `**Subject + have/has been + V-ing**

- I/You/We/They → **have been** + Ving
- He/She/It → **has been** + Ving

**Olumsuz:** haven't/hasn't been + Ving
**Soru:** Have/Has + Subject + been + Ving?`,
        examples: [
          "I have been cleaning the house all day. (Bütün gün evi temizliyorum — bitmedi.)",
          "She has been walking since this morning.",
          "How long have you been talking on the phone?",
          "Clair hasn't been doing much lately.",
        ],
      },
      {
        title: "Present Perfect vs. Present Perfect Continuous",
        content: `**Present Perfect:** Eylem bitti, sonucu önemli.
→ *I have made a cake.* (yaptım, bitti)

**Present Perfect Continuous:** Eylem devam ediyor, bitmemiş.
→ *I have been making a cake.* (hala yapıyorum)

**Fark inceliği:**
- I have run. (koştum — bitti)
- I have been running. (koşuyorum — bitmedi, yorgunum)

⚠️ Çoğu zaman ikisi de kullanılabilir, fark küçüktür. Continuous = bitmemişlik / süregelmişlik vurgusu.`,
        examples: [
          "I have been trying to answer emails all day. (hala bitirmedim)",
          "She has been decorating the house this summer. (bitmedi)",
          "I have been living in Ankara for a long while.",
        ],
      },
    ],
    questions: [
      {
        id: "ppc1",
        question: "I ___ for you for two hours! (wait)",
        options: ["waited", "was waiting", "have been waiting", "had waited"],
        correct: 2,
        explanation: "Geçmişte başlamış, hala devam ediyor (sen hala bekliyorsun) → Present Perfect Continuous.",
      },
      {
        id: "ppc2",
        question: "She ___ the house all morning. (clean — activity not finished)",
        options: ["has cleaned", "cleaned", "has been cleaning", "had cleaned"],
        correct: 2,
        explanation: "Bitmemiş, devam eden eylem → has been cleaning.",
      },
      {
        id: "ppc3",
        question: "How long ___ you ___ here? (live — still living here)",
        options: ["do / live", "did / live", "have / lived", "have / been living"],
        correct: 3,
        explanation: "Hala devam eden + how long → have been living.",
      },
      {
        id: "ppc4",
        question: "I've made a cake. vs I've been making a cake. — Hangisi 'bitmedi' anlamı verir?",
        options: ["I've made a cake.", "I've been making a cake.", "İkisi de aynı.", "İkisi de bitmedi."],
        correct: 1,
        explanation: "Present Perfect Continuous → eylem henüz bitmemiş: been making.",
      },
      {
        id: "ppc5",
        question: "Clair ___ much lately. Why don't you invite her out? (not / do)",
        options: ["isn't doing", "hasn't done", "hasn't been doing", "wasn't doing"],
        correct: 2,
        explanation: "Lately = son zamanlarda, devam eden durum → hasn't been doing.",
      },
    ],
  },

  {
    id: "wish-clause",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Wish Clause — Keşke",
    subtitle: "Wish / If only",
    emoji: "🌠",
    description: "Keşke dileklerini, pişmanlıkları ve memnuniyetsizlikleri wish yapısıyla ifade etmeyi öğren.",
    sections: [
      {
        title: "Wish + Simple Past → Şimdiki zamana dair dilek",
        content: `**Wish / If only + Simple Past (were/had/could...)**

Şu an gerçekleşmesi güç olan dilekleri anlatır. Anlam **şimdiki** zamandır.

⚠️ I/he/she/it için "were" tercih edilir.`,
        examples: [
          "I wish I were more handsome. (Keşke daha yakışıklı olsam.)",
          "If only I had a car! (Keşke bir arabam olsa!)",
          "I wish my children lived in a perfect world.",
          "I wish my wife could drive properly.",
        ],
      },
      {
        title: "Wish + Past Perfect → Geçmişe dair pişmanlık",
        content: `**Wish / If only + Past Perfect (had + V3)**

Geçmişte yapılan ya da yapılmayan şeyler için **pişmanlık** ifadesi.`,
        examples: [
          "I got a low mark. I wish I had studied harder. (Keşke daha çok çalışsaydım.)",
          "I wish you had been more careful! (Keşke daha dikkatli olsaydın!)",
          "He wishes he hadn't stolen the money.",
          "If only I had saved more money.",
        ],
      },
      {
        title: "Wish + would → Şimdiki memnuniyetsizlik",
        content: `**Wish + Subject + would + V1**

Şu an olan bir şeyden memnuniyetsizlik veya değişmesini istediğimiz bir durum.

⚠️ "I wish I would..." KULLANILMAZ (I/we öznesi olmaz bu yapıda).`,
        examples: [
          "I wish you would stop smoking. (Keşke sigarayı bıraksaydın / bıraksan.)",
          "I wish it would stop raining.",
          "If only that kid wouldn't cry anymore.",
        ],
      },
    ],
    questions: [
      {
        id: "wc1",
        question: "I wish I ___ richer. (present wish — be)",
        options: ["am", "was/were", "have been", "would be"],
        correct: 1,
        explanation: "Wish + Simple Past (şimdiki dilek): I wish I were/was richer.",
      },
      {
        id: "wc2",
        question: "I wish I ___ harder for the exam. (past regret — study)",
        options: ["studied", "would study", "had studied", "was studying"],
        correct: 2,
        explanation: "Geçmişteki pişmanlık → Wish + Past Perfect: had studied.",
      },
      {
        id: "wc3",
        question: "I wish you ___ making so much noise! (memnuniyetsizlik)",
        options: ["stop", "stopped", "would stop", "had stopped"],
        correct: 2,
        explanation: "Şimdiki memnuniyetsizlik → Wish + would + V1: would stop.",
      },
      {
        id: "wc4",
        question: "If only I ___ a car! (şu an yok — dilek)",
        options: ["have", "had", "would have", "have had"],
        correct: 1,
        explanation: "If only + Simple Past: şimdiki dilek → had.",
      },
      {
        id: "wc5",
        question: "She wishes she ___ the money. (pişmanlık — not spend)",
        options: ["didn't spend", "wouldn't spend", "hadn't spent", "wasn't spending"],
        correct: 2,
        explanation: "Geçmiş pişmanlık → hadn't spent (Past Perfect).",
      },
      {
        id: "wc6",
        question: "I wish I ___. (I özneli, memnuniyetsizlik) — Hangisi YANLIŞ?",
        options: ["were taller", "had more money", "would be smarter", "could fly"],
        correct: 2,
        explanation: "'Wish + I + would' KULLANILMAZ. I/We öznesiyle would+V1 yapısı geçersizdir.",
      },
    ],
  },

  {
    id: "noun-clauses",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "İsim Cümleciği",
    subtitle: "Noun Clauses",
    emoji: "📎",
    description: "That, question words ve if/whether ile cümle içinde isim görevi gören yan cümleler kurmayı öğren.",
    sections: [
      {
        title: "Noun Clauses — Nedir?",
        content: `İki cümleyi birleştirerek birini **isim görevine** sokarız.

**Nasıl oluşturulur:**
1. **That** → "...dığını" anlamı
2. **Question words** (where, who, what, why...) → "...nerede/ne" anlamı
3. **If / Whether** → "...ıp ıpmadığını" anlamı`,
      },
      {
        title: "That Clause",
        content: `**Ana fiil + that + yan cümle**

⚠️ "that" çoğu zaman bırakılabilir (özellikle konuşmada).

**Sık kullanılan ana fiiller:** know, think, believe, hope, say, understand, accept, realize...`,
        examples: [
          "I know that you won't trust me again. (Bana güvenmeyeceğini biliyorum.)",
          "She said (that) she was tired.",
          "I believe that the world is getting worse.",
          "He accepted that he made a mistake.",
        ],
      },
      {
        title: "Question Word Clauses",
        content: `**Ana fiil + question word + subject + verb**

Dolaylı soru yapısında soru kelimesi + normal cümle düzeni kullanılır (yardımcı fiil başa gelmez!).`,
        examples: [
          "I don't know where she lives. (Nerede yaşadığını bilmiyorum.)",
          "Tell me what you did yesterday.",
          "I don't understand why he left.",
          "Do you know who called?",
        ],
      },
      {
        title: "If / Whether Clause",
        content: `**Ana fiil + if/whether + subject + verb**

Bir şeyin yapılıp yapılmadığını bilmediğimizde veya sorduğumuzda kullanılır.`,
        examples: [
          "I don't know if/whether he is coming. (Gelip gelmeyeceğini bilmiyorum.)",
          "Ask her whether she wants coffee or tea.",
        ],
      },
    ],
    questions: [
      {
        id: "nc1",
        question: "I know ___ you are lying.",
        options: ["what", "that", "if", "which"],
        correct: 1,
        explanation: "'...dığını biliyorum' → that clause.",
      },
      {
        id: "nc2",
        question: "I don't know ___ she lives.",
        options: ["that", "if", "where", "which"],
        correct: 2,
        explanation: "Yer sorusu için 'where' → noun clause.",
      },
      {
        id: "nc3",
        question: "Do you know ___ he is coming or not?",
        options: ["that", "what", "if/whether", "who"],
        correct: 2,
        explanation: "Belirsizlik → if / whether.",
      },
      {
        id: "nc4",
        question: "She told me ___ she had finished the project.",
        options: ["what", "if", "that", "whether"],
        correct: 2,
        explanation: "'Bitirdiğini söyledi' → that clause.",
      },
      {
        id: "nc5",
        question: "I don't understand ___ he left without saying goodbye.",
        options: ["that", "if", "what", "why"],
        correct: 3,
        explanation: "'Neden gittiğini anlamıyorum' → why (question word clause).",
      },
      {
        id: "nc6",
        question: "Dolaylı soruda doğru kelime sırası hangisi?",
        options: [
          "I don't know where does she live.",
          "I don't know where she lives.",
          "I don't know she lives where.",
          "I don't know where lives she.",
        ],
        correct: 1,
        explanation: "Dolaylı sorularda normal cümle sırası: where + S + V (does kaldırılır).",
      },
    ],
  },

  {
    id: "conjunctions-contrast",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Zıtlık Bağlaçları",
    subtitle: "Contrast Conjunctions: but, however, although, nevertheless",
    emoji: "↔️",
    description: "Zıt fikirleri ve durumları bağlayan bağlaçları doğru yerde kullanmayı öğren.",
    sections: [
      {
        title: "Zıtlık Bağlaçları",
        content: `**Cümle içi (coordinating):**
- **but** → ama, fakat (iki bağımsız cümleyi birleştirir)

**Cümle başı / ortası (conjunctive adverbs):**
- **however** → ancak, bununla birlikte (virgül + however + virgül)
- **nevertheless / nonetheless** → buna rağmen, yine de
- **on the other hand** → öte yandan
- **yet** → yine de, ne var ki

**Bağlaç (subordinating):**
- **although / though / even though** → ...e rağmen (yan cümle oluşturur)
- **despite / in spite of** → ...e rağmen + isim/gerund`,
        examples: [
          "She studied hard, but she failed the exam.",
          "The weather was bad. However, we went out.",
          "Although it was raining, we went for a walk.",
          "Despite the rain, we went out.",
          "He is rich. Nevertheless, he is unhappy.",
        ],
      },
    ],
    questions: [
      {
        id: "cc1",
        question: "She studied hard, ___ she failed.",
        options: ["although", "but", "despite", "however"],
        correct: 1,
        explanation: "İki bağımsız cümleyi bağlamak için virgül + 'but'.",
      },
      {
        id: "cc2",
        question: "___ it was cold, we went swimming.",
        options: ["But", "However", "Although", "Despite"],
        correct: 2,
        explanation: "'Although' + yan cümle (subject + verb) → cümle başında kullanılabilir.",
      },
      {
        id: "cc3",
        question: "The plan was risky. ___, we decided to go ahead.",
        options: ["Although", "But", "Nevertheless", "Despite"],
        correct: 2,
        explanation: "İki ayrı cümle arasında → Nevertheless (buna rağmen).",
      },
      {
        id: "cc4",
        question: "___ the bad weather, the match continued. (rağmen + isim)",
        options: ["Although", "However", "Despite", "Nevertheless"],
        correct: 2,
        explanation: "'Despite + isim/gerund': despite the bad weather.",
      },
      {
        id: "cc5",
        question: "I like her. ___, she can be very annoying sometimes.",
        options: ["Although", "Despite", "However", "But"],
        correct: 2,
        explanation: "İki ayrı cümle → 'However' (bununla birlikte).",
      },
    ],
  },

  {
    id: "future-continuous",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Future Continuous",
    subtitle: "Future Continuous Tense",
    emoji: "🚀",
    description: "Gelecekte belirli bir anda devam ediyor olacak eylemleri anlatmayı öğren.",
    sections: [
      {
        title: "Yapısı ve Kullanımı",
        content: `**Subject + will be + V-ing**

**Olumsuz:** won't be + Ving
**Soru:** Will + Subject + be + Ving?

**Ne zaman kullanılır?**
1. Gelecekte belirli bir anda devam ediyor olacak eylemler:
→ At 8 pm tomorrow, I **will be watching** the game.

2. Yakın gelecekte planlanmış, doğal akışta olacak eylemler:
→ I **will be flying** to Paris next Monday.

3. Kibar soru sormak için (randevu/plan sormak):
→ Will you be using the car tonight?`,
        examples: [
          "This time next week, I will be lying on a beach. (Gelecek hafta bu saatte kumsalda uzanıyor olacağım.)",
          "When you arrive, she will be waiting for you.",
          "Will you be attending the meeting tomorrow?",
        ],
      },
    ],
    questions: [
      {
        id: "fc1",
        question: "This time tomorrow, I ___ on a plane. (fly)",
        options: ["will fly", "am flying", "will be flying", "fly"],
        correct: 2,
        explanation: "Gelecekte belirli anda devam eden eylem → will be flying.",
      },
      {
        id: "fc2",
        question: "When you arrive, she ___ for you. (wait)",
        options: ["waits", "waited", "will be waiting", "would wait"],
        correct: 2,
        explanation: "Sen geldiğinde devam ediyor olacak → will be waiting.",
      },
      {
        id: "fc3",
        question: "___ you be using the car tonight? (kibar soru)",
        options: ["Are", "Will", "Do", "Were"],
        correct: 1,
        explanation: "Future Continuous soru: Will + subject + be + Ving.",
      },
      {
        id: "fc4",
        question: "I won't ___ all day. Don't worry. (work)",
        options: ["be work", "be working", "working", "have worked"],
        correct: 1,
        explanation: "Olumsuz Future Continuous: won't be + Ving.",
      },
    ],
  },

  {
    id: "passive-voice-all",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Edilgen Yapı — Tüm Zamanlar",
    subtitle: "Passive Voice — All Tenses",
    emoji: "⚙️",
    description: "Tüm zamanlarda edilgen yapıyı doğru kurabilmeyi öğren.",
    sections: [
      {
        title: "Passive Voice — Tüm Zamanlar",
        content: `| Zaman | Active | Passive (to be + V3) |
|---|---|---|
| Simple Present | cleans | **is/are cleaned** |
| Simple Past | cleaned | **was/were cleaned** |
| Present Continuous | is cleaning | **is/are being cleaned** |
| Past Continuous | was cleaning | **was/were being cleaned** |
| Present Perfect | has cleaned | **has/have been cleaned** |
| Past Perfect | had cleaned | **had been cleaned** |
| Future Simple | will clean | **will be cleaned** |
| Modal | can clean | **can be cleaned** |`,
        examples: [
          "The report is being written. (Present Continuous Passive)",
          "The book has been published. (Present Perfect Passive)",
          "The bridge will be repaired next year. (Future Passive)",
          "This problem can be solved easily. (Modal Passive)",
        ],
      },
    ],
    questions: [
      {
        id: "pva1",
        question: "The report ___ right now. (write — present continuous passive)",
        options: ["is written", "is being written", "has been written", "was written"],
        correct: 1,
        explanation: "Present Continuous Passive: is/are being + V3.",
      },
      {
        id: "pva2",
        question: "The bridge ___ next year. (repair — future passive)",
        options: ["will repair", "is repaired", "will be repaired", "has been repaired"],
        correct: 2,
        explanation: "Future Passive: will be + V3.",
      },
      {
        id: "pva3",
        question: "The letter ___ before I arrived. (send — past perfect passive)",
        options: ["was sent", "has been sent", "had been sent", "is sent"],
        correct: 2,
        explanation: "Past Perfect Passive: had been + V3.",
      },
      {
        id: "pva4",
        question: "This problem ___ easily. (solve — modal passive)",
        options: ["can solve", "can be solved", "could solve", "is solved"],
        correct: 1,
        explanation: "Modal Passive: modal + be + V3.",
      },
      {
        id: "pva5",
        question: "Three people ___ in the accident. (injure — simple past passive)",
        options: ["injured", "were injuring", "were injured", "have injured"],
        correct: 2,
        explanation: "Simple Past Passive: were + V3 (çoğul: three people).",
      },
    ],
  },

  {
    id: "causative",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Yaptırmak: Let / Make / Have / Get",
    subtitle: "Causative Verbs: Let, Make, Have, Get",
    emoji: "🔧",
    description: "Başkasına bir şey yaptırmayı veya izin vermeyi ifade eden yapıları öğren.",
    sections: [
      {
        title: "Causative Yapılar",
        content: `| Yapı | Anlam | Örnek |
|---|---|---|
| **make + obj + V1** | zorlamak, mecbur bırakmak | She made me apologize. |
| **let + obj + V1** | izin vermek | Dad let me go out. |
| **have + obj + V1** | (birine bir şey) yaptırmak | I had the plumber fix the pipe. |
| **get + obj + to + V1** | ikna ederek yaptırmak | She got him to clean. |

⚠️ **Make ve let** → nesne + V1 (yalın fiil, to'suz)
⚠️ **Get** → nesne + to + V1`,
        examples: [
          "She made me apologize. (Özür dilettti.)",
          "Dad lets me use his car. (Arabasını kullanmama izin veriyor.)",
          "I'll have him fix the car. (Arabayı tamir ettireceğim.)",
          "She got him to clean the room. (Odayı temizlemesini sağladı.)",
        ],
      },
    ],
    questions: [
      {
        id: "caus1",
        question: "The teacher made the students ___ the test again.",
        options: ["to take", "taking", "take", "took"],
        correct: 2,
        explanation: "'Make + obj + V1' (to'suz yalın fiil).",
      },
      {
        id: "caus2",
        question: "Mum lets me ___ up late on weekends.",
        options: ["to stay", "staying", "stay", "stayed"],
        correct: 2,
        explanation: "'Let + obj + V1' (to'suz yalın fiil).",
      },
      {
        id: "caus3",
        question: "I'll get the mechanic ___ my car.",
        options: ["fix", "fixing", "to fix", "fixed"],
        correct: 2,
        explanation: "'Get + obj + to + V1': get the mechanic to fix.",
      },
      {
        id: "caus4",
        question: "She had her assistant ___ all the reports.",
        options: ["to prepare", "preparing", "prepare", "prepared"],
        correct: 2,
        explanation: "'Have + obj + V1' (to'suz): had her assistant prepare.",
      },
      {
        id: "caus5",
        question: "The cold weather made everyone ___ inside.",
        options: ["to stay", "staying", "stay", "stayed"],
        correct: 2,
        explanation: "'Make + obj + V1': made everyone stay.",
      },
    ],
  },

  {
    id: "phrasal-verbs",
    level: "advanced-plus",
    levelLabel: "C1 – Advanced+",
    title: "Phrasal Verbs",
    subtitle: "Phrasal Verbs",
    emoji: "💥",
    description: "Fiil + edat/zarf kombinasyonlarından oluşan ve yeni anlamlar kazanan phrasal verbleri öğren.",
    sections: [
      {
        title: "Phrasal Verbs Nedir?",
        content: `**Fiil + preposition/adverb** kombinasyonu → yeni anlam

**En yaygın phrasal verblerden bazıları:**

| Phrasal Verb | Anlam |
|---|---|
| give up | vazgeçmek, bırakmak |
| give in | teslim olmak |
| look after | bakmak, ilgilenmek |
| look up | araştırmak, sözlükte bakmak |
| look forward to | dört gözle beklemek |
| put off | ertelemek |
| put up with | katlanmak, tahammül etmek |
| run out of | tükenmek |
| take off | kalkmak (uçak), çıkarmak |
| turn up | ortaya çıkmak, sesi açmak |
| break down | bozulmak, çökmek |
| carry on | devam etmek |
| come up with | bulmak, akla getirmek |
| find out | öğrenmek, keşfetmek |
| get on with | iyi geçinmek |`,
      },
    ],
    questions: [
      {
        id: "pv1",
        question: "I can't ___ with his rude behaviour anymore.",
        options: ["put up", "give up", "look up", "run out"],
        correct: 0,
        explanation: "'Put up with' = tahammül etmek, katlanmak.",
      },
      {
        id: "pv2",
        question: "We ___ of petrol in the middle of nowhere.",
        options: ["gave up", "ran out", "put off", "broke down"],
        correct: 1,
        explanation: "'Run out of' = tükenmek.",
      },
      {
        id: "pv3",
        question: "The meeting has been ___ until next week.",
        options: ["looked up", "put off", "given up", "carried on"],
        correct: 1,
        explanation: "'Put off' = ertelemek.",
      },
      {
        id: "pv4",
        question: "I'm really ___ to my holiday next month.",
        options: ["looking forward", "giving up", "taking off", "running out"],
        correct: 0,
        explanation: "'Look forward to' = dört gözle beklemek.",
      },
      {
        id: "pv5",
        question: "She ___ a brilliant idea during the meeting.",
        options: ["came up with", "put up with", "ran out of", "broke down with"],
        correct: 0,
        explanation: "'Come up with' = (fikir) bulmak, akla getirmek.",
      },
      {
        id: "pv6",
        question: "Don't ___ learning English! You're doing great.",
        options: ["give up", "put off", "look after", "take off"],
        correct: 0,
        explanation: "'Give up' = vazgeçmek.",
      },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getTopicsByLevel(level: GrammarLevel): GrammarTopic[] {
  return GRAMMAR_TOPICS.filter((t) => t.level === level);
}

export function getTopicById(id: string): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((t) => t.id === id);
}

export const LEVEL_ORDER: GrammarLevel[] = [
  "intermediate",
  "upper-intermediate",
  "advanced",
  "advanced-plus",
];

export const LEVEL_DISPLAY: Record<GrammarLevel, { label: string; color: string; bg: string }> = {
  intermediate: {
    label: "A2 – Intermediate",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  "upper-intermediate": {
    label: "B1 – Upper Intermediate",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  },
  advanced: {
    label: "B2 – Advanced",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  },
  "advanced-plus": {
    label: "C1 – Advanced+",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  },
};

// Placement test sonucuna göre seviye belirle
export function determineLevel(answers: { questionId: string; isCorrect: boolean }[]): GrammarLevel {
  const levelScores: Record<GrammarLevel, { correct: number; total: number }> = {
    intermediate: { correct: 0, total: 0 },
    "upper-intermediate": { correct: 0, total: 0 },
    advanced: { correct: 0, total: 0 },
    "advanced-plus": { correct: 0, total: 0 },
  };

  for (const answer of answers) {
    const q = PLACEMENT_QUESTIONS.find((p) => p.id === answer.questionId);
    if (!q) continue;
    levelScores[q.level].total++;
    if (answer.isCorrect) levelScores[q.level].correct++;
  }

  // Her seviyede doğru oranına bak
  const intermediate = levelScores.intermediate.correct / Math.max(1, levelScores.intermediate.total);
  const upperInt = levelScores["upper-intermediate"].correct / Math.max(1, levelScores["upper-intermediate"].total);
  const advanced = levelScores.advanced.correct / Math.max(1, levelScores.advanced.total);
  const advancedPlus = levelScores["advanced-plus"].correct / Math.max(1, levelScores["advanced-plus"].total);

  if (advancedPlus >= 0.7 && advanced >= 0.7) return "advanced-plus";
  if (advanced >= 0.7 && upperInt >= 0.5) return "advanced";
  if (upperInt >= 0.5 && intermediate >= 0.5) return "upper-intermediate";
  return "intermediate";
}
