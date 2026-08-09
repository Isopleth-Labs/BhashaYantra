import { HINDI_PROFESSIONAL_LEXICON } from "@/domain/typing/hindi-professional-lexicon";

export type CanonicalCurriculumStageId = "learn-keys" | "practice-words" | "sentences" | "paragraphs";
export type LessonPracticeMode = "guided" | "accuracy" | "flow" | "exam";

export interface CanonicalDrillBlock {
  readonly label: string;
  readonly purpose: string;
  readonly content: string;
}

export interface CanonicalLessonSeed {
  readonly title: string;
  readonly moduleTitle: string;
  readonly drillLabel: string;
  readonly objective: string;
  readonly content: string;
  readonly competency: string;
  readonly practiceMode: LessonPracticeMode;
  readonly requiredPasses: number;
  readonly drillBlocks: readonly CanonicalDrillBlock[];
  readonly minimumAccuracy: number;
  readonly targetWpm: number;
}

interface KeyModule {
  readonly title: string;
  readonly objective: string;
  readonly keys: readonly string[];
}

interface WordModule {
  readonly title: string;
  readonly words: readonly string[];
}

const KEY_DRILLS = [
  { label: "Precision", objective: "Use deliberate keystrokes and return every finger to its home position." },
  { label: "Alternation", objective: "Build balanced movement between both hands without looking at the keyboard." },
  { label: "Fluency Review", objective: "Combine the new keys with earlier keys while keeping an even rhythm." },
] as const;

const ENGLISH_KEY_MODULES: readonly KeyModule[] = [
  { title: "Home Row Anchors", objective: "Locate the raised F and J keys by touch.", keys: ["f", "j"] },
  { title: "Home Row Control", objective: "Add the middle-finger D and K positions.", keys: ["d", "k"] },
  { title: "Home Row Reach", objective: "Add the ring-finger S and L positions.", keys: ["s", "l"] },
  { title: "Home Row Edges", objective: "Complete the home row with A and semicolon.", keys: ["a", ";"] },
  { title: "Home Row Centre", objective: "Train the index-finger reach to G and H.", keys: ["g", "h"] },
  { title: "Upper Row Centre", objective: "Move the index fingers from home row to R and U.", keys: ["r", "u"] },
  { title: "Upper Row Control", objective: "Add E and I while preserving home-row return.", keys: ["e", "i"] },
  { title: "Upper Row Reach", objective: "Add W and O with relaxed ring fingers.", keys: ["w", "o"] },
  { title: "Upper Row Edges", objective: "Complete the upper row with Q and P.", keys: ["q", "p"] },
  { title: "Upper Row Bridge", objective: "Strengthen the central T and Y reaches.", keys: ["t", "y"] },
  { title: "Lower Row Centre", objective: "Move the index fingers down to V and M.", keys: ["v", "m"] },
  { title: "Lower Row Control", objective: "Add C and comma while returning to home row.", keys: ["c", ","] },
  { title: "Lower Row Reach", objective: "Add X and period with controlled ring fingers.", keys: ["x", "."] },
  { title: "Lower Row Edges", objective: "Complete the lower-row edges with Z and slash.", keys: ["z", "/"] },
  { title: "Lower Row Bridge", objective: "Strengthen the central B and N reaches.", keys: ["b", "n"] },
  { title: "Capital Letters", objective: "Coordinate the opposite Shift key with each hand.", keys: ["F", "J", "D", "K", "A", "L"] },
  { title: "Number Row Centre", objective: "Reach the central number keys without moving the wrists.", keys: ["4", "5", "6", "7"] },
  { title: "Number Row Edges", objective: "Complete accurate number-row reaches.", keys: ["1", "2", "3", "8", "9", "0"] },
  { title: "Common Punctuation", objective: "Use commas, periods, colons, quotes, and questions accurately.", keys: [",", ".", ";", ":", "'", "?"] },
  { title: "Full Keyboard Mastery", objective: "Integrate letters, capitals, numbers, and punctuation.", keys: ["a", "e", "i", "o", "u", "1", "5", "9", ",", "."] },
];

const HINDI_KEY_MODULES: readonly KeyModule[] = [
  { title: "Swar Foundation", objective: "Build the independent short and long vowel forms.", keys: ["a", "aa", "i", "ee"] },
  { title: "Swar Reach", objective: "Add the remaining common independent vowels.", keys: ["u", "oo", "e", "ai"] },
  { title: "Swar Completion", objective: "Consolidate O and AU with earlier compound vowels.", keys: ["o", "au", "e", "ai"] },
  { title: "Ka Varg", objective: "Practise the first consonant family in a fixed order.", keys: ["ka", "kha", "ga", "gha"] },
  { title: "Cha Varg", objective: "Practise the palatal consonant family.", keys: ["cha", "chha", "ja", "jha"] },
  { title: "Ta Varg", objective: "Build clean dental consonant and vowel joins.", keys: ["ta", "tha", "da", "dha", "na"] },
  { title: "Retroflex Varg", objective: "Distinguish the retroflex consonants from dental forms.", keys: ["Taa", "Thaa", "Daa", "Dhaa", "Naa"] },
  { title: "Pa Varg", objective: "Practise the lip-based consonant family.", keys: ["pa", "pha", "ba", "bha", "ma"] },
  { title: "Antastha", objective: "Build smooth joins with YA, RA, LA, and VA.", keys: ["ya", "ra", "la", "va"] },
  { title: "Ushma", objective: "Differentiate SHA, SSA, SA, and HA.", keys: ["sha", "ssa", "sa", "ha"] },
  { title: "Short Matras", objective: "Attach short vowel signs to a common consonant.", keys: ["ki", "ku", "ke", "ko"] },
  { title: "Long Matras", objective: "Attach long and compound vowel signs accurately.", keys: ["kaa", "kee", "koo", "kai", "kau"] },
  { title: "Ga Matra Series", objective: "Repeat a full matra family with GA.", keys: ["gi", "gu", "ge", "go"] },
  { title: "Ta Matra Series", objective: "Repeat a full matra family with TA.", keys: ["ti", "tu", "te", "to"] },
  { title: "Da Matra Series", objective: "Repeat a full matra family with DA.", keys: ["di", "du", "de", "do"] },
  { title: "Na Matra Series", objective: "Repeat a full matra family with NA.", keys: ["ni", "nu", "ne", "no"] },
  { title: "Pa Matra Series", objective: "Repeat a full matra family with PA.", keys: ["pi", "pu", "pe", "po"] },
  { title: "Ba Matra Series", objective: "Repeat a full matra family with BA.", keys: ["bi", "bu", "be", "bo"] },
  { title: "Sanyukt Akshar", objective: "Build the common KSH, TRA, GYA, and SHRA combinations.", keys: ["ksha", "tra", "gya", "shra"] },
  { title: "Professional Review", objective: "Combine vowels, matras, consonants, and conjuncts.", keys: ["kary", "kram", "lakshya", "shuddhata"] },
];

function words(value: string) {
  return value.trim().split(/\s+/u);
}

const ENGLISH_PROFESSIONAL_WORD_MODULES: readonly WordModule[] = [
  { title: "Accuracy Fundamentals", words: words("accuracy careful correct exact focus posture precise rhythm steady touch control practice") },
  { title: "Learning Progress", words: words("lesson course module chapter exercise review improve progress target skill mastery confidence") },
  { title: "Office Workflow", words: words("office manager meeting schedule memo email folder desk workflow task calendar colleague") },
  { title: "Document Handling", words: words("document report record format heading paragraph margin table copy archive signature") },
  { title: "Data Entry", words: words("data entry field value number symbol verify input output total column row database") },
  { title: "Government Work", words: words("government department officer public notice order application service citizen register") },
  { title: "Examination Skills", words: words("exam candidate question answer duration attempt result score qualify instruction") },
  { title: "Technology", words: words("computer keyboard browser software secure offline online network system update backup") },
  { title: "Communication", words: words("message letter response request information explain confirm contact conversation language") },
  { title: "Finance and Accounts", words: words("account payment amount balance receipt invoice budget credit debit audit") },
  { title: "Legal and Court", words: words("court legal judge order hearing petition evidence statement justice record") },
  { title: "Customer Service", words: words("customer support solution quality feedback complaint resolve helpful polite response") },
  { title: "Time and Productivity", words: words("daily weekly timely priority complete efficient organize prepare plan finish") },
  { title: "Quality Control", words: words("inspect compare validate correction mistake missing extra substitution standard benchmark") },
  { title: "Professional Vocabulary", words: words("analysis approval procedure responsibility confidential official development management") },
  { title: "Citizen Services", words: words("citizen service portal request status certificate grievance assistance access delivery response reference") },
  { title: "Recruitment Notices", words: words("recruitment vacancy eligibility qualification reservation application candidate examination verification merit appointment") },
  { title: "Railway Administration", words: words("railway station passenger freight schedule route signal control ticket safety timing restoration") },
  { title: "Judicial Filing", words: words("petition hearing evidence affidavit annexure judgment registry filing appeal summons order confidential") },
  { title: "Audit and Sanction", words: words("audit voucher sanction expenditure ledger reconciliation invoice receipt liability grant budget approval") },
  { title: "Public Health", words: words("health hospital medicine laboratory patient district survey report stock emergency verified confidential") },
  { title: "Rural Development", words: words("village proposal estimate benefit period community inspection payment measurement project record approval") },
  { title: "Disaster Response", words: words("disaster control shelter equipment evacuation incident source urgency action restoration review communication") },
  { title: "Education Records", words: words("education admission scholarship attendance result teacher posting enrolment textbook facility identifier publication") },
  { title: "Environmental Reports", words: words("environment air water rainfall plantation waste monitoring sample location measurement trend evidence") },
  { title: "Election Duty", words: words("election polling neutral assignment transport inventory counting reporting authorised transparency instruction") },
  { title: "Digital Public Service", words: words("digital transaction account password attachment backup access security reference application certificate") },
  { title: "Statistical Reporting", words: words("statistics total average percentage district category period comparison increase decrease summary source") },
  { title: "Compliance Review", words: words("compliance rule condition inspection observation response action deadline authority evidence closure") },
  { title: "Official Correspondence", words: words("subject reference memorandum circular notification enclosure copy signature designation dispatch acknowledgement") },
];

const HINDI_PROFESSIONAL_WORD_MODULES: readonly WordModule[] = [
  { title: "Accuracy Fundamentals", words: words("abhyas gati shuddhata lakshya prayas pragati dhyan samay niyam vishvas sudhar galti safalta kaushal") },
  { title: "Learning Progress", words: words("adhyayan adhyay pathyakram prashikshan prashikshit anubhav mulyankan aakalan ank parinam vidya shiksha") },
  { title: "Keyboard Skills", words: words("keyboard akshar pankti madhya upari nichali ungli baya daya sparsh shift lay talmel doharav") },
  { title: "Office Workflow", words: words("karyalay karmachari adhikari baithak dainik masik karyavahi jimmedari dayitva vyavasthit samiksha sveekriti") },
  { title: "Document Handling", words: words("dastavez file abhilekh report record vivaran talika prarup pratilipi hastakshar sangrah gopniya") },
  { title: "Data Entry", words: words("data operator pravishti aankada ganana satyapan jaanch suchana jankari prakriya pranali gunavatta") },
  { title: "Government Work", words: words("prashasan vibhag aadesh adhisuchana aayog aayojan anumati prastav seva vikas nirnay") },
  { title: "Examination Skills", words: words("pariksha abhyarthi ummidvar prashn nirdesh nirdharit taiyari samay parinam ank anushasan") },
  { title: "Applications", words: words("aavedan aavedak panjikaran praman pramanit chayan upasthiti aavashyak prathmik anumati adhisuchana") },
  { title: "Technology", words: words("computer software unicode online takneek suraksha backup browser keyboard data system adhunik") },
  { title: "Communication", words: words("sanchar sandesh suchana jankari sahayata samadhan samiksha grahak seva bhasha vakya shabd") },
  { title: "Finance", words: words("bank bhugtan raseed khata rashi budget lekha ganana praman satyapan report record") },
  { title: "Legal and Court", words: words("nyay nyayalay adhikar aadesh nirnay karyavahi praman abhilekh dastavez gopniya satyapan") },
  { title: "Language Control", words: words("matra sanyukt viram chihn anuchchhed vakya shabd akshar shuddh sahi typing hindi unicode") },
  { title: "Professional Vocabulary", words: words("vyavsayik professional dakshata gunavatta prabandhan vishleshan niyantran nirantar sthirata jimmedar mahatvapurn") },
  { title: "Citizen Services", words: words("nagrik seva sahayata aavedan aavedak panjikaran praman suchana samadhan anumati jankari sandarbh") },
  { title: "Recruitment Notices", words: words("bharti rikti patrata yogyata aayu seema aarakshan abhyarthi pariksha chayan pravesh adhisuchana") },
  { title: "Railway Administration", words: words("railway station yatri parivahan samaysaarani marg suraksha niyantran vilamb suchana karmachari report") },
  { title: "Judicial Filing", words: words("nyayalay yachika sunvai sakshya shapathpatra sanlagna appeal aadesh nirnay abhilekh praman gopniya") },
  { title: "Audit and Accounts", words: words("lekha jaanch budget bhugtan raseed khata rashi ganana anumati sveekriti satyapan report") },
  { title: "Public Health", words: words("swasthya aspatal aushadhi prayogshala rogi jila stock sahayata jaanch parinam suraksha suchana") },
  { title: "Rural Development", words: words("gram gramin prastav lagat labh avadhi samudayik nirikshan bhugtan vikas aayojan abhilekh") },
  { title: "Disaster Response", words: words("suraksha sahayata niyantran suchana srot sandesh samay vyavasthit jimmedari karyavahi samiksha nuksan") },
  { title: "Education Records", words: words("shiksha vidyarthi pravesh pariksha parinam upasthiti praman adhyayan pathyakram adhyay aakalan panjikaran") },
  { title: "Environmental Reports", words: words("paryavaran jal vayu nirikshan aankada srot jila report satyapan gunavatta vikas praman") },
  { title: "Election Duty", words: words("nirvachan matdaan ginti niyam nirdesh adhikari karmachari upasthiti suraksha suchana parinam uttardayitva") },
  { title: "Digital Public Service", words: words("computer online lenden suraksha backup aavedan praman sandarbh pranali gopniya takneek jankari") },
  { title: "Statistical Reporting", words: words("aankada ganana rashi ank aakalan jila talika vivaran masik dainik report satyapan") },
  { title: "Compliance Review", words: words("niyam jaanch nirikshan samiksha karyavahi adhikari anumati praman samadhan nirnay uttardayitva sveekriti") },
  { title: "Official Correspondence", words: words("sandarbh aadesh adhisuchana suchana prastav pratilipi hastakshar vivaran vibhag karyalay sangrah sveekriti") },
];

const ENGLISH_SENTENCE_SUBJECTS = [
  "A careful typist", "A trained operator", "A focused learner", "The office assistant", "The data entry clerk",
  "A responsible candidate", "The records officer", "A skilled professional", "The support executive", "The examination student",
  "A quality reviewer", "The document specialist", "A confident beginner", "The team coordinator", "The court assistant",
  "A disciplined user", "The system operator", "A public service clerk",
] as const;

const ENGLISH_SENTENCE_ACTIONS = [
  "checks every entry before submission", "maintains an even rhythm throughout the exercise",
  "reviews each correction before continuing", "keeps both hands relaxed over the home row",
  "verifies names, numbers, and dates carefully", "completes the assigned passage in a steady flow",
  "records the result with accurate formatting", "reads the instruction before starting the timer",
  "protects confidential documents during processing", "uses the correct finger for every new key",
  "compares the source and typed copy line by line", "organizes the report before final approval",
  "practises difficult combinations without rushing", "corrects repeated errors through focused review",
  "prepares the application in the required format", "tracks speed and accuracy after every lesson",
  "uses punctuation without breaking typing rhythm", "finishes each task with a complete quality check",
] as const;

const ENGLISH_SENTENCE_ENDINGS = [
  "to protect accuracy.", "before the deadline.", "without looking at the keyboard.", "for a reliable final result.",
  "during every professional session.", "before moving to the next lesson.", "with calm and consistent movement.",
  "according to the selected training goal.", "while keeping the original meaning clear.", "so that every detail remains correct.",
  "and reviews the weak keys afterward.", "until the movement feels natural.",
] as const;

const HINDI_SENTENCE_SUBJECTS = [
  "ek kushal operator", "prashikshit karmachari", "har abhyarthi", "jimmedar adhikari", "typing ka vidyarthi",
  "karyalay ka karmachari", "data entry operator", "pariksha ka ummidvar", "dastavez ka operator", "ek sateek typist",
  "prashasan ka adhikari", "nyayalay ka karmachari", "seva ka operator", "gunavatta samikshak", "computer operator",
] as const;

const HINDI_SENTENCE_ACTIONS = [
  "har pravishti ko dhyan se jaanchta hai", "dastavez ki sahi samiksha karta hai", "keyboard par ungli ki sthiti sahi rakhta hai",
  "nirdesh padhkar abhyas shuru karta hai", "samay ke sath shuddhata ka dhyan rakhta hai", "report ka satyapan pura karta hai",
  "galti ki jaanch karke sudhar karta hai", "data ko nirdharit prarup me ankit karta hai", "har vakya ko sahi kram me likhta hai",
  "gati se pahle shuddhata par dhyan deta hai", "abhilekh ko vyavasthit roop se sangrah karta hai", "prashn aur uttar ko dhyan se padhta hai",
  "niyamit abhyas se kaushal badhata hai", "sanyukt akshar aur matra ka doharav karta hai", "har parinam ki samiksha karta hai",
] as const;

const HINDI_SENTENCE_ENDINGS = [
  "aur gunavatta banaye rakhta hai.", "taki parinam sahi rahe.", "bina keyboard dekhe abhyas karta hai.",
  "aur agle adhyay ke liye taiyar hota hai.", "jisse aatmavishvas badhta hai.", "aur samay par kary pura karta hai.",
  "taki record surakshit rahe.", "aur har galti se naya kaushal sikhta hai.", "jisse gati aur sthirata milti hai.",
  "aur nirdharit lakshya pura karta hai.",
] as const;

const SENTENCE_TOPICS = [
  "Accuracy", "Finger Control", "Home Row", "Office Work", "Data Entry", "Documents", "Examinations", "Government Work",
  "Technology", "Communication", "Finance", "Court Work", "Time Control", "Quality Review", "Professional Mastery",
] as const;

const PARAGRAPH_TOPICS = [
  "Accuracy Before Speed", "Professional Keyboard Habits", "Office Document Workflow", "Reliable Data Entry",
  "Focused Examination Practice", "Public Service Records", "Digital Document Safety", "Clear Communication",
  "Time and Task Management", "Quality Review Process", "Court and Legal Records", "Financial Data Accuracy",
  "Continuous Skill Development", "Error Analysis and Recovery", "Complete Course Mastery",
] as const;

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

function buildAlphabeticWordModules(
  source: readonly WordModule[],
  title: string,
  groupCount: number,
) {
  const sorted = unique(source.flatMap((module) => module.words))
    .sort((left, right) => left.localeCompare(right, "en"));
  const groupSize = Math.ceil(sorted.length / groupCount);
  return Array.from({ length: groupCount }, (_, index): WordModule => {
    const start = index * groupSize;
    const selected = sorted.slice(start, start + groupSize);
    const first = selected[0]?.slice(0, 1).toLocaleUpperCase() ?? "A";
    const last = selected.at(-1)?.slice(0, 1).toLocaleUpperCase() ?? first;
    return {
      title: `${title} ${String(index + 1).padStart(2, "0")} · ${first}–${last}`,
      words: selected,
    };
  });
}

const ENGLISH_WORD_MODULES: readonly WordModule[] = [
  ...buildAlphabeticWordModules(ENGLISH_PROFESSIONAL_WORD_MODULES, "Alphabetic Control", 20),
  ...ENGLISH_PROFESSIONAL_WORD_MODULES,
];

const HINDI_WORD_MODULES: readonly WordModule[] = [
  ...buildAlphabeticWordModules(HINDI_PROFESSIONAL_WORD_MODULES, "Akshar Control", 20),
  ...HINDI_PROFESSIONAL_WORD_MODULES,
];

function rotateUnique<T>(items: readonly T[], start: number, count: number) {
  const available = unique(items);
  return Array.from({ length: Math.min(count, available.length) }, (_, offset) => available[(start + offset) % available.length]);
}

function fillDrill(units: readonly string[], start: number, minimumCharacters: number) {
  const ordered = rotateUnique(units, start, units.length);
  const output: string[] = [];
  let cursor = 0;
  while (output.join(" ").length < minimumCharacters) {
    output.push(ordered[cursor % ordered.length]);
    cursor += 1;
  }
  return output.join(" ");
}

function buildKeyUnits(current: readonly string[], review: readonly string[], hindi: boolean) {
  const active = unique([...current, ...review]);
  const repeated = active.map((key) => hindi ? `${key} ${key} ${key} ${key}` : key.repeat(4));
  const alternated = active.map((key, index) => {
    const next = active[(index + 1) % active.length];
    return hindi
      ? `${key} ${next} ${key} ${next} ${next} ${key} ${next} ${key}`
      : `${key}${next}${key}${next} ${next}${key}${next}${key}`;
  });
  const grouped = Array.from({ length: Math.max(4, active.length) }, (_, index) => {
    const group = rotateUnique(active, index, Math.min(5, active.length));
    return hindi ? group.join(" ") : group.join("");
  });
  return { repeated, alternated, grouped, all: unique([...repeated, ...alternated, ...grouped]) };
}

function buildKeyLesson(index: number, english: boolean): CanonicalLessonSeed {
  const modules = english ? ENGLISH_KEY_MODULES : HINDI_KEY_MODULES;
  const moduleIndex = Math.floor(index / KEY_DRILLS.length);
  const variation = index % KEY_DRILLS.length;
  const module = modules[moduleIndex];
  const drill = KEY_DRILLS[variation];
  const previous = variation === 2
    ? modules.slice(Math.max(0, moduleIndex - 2), moduleIndex).flatMap((item) => item.keys)
    : [];
  const units = buildKeyUnits(module.keys, previous, !english);
  const drillBlocks: readonly CanonicalDrillBlock[] = [
    {
      label: "Warm-up",
      purpose: "Set finger position and establish a controlled rhythm.",
      content: fillDrill(units.repeated, index * 3, 44 + moduleIndex),
    },
    {
      label: "Control",
      purpose: "Alternate the active keys without watching the keyboard.",
      content: fillDrill(units.alternated, index * 5 + 1, 56 + variation * 8),
    },
    {
      label: "Application",
      purpose: "Mix the new movement with previously learned keys.",
      content: fillDrill(units.grouped, index * 7 + 2, 68 + moduleIndex * 2),
    },
    {
      label: "Checkpoint",
      purpose: "Finish one uninterrupted accuracy run at the lesson target.",
      content: fillDrill(units.all, index * 11 + 3, 80 + moduleIndex * 3),
    },
  ];
  const content = drillBlocks.map((block) => block.content).join("\n");
  return {
    title: `${module.title} — ${drill.label}`,
    moduleTitle: module.title,
    drillLabel: drill.label,
    objective: `${module.objective} ${drill.objective}`,
    content,
    competency: variation === 0 ? "Position" : variation === 1 ? "Control" : "Retention",
    practiceMode: variation === 2 ? "accuracy" : "guided",
    requiredPasses: variation === 2 ? 2 : 1,
    drillBlocks,
    minimumAccuracy: Math.min(98, 92 + Math.floor(moduleIndex / 4) + variation),
    targetWpm: 10 + Math.floor(moduleIndex / 2) + variation,
  };
}

function buildWordLesson(index: number, english: boolean): CanonicalLessonSeed {
  const modules = english ? ENGLISH_WORD_MODULES : HINDI_WORD_MODULES;
  const variationCount = 4;
  const moduleIndex = Math.floor(index / variationCount);
  const variation = index % variationCount;
  const module = modules[moduleIndex];
  const neighbors = [-2, -1, 0, 1, 2].map(
    (offset) => modules[(moduleIndex + modules.length + offset) % modules.length],
  );
  const pool = unique(neighbors.flatMap((neighbor) => neighbor.words));
  const selected = rotateUnique(pool, variation + moduleIndex * 7, 32 + variation);
  const recognition = selected.slice(0, 12).flatMap((word) => [word, word]);
  const accuracyCircuit = [
    ...selected,
    ...rotateUnique(selected, Math.max(1, variation + 3), selected.length),
  ];
  const timedRun = [
    ...rotateUnique(selected, variation * 3 + 5, selected.length),
    ...rotateUnique(selected, variation * 5 + 11, selected.length),
    ...rotateUnique(selected, variation * 7 + 17, Math.ceil(selected.length / 2)),
  ];
  const drillBlocks: readonly CanonicalDrillBlock[] = [
    { label: "Recognition", purpose: "Repeat each focus word twice to establish a clean movement pattern.", content: recognition.join(" ") },
    { label: "Accuracy circuit", purpose: "Type two controlled rounds with consistent spacing and no skipped words.", content: accuracyCircuit.join(" ") },
    { label: "Timed run", purpose: "Finish a longer mixed sequence without pausing between familiar words.", content: timedRun.join(" ") },
  ];
  return {
    title: `${module.title} — Word Set ${variation + 1}`,
    moduleTitle: module.title,
    drillLabel: `Word Set ${variation + 1}`,
    objective: `Master ${selected.length} distinct professional words through repeated recognition, a two-round accuracy circuit, and a sustained timed run.`,
    content: drillBlocks.map((block) => block.content).join("\n"),
    competency: module.title,
    practiceMode: variation < 2 ? "accuracy" : "flow",
    requiredPasses: variation < 3 ? 1 : 2,
    drillBlocks,
    minimumAccuracy: Math.min(98, 94 + Math.floor(index / 30)),
    targetWpm: 18 + Math.floor(index / 15),
  };
}

function englishSentence(seed: number) {
  const subject = ENGLISH_SENTENCE_SUBJECTS[seed % ENGLISH_SENTENCE_SUBJECTS.length];
  const action = ENGLISH_SENTENCE_ACTIONS[Math.floor(seed / ENGLISH_SENTENCE_SUBJECTS.length) % ENGLISH_SENTENCE_ACTIONS.length];
  const ending = ENGLISH_SENTENCE_ENDINGS[(seed * 5 + Math.floor(seed / 7)) % ENGLISH_SENTENCE_ENDINGS.length];
  return `${subject} ${action} ${ending}`;
}

function hindiSentence(seed: number) {
  const subject = HINDI_SENTENCE_SUBJECTS[seed % HINDI_SENTENCE_SUBJECTS.length];
  const action = HINDI_SENTENCE_ACTIONS[Math.floor(seed / HINDI_SENTENCE_SUBJECTS.length) % HINDI_SENTENCE_ACTIONS.length];
  const ending = HINDI_SENTENCE_ENDINGS[(seed * 3 + Math.floor(seed / 5)) % HINDI_SENTENCE_ENDINGS.length];
  return `${subject} ${action} ${ending}`;
}

function buildSentenceLesson(index: number, english: boolean): CanonicalLessonSeed {
  const topicIndex = Math.floor(index / 8);
  const variation = index % 8;
  const count = 7 + Math.floor(index / 30);
  const sentenceBuilder = english ? englishSentence : hindiSentence;
  const sentences = Array.from({ length: count }, (_, offset) => sentenceBuilder(index * 13 + offset * 17));
  const normalized = sentences.map((sentence) => english ? sentence : sentence.replace(/\./gu, ""));
  const blockSize = Math.ceil(normalized.length / 3);
  const drillBlocks: readonly CanonicalDrillBlock[] = [
    { label: "Short flow", purpose: "Keep word spacing and matra or punctuation placement accurate.", content: normalized.slice(0, blockSize).join(" ") },
    { label: "Continuous copy", purpose: "Maintain rhythm through a longer uninterrupted sentence group.", content: normalized.slice(blockSize, blockSize * 2).join(" ") },
    { label: "Accuracy gate", purpose: "Complete the final group above the minimum accuracy target.", content: normalized.slice(blockSize * 2).join(" ") },
  ];
  const content = drillBlocks.map((block) => block.content).join("\n");
  return {
    title: `${SENTENCE_TOPICS[topicIndex]} — Sentence Flow ${variation + 1}`,
    moduleTitle: SENTENCE_TOPICS[topicIndex],
    drillLabel: `Sentence Flow ${variation + 1}`,
    objective: `Maintain rhythm across ${count} original sentences while preserving spacing, capitals, and punctuation.`,
    content,
    competency: SENTENCE_TOPICS[topicIndex],
    practiceMode: "flow",
    requiredPasses: variation < 3 ? 1 : 2,
    drillBlocks,
    minimumAccuracy: Math.min(98, 95 + Math.floor(index / 30)),
    targetWpm: 24 + Math.floor(index / 15),
  };
}

function buildParagraphLesson(index: number, english: boolean): CanonicalLessonSeed {
  const topicIndex = Math.floor(index / 6);
  const variation = index % 6;
  const count = 14 + Math.floor(index / 15);
  const sentenceBuilder = english ? englishSentence : hindiSentence;
  const sentences = Array.from({ length: count }, (_, offset) => sentenceBuilder(1000 + index * 23 + offset * 19));
  const midpoint = Math.ceil(sentences.length / 2);
  const firstParagraph = sentences.slice(0, midpoint).join(" ");
  const secondParagraph = sentences.slice(midpoint).join(" ");
  const normalizedFirst = english ? firstParagraph : firstParagraph.replace(/\./gu, "");
  const normalizedSecond = english ? secondParagraph : secondParagraph.replace(/\./gu, "");
  const drillBlocks: readonly CanonicalDrillBlock[] = [
    { label: "Document copy", purpose: "Copy the first paragraph with formal spacing and punctuation discipline.", content: normalizedFirst },
    { label: "Exam run", purpose: "Continue without interruption and finish at the target speed.", content: normalizedSecond },
  ];
  const content = drillBlocks.map((block) => block.content).join("\n\n");
  return {
    title: `${PARAGRAPH_TOPICS[topicIndex]} — Passage ${variation + 1}`,
    moduleTitle: PARAGRAPH_TOPICS[topicIndex],
    drillLabel: `Passage ${variation + 1}`,
    objective: `Complete a sustained two-paragraph passage with at least ${96 + Math.floor(index / 30)}% accuracy.`,
    content,
    competency: PARAGRAPH_TOPICS[topicIndex],
    practiceMode: "exam",
    requiredPasses: variation < 3 ? 2 : 3,
    drillBlocks,
    minimumAccuracy: 96 + Math.floor(index / 30),
    targetWpm: 30 + Math.floor(index / 12),
  };
}

export function buildCanonicalLesson(stageId: CanonicalCurriculumStageId, index: number, english: boolean) {
  if (stageId === "learn-keys") return buildKeyLesson(index, english);
  if (stageId === "practice-words") return buildWordLesson(index, english);
  if (stageId === "sentences") return buildSentenceLesson(index, english);
  return buildParagraphLesson(index, english);
}

export const PROFESSIONAL_HINDI_WORD_COUNT = Object.keys(HINDI_PROFESSIONAL_LEXICON).length;
