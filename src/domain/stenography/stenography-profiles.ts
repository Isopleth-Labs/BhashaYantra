import type { TypingLanguageCode } from "@/domain/typing/typing-profiles";

export type StenographyEnvironment = "courtroom" | "office";
export type StenographyVerification = "practice" | "official-reference";

export interface StenographyProfile {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly authority: string;
  readonly language: TypingLanguageCode;
  readonly environment: StenographyEnvironment;
  readonly verification: StenographyVerification;
  readonly dictationSeconds: number;
  readonly transcriptionSeconds: number;
  readonly dictationWpm: number;
  readonly sourceUrl?: string;
  readonly sourceLabel?: string;
  readonly rules: readonly string[];
  readonly description: string;
  readonly seed: number;
}

const ENGLISH_OFFICE_SENTENCES = [
  "The section officer reviewed the pending files and directed every branch to record the next action before the weekly coordination meeting.",
  "Each register must show the date of receipt, the responsible desk, the present status, and the reason for any delay in disposal.",
  "The administrative team will circulate the approved minutes after checking names, references, deadlines, and the officers assigned to each decision.",
  "All digital records must be stored under the prescribed file number so that an authorised officer can locate the complete history without confusion.",
  "The public assistance counter shall acknowledge every application and give the citizen a clear reference number for future correspondence.",
  "Before dispatch, the dealing assistant will compare the signed order with the approved draft and confirm that every annexure is attached in sequence.",
  "Urgent matters must be marked with a written reason, placed before the competent authority, and tracked until the final communication is issued.",
  "The monthly review will measure completed work, unresolved cases, service timelines, and the corrective action proposed for the next reporting period.",
  "Employees handling confidential information shall use approved systems and shall not copy official records to personal devices or unverified services.",
  "A clear office note should state the facts, cite the relevant rule, identify the decision required, and avoid language that may create ambiguity.",
] as const;

const ENGLISH_COURT_SENTENCES = [
  "The matter was called in open court and learned counsel for both sides confirmed that copies of the filed documents had been exchanged.",
  "The witness identified the record placed before the court and answered the questions after taking time to understand each question completely.",
  "The registry shall verify the pagination, remove duplicate papers, and place the corrected file before the bench on the next working day.",
  "Counsel requested a short opportunity to file a response, and the court directed that an advance copy be supplied to the opposite party.",
  "The order records only the submissions necessary for the present stage and does not express a final opinion on the merits of the dispute.",
  "The parties shall preserve the relevant electronic material and file a brief statement explaining its source, custody, and manner of production.",
  "After hearing the preliminary objections, the court framed the issue that requires determination and listed the matter for focused arguments.",
  "The certified copy section will process the application according to priority and will notify the applicant if any required detail is incomplete.",
  "The deposition was read over to the witness, who admitted it to be correct and signed the record in the presence of the authorised officer.",
  "Compliance shall be reported by affidavit before the next date, failing which the responsible officer must remain present with the relevant file.",
] as const;

const HINDI_OFFICE_SENTENCES = [
  "अनुभाग अधिकारी ने लंबित पत्रावलियों की समीक्षा करके प्रत्येक शाखा को अगली साप्ताहिक बैठक से पहले कार्रवाई की स्थिति दर्ज करने का निर्देश दिया।",
  "हर पंजी में आवेदन प्राप्त होने की तारीख जिम्मेदार पटल वर्तमान स्थिति और विलंब का स्पष्ट कारण लिखा जाना चाहिए।",
  "प्रशासन शाखा स्वीकृत कार्यवृत्त में नाम संदर्भ समय सीमा और जिम्मेदार अधिकारी की जांच करने के बाद उसे सभी अनुभागों को भेजेगी।",
  "डिजिटल अभिलेख निर्धारित फाइल संख्या के अंतर्गत सुरक्षित किए जाएं ताकि अधिकृत कर्मचारी पूरा विवरण बिना भ्रम के खोज सके।",
  "जन सहायता कक्ष प्रत्येक आवेदन की पावती देगा और भविष्य के पत्राचार के लिए नागरिक को स्पष्ट संदर्भ संख्या उपलब्ध कराएगा।",
  "प्रेषण से पहले सहायक हस्ताक्षरित आदेश का स्वीकृत प्रारूप से मिलान करेगा और सभी संलग्नकों का क्रम भी जांचेगा।",
  "तात्कालिक मामले लिखित कारण के साथ सक्षम अधिकारी के समक्ष रखे जाएंगे और अंतिम सूचना जारी होने तक उनकी निगरानी की जाएगी।",
  "मासिक समीक्षा में पूरा कार्य अनिर्णीत मामले सेवा समय सीमा और अगले प्रतिवेदन काल की सुधारात्मक कार्रवाई देखी जाएगी।",
  "गोपनीय सूचना संभालने वाले कर्मचारी केवल स्वीकृत प्रणाली का उपयोग करेंगे और सरकारी अभिलेख निजी उपकरण पर सुरक्षित नहीं करेंगे।",
  "स्पष्ट कार्यालय टिप्पणी में तथ्य संबंधित नियम अपेक्षित निर्णय और जरूरी संदर्भ सरल भाषा में लिखे जाने चाहिए।",
] as const;

const HINDI_COURT_SENTENCES = [
  "प्रकरण खुले न्यायालय में पुकारा गया और दोनों पक्षों के अधिवक्ताओं ने दाखिल दस्तावेजों की प्रतियां एक दूसरे को मिलने की पुष्टि की।",
  "साक्षी ने न्यायालय के समक्ष रखे अभिलेख की पहचान की और प्रत्येक प्रश्न को समझने के बाद अपना उत्तर दर्ज कराया।",
  "निबंधक शाखा पृष्ठ क्रम की जांच करके दोहराए गए कागज हटाएगी और संशोधित पत्रावली अगले कार्य दिवस पर पीठ के समक्ष रखेगी।",
  "अधिवक्ता ने उत्तर दाखिल करने के लिए संक्षिप्त अवसर मांगा और न्यायालय ने उसकी अग्रिम प्रति विपक्षी पक्ष को देने का निर्देश दिया।",
  "यह आदेश वर्तमान चरण के लिए आवश्यक निवेदनों को दर्ज करता है और विवाद के गुण दोष पर अंतिम राय व्यक्त नहीं करता।",
  "सभी पक्ष संबंधित इलेक्ट्रॉनिक सामग्री सुरक्षित रखेंगे और उसके स्रोत अभिरक्षा तथा प्रस्तुत करने की प्रक्रिया का संक्षिप्त विवरण दाखिल करेंगे।",
  "प्रारंभिक आपत्तियों को सुनने के बाद न्यायालय ने विचार योग्य प्रश्न निर्धारित किया और मामले को केंद्रित बहस के लिए सूचीबद्ध किया।",
  "प्रमाणित प्रतिलिपि शाखा आवेदन को निर्धारित प्राथमिकता के अनुसार संसाधित करेगी और अधूरी जानकारी होने पर आवेदक को सूचित करेगी।",
  "बयान साक्षी को पढ़कर सुनाया गया जिसने उसे सही स्वीकार किया और अधिकृत अधिकारी की उपस्थिति में अभिलेख पर हस्ताक्षर किए।",
  "अनुपालन की सूचना अगली तारीख से पहले शपथ पत्र द्वारा दी जाएगी अन्यथा जिम्मेदार अधिकारी संबंधित पत्रावली के साथ उपस्थित रहेगा।",
] as const;

function sentenceBank(language: TypingLanguageCode, environment: StenographyEnvironment) {
  if (language === "hi") return environment === "courtroom" ? HINDI_COURT_SENTENCES : HINDI_OFFICE_SENTENCES;
  return environment === "courtroom" ? ENGLISH_COURT_SENTENCES : ENGLISH_OFFICE_SENTENCES;
}

export function countStenographyWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

export function buildOriginalStenographyScript(profile: StenographyProfile) {
  const targetWords = Math.max(80, Math.round(profile.dictationWpm * profile.dictationSeconds / 60));
  const bank = sentenceBank(profile.language, profile.environment);
  const result: string[] = [];
  let words = 0;
  let index = profile.seed;
  while (words < targetWords) {
    const sentence = bank[index % bank.length];
    result.push(sentence);
    words += countStenographyWords(sentence);
    index += 3;
  }
  return result.join(" ").split(/\s+/u).slice(0, targetWords).join(" ");
}

const SSC_SOURCE = "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_steno_2025.pdf";
const AHC_SOURCE = "https://www.allahabadhighcourt.in/event/Admit_card_notice_Stenographer_GrIII.html";

export const STENOGRAPHY_PROFILES: readonly StenographyProfile[] = [
  {
    id: "court-hi-foundation", name: "Courtroom Orders · Hindi Foundation", shortName: "Court HI 60", authority: "BhashaYantra Practice Lab",
    language: "hi", environment: "courtroom", verification: "practice", dictationSeconds: 180, transcriptionSeconds: 900, dictationWpm: 60, seed: 8,
    description: "Original district-court order and registry vocabulary at a controlled foundation pace.",
    rules: ["3-minute original practice narration", "Listen-and-type mode available", "Not an official or leaked examination recording"],
  },
  {
    id: "court-hi-advanced", name: "Courtroom Proceedings · Hindi Advanced", shortName: "Court HI 100", authority: "BhashaYantra Practice Lab",
    language: "hi", environment: "courtroom", verification: "practice", dictationSeconds: 300, transcriptionSeconds: 1800, dictationWpm: 100, seed: 9,
    description: "Long-form procedural Hindi for advanced shorthand and judicial transcription practice.",
    rules: ["5-minute original practice narration", "Pause available outside exam simulation", "Accuracy report after submission"],
  },
  {
    id: "court-en-foundation", name: "Courtroom Orders · English Foundation", shortName: "Court EN 80", authority: "BhashaYantra Practice Lab",
    language: "en", environment: "courtroom", verification: "practice", dictationSeconds: 180, transcriptionSeconds: 900, dictationWpm: 80, seed: 10,
    description: "Original English court orders, appearances, registry directions, and evidence vocabulary.",
    rules: ["3-minute original practice narration", "Listen-and-type mode available", "Not an official or leaked examination recording"],
  },
  {
    id: "court-en-advanced", name: "Courtroom Proceedings · English Advanced", shortName: "Court EN 120", authority: "BhashaYantra Practice Lab",
    language: "en", environment: "courtroom", verification: "practice", dictationSeconds: 300, transcriptionSeconds: 1800, dictationWpm: 120, seed: 11,
    description: "High-speed judicial copy for personal-assistant and court-stenographer preparation.",
    rules: ["5-minute original practice narration", "Pause available outside exam simulation", "Accuracy report after submission"],
  },
  {
    id: "office-hi-guided", name: "Government Office · Hindi Guided", shortName: "Office HI", authority: "BhashaYantra",
    language: "hi", environment: "office", verification: "practice", dictationSeconds: 120, transcriptionSeconds: 600, dictationWpm: 80, seed: 0,
    description: "Original administrative dictation for shorthand, note-taking, and clean transcription.",
    rules: ["3-second preparation countdown", "Pause and early transcription are allowed", "Original BhashaYantra practice script"],
  },
  {
    id: "office-en-guided", name: "Government Office · English Guided", shortName: "Office EN", authority: "BhashaYantra",
    language: "en", environment: "office", verification: "practice", dictationSeconds: 120, transcriptionSeconds: 600, dictationWpm: 80, seed: 1,
    description: "Original government-office copy with procedural vocabulary and complete sentences.",
    rules: ["3-second preparation countdown", "Pause and early transcription are allowed", "Original BhashaYantra practice script"],
  },
  {
    id: "office-hi-speed", name: "Government Note & Dispatch · Hindi Speed", shortName: "Office HI 100", authority: "BhashaYantra Practice Lab",
    language: "hi", environment: "office", verification: "practice", dictationSeconds: 300, transcriptionSeconds: 1800, dictationWpm: 100, seed: 12,
    description: "Original noting, dispatch, public-service, and administrative-review copy at advanced pace.",
    rules: ["5-minute original office narration", "Listen-and-type mode available", "Local result and error analysis"],
  },
  {
    id: "office-en-speed", name: "Government Note & Dispatch · English Speed", shortName: "Office EN 100", authority: "BhashaYantra Practice Lab",
    language: "en", environment: "office", verification: "practice", dictationSeconds: 300, transcriptionSeconds: 1800, dictationWpm: 100, seed: 13,
    description: "Original administrative English copy covering noting, registers, dispatch, and records.",
    rules: ["5-minute original office narration", "Listen-and-type mode available", "Local result and error analysis"],
  },
  {
    id: "ssc-d-hi", name: "SSC Stenographer Grade D · Hindi", shortName: "SSC D HI", authority: "Staff Selection Commission",
    language: "hi", environment: "office", verification: "official-reference", dictationSeconds: 600, transcriptionSeconds: 3900, dictationWpm: 80, seed: 2,
    description: "Official-rule simulation using an original Hindi office script.", sourceUrl: SSC_SOURCE, sourceLabel: "SSC Stenographer 2025 notice",
    rules: ["10-minute dictation at 80 WPM", "65-minute Hindi transcription", "Practice result only; current notice remains final authority"],
  },
  {
    id: "ssc-d-en", name: "SSC Stenographer Grade D · English", shortName: "SSC D EN", authority: "Staff Selection Commission",
    language: "en", environment: "office", verification: "official-reference", dictationSeconds: 600, transcriptionSeconds: 3000, dictationWpm: 80, seed: 3,
    description: "Official-rule simulation using an original English office script.", sourceUrl: SSC_SOURCE, sourceLabel: "SSC Stenographer 2025 notice",
    rules: ["10-minute dictation at 80 WPM", "50-minute English transcription", "Practice result only; current notice remains final authority"],
  },
  {
    id: "ssc-c-hi", name: "SSC Stenographer Grade C · Hindi", shortName: "SSC C HI", authority: "Staff Selection Commission",
    language: "hi", environment: "office", verification: "official-reference", dictationSeconds: 600, transcriptionSeconds: 3300, dictationWpm: 100, seed: 4,
    description: "Official-rule simulation using an original Hindi office script.", sourceUrl: SSC_SOURCE, sourceLabel: "SSC Stenographer 2025 notice",
    rules: ["10-minute dictation at 100 WPM", "55-minute Hindi transcription", "Practice result only; current notice remains final authority"],
  },
  {
    id: "ssc-c-en", name: "SSC Stenographer Grade C · English", shortName: "SSC C EN", authority: "Staff Selection Commission",
    language: "en", environment: "office", verification: "official-reference", dictationSeconds: 600, transcriptionSeconds: 2400, dictationWpm: 100, seed: 5,
    description: "Official-rule simulation using an original English office script.", sourceUrl: SSC_SOURCE, sourceLabel: "SSC Stenographer 2025 notice",
    rules: ["10-minute dictation at 100 WPM", "40-minute English transcription", "Practice result only; current notice remains final authority"],
  },
  {
    id: "ahc-hi", name: "Allahabad High Court · Hindi", shortName: "AHC HI", authority: "Allahabad High Court",
    language: "hi", environment: "courtroom", verification: "official-reference", dictationSeconds: 300, transcriptionSeconds: 1800, dictationWpm: 80, seed: 6,
    description: "Courtroom simulation using original procedural copy.", sourceUrl: AHC_SOURCE, sourceLabel: "Allahabad High Court skill-test scheme",
    rules: ["400-word Hindi shorthand dictation in 5 minutes", "30-minute transcription", "Practice result only; current notice remains final authority"],
  },
  {
    id: "ahc-en", name: "Allahabad High Court · English", shortName: "AHC EN", authority: "Allahabad High Court",
    language: "en", environment: "courtroom", verification: "official-reference", dictationSeconds: 300, transcriptionSeconds: 1800, dictationWpm: 100, seed: 7,
    description: "Courtroom simulation using original procedural copy.", sourceUrl: AHC_SOURCE, sourceLabel: "Allahabad High Court skill-test scheme",
    rules: ["500-word English shorthand dictation in 5 minutes", "30-minute transcription", "Practice result only; current notice remains final authority"],
  },
] as const;
