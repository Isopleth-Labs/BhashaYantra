import type { TypingLanguageCode } from "@/domain/typing/typing-profiles";

export type ExamPassagePattern = "general" | "ssc" | "rrb" | "dda" | "dsssb" | "cpct" | "rajasthan-court" | "allahabad-court";

export const PASSAGE_PATTERN_LABELS: Readonly<Record<ExamPassagePattern, string>> = {
  general: "General office",
  ssc: "SSC clerical and data-entry",
  rrb: "Railway operations and records",
  dda: "Urban administration and office records",
  dsssb: "Delhi administration and education",
  cpct: "E-governance and data processing",
  "rajasthan-court": "Rajasthan court and registry",
  "allahabad-court": "Allahabad court and judicial office",
};

const ENGLISH_OFFICIAL_STYLE_BLOCKS = [
  "A public office must preserve every application, receipt, register, and approval in a clear sequence. The receiving clerk records the date and reference number before forwarding the file to the responsible section. The reviewing officer checks names, addresses, certificates, and supporting records before making a recommendation. If information is missing, the applicant receives a precise notice explaining what must be supplied. This orderly process protects citizens from delay, helps supervisors trace each decision, and creates a reliable record for inspection or appeal.",
  "Recruitment work begins with an authorised notice that describes the post, qualification, age limit, reservation, examination stages, and closing date. Candidates should compare every entry in the application with their certificates before final submission. The commission may verify identity, category, education, and experience at different stages. A provisional admission card does not remove the duty to satisfy eligibility conditions. Careful reading is therefore essential because an incorrect date, incomplete document, or unsupported claim can affect candidature even after a written examination has been completed.",
  "Railway offices coordinate passenger services, freight movement, station records, safety reports, and staff rosters across a large network. A clerk entering operational data must distinguish train numbers, dates, locations, and timings without altering their order. Control offices depend on accurate messages when a route is blocked or a service is delayed. The final record should state the event, action taken, responsible unit, and time of restoration. Consistent typing and careful verification help the organisation communicate quickly while preserving an accountable history of every operational decision.",
  "Court administration requires exact handling of petitions, notices, orders, evidence lists, and hearing schedules. The filing section assigns a case number and checks whether the required copies and fees have been submitted. Staff members must reproduce names and legal references without guesswork because a small change can affect the meaning of a record. Confidential material is shared only with authorised persons. Before a document is placed before the court, the responsible employee reviews page numbers, annexures, dates, and signatures so that the judicial file remains complete and dependable.",
  "Financial administration depends on accurate vouchers, sanction orders, invoices, account heads, and payment details. The dealing assistant confirms that expenditure has proper approval and falls within the available budget. Bills are compared with supply records before they reach the accounts section. An audit trail should show who prepared, checked, approved, and paid each claim. Typing speed is useful only when figures and references remain correct. A single misplaced digit may change an amount, delay reconciliation, or require a formal correction in the government account.",
  "Public health teams collect information from hospitals, laboratories, field workers, and local authorities. Daily reports may contain patient counts, stock positions, test results, and urgent requests for assistance. The data operator must enter each figure under the correct district and date while protecting confidential information. Supervisors use the compiled report to allocate medicines, equipment, and staff. When an unusual increase appears, the original source is checked before any conclusion is issued. Accurate records support timely action and prevent rumours from replacing verified public information.",
  "Rural development programmes connect local plans with public funds, technical approval, and community supervision. A village proposal normally identifies the work, estimated cost, expected benefit, and completion period. Officials record attendance at meetings and maintain measurements, photographs, and payment details during implementation. Residents should be able to understand how a project was selected and how money was used. Clear documentation makes social audit possible, reduces avoidable disputes, and helps the next officer continue the work without losing important local knowledge.",
  "Disaster management depends on prepared teams and accurate communication before, during, and after an emergency. District control rooms maintain contact lists, shelter details, equipment inventories, and evacuation plans. During an incident, every message should identify the place, time, source, urgency, and action required. Staff must avoid assumptions and confirm critical information through the authorised channel. After normal services are restored, the department reviews the response, records lessons, and updates the plan. Reliable typing supports this chain by turning rapid field reports into usable decisions.",
  "Education departments maintain admission records, scholarship applications, examination schedules, attendance data, and teacher postings. Each record affects a student or employee, so entries must be checked against the authorised document. When results are prepared, totals and identifiers are reviewed before publication. Schools also submit information about facilities, textbooks, and enrolment for planning purposes. A trained operator uses consistent headings and formats, protects personal data, and reports doubtful entries instead of silently changing them. These habits improve both administrative efficiency and public confidence.",
  "Environmental programmes use field observations, laboratory findings, maps, and community reports to guide action. A monitoring register may record air quality, water samples, rainfall, plantation work, or waste collection. The operator must retain the unit of measurement and avoid mixing data from different locations. Periodic summaries help officers identify trends and decide where inspection is required. When information is published, the source and reporting period should be clear. Accurate documentation allows policy decisions to be reviewed against evidence instead of memory or assumption.",
  "Digital public services allow citizens to submit forms, receive certificates, track requests, and make payments without repeated office visits. Security remains part of every transaction. Employees should use authorised accounts, protect passwords, verify attachments, and avoid copying sensitive data into unapproved applications. Backup and access records help restore service and investigate unusual activity. If the system reports an error, the operator records the message and transaction reference before retrying. Careful digital practice combines convenience with accountability and protects both the citizen and the department.",
  "Election duty requires neutral conduct, accurate lists, secure material, and strict observance of instructions. Officials check polling locations, staff assignments, transport plans, communication equipment, and contingency arrangements before the scheduled day. Records of issue and receipt must match the authorised inventory. During counting or reporting, every figure is verified by the designated officer before transmission. Employees should not rely on informal messages when an official channel is available. Discipline in documentation supports transparency and helps every stage of the process withstand later examination.",
] as const;

const HINDI_OFFICIAL_STYLE_BLOCKS = [
  "सरकारी कार्यालय में प्रत्येक आवेदन, रसीद, पंजीकरण और स्वीकृति को स्पष्ट क्रम में सुरक्षित रखा जाता है। प्राप्ति कर्मचारी तारीख और संदर्भ संख्या अंकित करके फाइल संबंधित अनुभाग को भेजता है। जांच अधिकारी नाम, पता, प्रमाण पत्र और सहायक अभिलेख का सत्यापन करता है। सूचना अधूरी होने पर आवेदक को आवश्यक विवरण के बारे में स्पष्ट सूचना दी जाती है। यह प्रक्रिया नागरिक को अनावश्यक देरी से बचाती है और प्रत्येक प्रशासनिक निर्णय का विश्वसनीय अभिलेख तैयार करती है।",
  "भर्ती प्रक्रिया अधिकृत अधिसूचना से शुरू होती है जिसमें पद, योग्यता, आयु सीमा, आरक्षण, परीक्षा चरण और अंतिम तारीख का विवरण होता है। अभ्यर्थी को आवेदन जमा करने से पहले प्रत्येक प्रविष्टि का प्रमाण पत्र से मिलान करना चाहिए। आयोग अलग चरणों में पहचान, श्रेणी, शिक्षा और अनुभव की जांच कर सकता है। प्रवेश पत्र मिलने का अर्थ यह नहीं है कि पात्रता की सभी शर्तें अपने आप पूरी हो गई हैं। इसलिए निर्देश का सावधानी से अध्ययन करना आवश्यक है।",
  "रेलवे कार्यालय यात्री सेवा, माल परिवहन, स्टेशन अभिलेख, सुरक्षा रिपोर्ट और कर्मचारी समय सारणी का समन्वय करते हैं। आंकड़ा दर्ज करने वाले कर्मचारी को गाड़ी संख्या, तारीख, स्थान और समय सही क्रम में लिखना चाहिए। मार्ग बाधित होने या सेवा में देरी होने पर नियंत्रण कार्यालय को सटीक संदेश की आवश्यकता होती है। अंतिम रिपोर्ट में घटना, की गई कार्यवाही, जिम्मेदार इकाई और सेवा बहाल होने का समय दर्ज किया जाता है। सही टाइपिंग से सूचना तेजी से पहुंचती है।",
  "न्यायालय प्रशासन में याचिका, सूचना, आदेश, प्रमाण सूची और सुनवाई कार्यक्रम का सटीक प्रबंधन आवश्यक है। दाखिला अनुभाग प्रकरण संख्या देता है और आवश्यक प्रतिलिपि तथा शुल्क की जांच करता है। नाम और कानूनी संदर्भ बिना अनुमान के लिखे जाने चाहिए क्योंकि छोटी गलती भी अभिलेख का अर्थ बदल सकती है। गोपनीय दस्तावेज केवल अधिकृत व्यक्ति को दिया जाता है। न्यायालय के सामने फाइल रखने से पहले पृष्ठ संख्या, संलग्नक, तारीख और हस्ताक्षर की अंतिम समीक्षा की जाती है।",
  "वित्तीय प्रशासन सही बिल, स्वीकृति आदेश, भुगतान विवरण, बजट और लेखा शीर्ष पर निर्भर करता है। संबंधित सहायक यह जांचता है कि व्यय को उचित अनुमति मिली है और पर्याप्त राशि उपलब्ध है। बिल को सामग्री प्राप्ति अभिलेख से मिलाकर लेखा अनुभाग को भेजा जाता है। प्रत्येक दावे में तैयारी, जांच, स्वीकृति और भुगतान की कार्यवाही स्पष्ट होनी चाहिए। केवल गति पर्याप्त नहीं है क्योंकि एक गलत अंक राशि बदल सकता है और सरकारी खाते के मिलान में देरी कर सकता है।",
  "जन स्वास्थ्य दल अस्पताल, प्रयोगशाला, क्षेत्र कर्मचारी और स्थानीय प्रशासन से सूचना एकत्र करते हैं। दैनिक रिपोर्ट में रोगी संख्या, दवा भंडार, जांच परिणाम और आवश्यक सहायता का विवरण हो सकता है। संचालक को प्रत्येक आंकड़ा सही जिला और तारीख के अंतर्गत दर्ज करना चाहिए तथा गोपनीय सूचना की सुरक्षा करनी चाहिए। अधिकारी इसी रिपोर्ट से दवा, उपकरण और कर्मचारी का वितरण तय करते हैं। असामान्य वृद्धि दिखाई देने पर निष्कर्ष जारी करने से पहले मूल स्रोत का सत्यापन किया जाता है।",
  "ग्रामीण विकास योजना स्थानीय आवश्यकता को सार्वजनिक धन, तकनीकी स्वीकृति और सामुदायिक निगरानी से जोड़ती है। ग्राम प्रस्ताव में कार्य, अनुमानित लागत, अपेक्षित लाभ और पूरा होने की अवधि का उल्लेख किया जाता है। कार्य के दौरान बैठक उपस्थिति, माप, चित्र और भुगतान का अभिलेख रखा जाता है। नागरिक को समझ आना चाहिए कि योजना का चयन कैसे हुआ और राशि का उपयोग किस प्रकार किया गया। स्पष्ट दस्तावेज सामाजिक अंकेक्षण को संभव बनाते हैं और अनावश्यक विवाद कम करते हैं।",
  "आपदा प्रबंधन में संकट से पहले तैयारी और संकट के समय सही संचार सबसे महत्वपूर्ण होता है। जिला नियंत्रण कक्ष संपर्क सूची, सुरक्षित आश्रय, उपकरण भंडार और निकासी योजना तैयार रखता है। प्रत्येक संदेश में स्थान, समय, स्रोत, प्राथमिकता और अपेक्षित कार्यवाही स्पष्ट होनी चाहिए। कर्मचारी को अनुमान से बचना चाहिए और महत्वपूर्ण सूचना अधिकृत माध्यम से सत्यापित करनी चाहिए। सामान्य सेवा बहाल होने के बाद विभाग अनुभव की समीक्षा करके योजना में आवश्यक सुधार दर्ज करता है।",
  "शिक्षा विभाग प्रवेश अभिलेख, छात्रवृत्ति आवेदन, परीक्षा कार्यक्रम, उपस्थिति और शिक्षक पदस्थापन का प्रबंधन करता है। प्रत्येक प्रविष्टि विद्यार्थी या कर्मचारी को प्रभावित करती है इसलिए उसका मिलान अधिकृत दस्तावेज से किया जाता है। परिणाम तैयार करते समय अंक, कुल और पहचान संख्या प्रकाशन से पहले जांची जाती है। विद्यालय योजना के लिए भवन, पुस्तक और नामांकन की सूचना भी भेजते हैं। प्रशिक्षित संचालक एक समान प्रारूप रखता है और संदिग्ध प्रविष्टि को बिना जांच बदले नहीं छोड़ता।",
  "पर्यावरण कार्यक्रम क्षेत्र निरीक्षण, प्रयोगशाला परिणाम, मानचित्र और नागरिक रिपोर्ट के आधार पर कार्य करते हैं। निगरानी अभिलेख में वायु गुणवत्ता, जल नमूना, वर्षा, वृक्षारोपण या कचरा संग्रह का विवरण हो सकता है। संचालक को माप की इकाई बनाए रखनी चाहिए और अलग स्थान के आंकड़े नहीं मिलाने चाहिए। नियमित सारांश से अधिकारी प्रवृत्ति पहचानते हैं और जांच का स्थान तय करते हैं। प्रकाशित सूचना में स्रोत और रिपोर्ट अवधि स्पष्ट होने से निर्णय प्रमाण के आधार पर लिया जा सकता है।",
  "डिजिटल सार्वजनिक सेवा से नागरिक आवेदन भेज सकता है, प्रमाण पत्र प्राप्त कर सकता है, अनुरोध की स्थिति देख सकता है और भुगतान कर सकता है। प्रत्येक लेनदेन में सुरक्षा आवश्यक है। कर्मचारी अधिकृत खाते का उपयोग करता है, पासवर्ड सुरक्षित रखता है और संलग्न दस्तावेज की जांच करता है। बैकअप और प्रवेश अभिलेख से सेवा बहाल करने तथा असामान्य गतिविधि की जांच में सहायता मिलती है। त्रुटि आने पर दोबारा प्रयास से पहले संदेश और संदर्भ संख्या दर्ज करना उचित है।",
  "निर्वाचन कार्य में निष्पक्ष व्यवहार, सही सूची, सुरक्षित सामग्री और निर्देश का कठोर पालन आवश्यक है। अधिकारी मतदान केंद्र, कर्मचारी नियुक्ति, परिवहन, संचार उपकरण और आकस्मिक व्यवस्था की जांच करते हैं। सामग्री जारी करने और वापस लेने का अभिलेख अधिकृत सूची से मिलना चाहिए। मतगणना या रिपोर्ट भेजते समय प्रत्येक आंकड़ा निर्धारित अधिकारी से सत्यापित कराया जाता है। अनौपचारिक संदेश के स्थान पर अधिकृत माध्यम का उपयोग पारदर्शिता बनाए रखता है और पूरी प्रक्रिया की विश्वसनीयता बढ़ाता है।",
] as const;

function wordCount(value: string) {
  return value.trim().split(/\s+/u).length;
}

const PATTERN_BLOCK_ORDER: Readonly<Record<ExamPassagePattern, readonly number[]>> = {
  general: [0, 1, 4, 8, 10, 11, 5, 7, 6, 9, 2, 3],
  ssc: [1, 0, 4, 8, 10, 11, 5, 7],
  rrb: [2, 7, 10, 4, 0, 11, 5, 9],
  dda: [0, 4, 6, 9, 10, 7, 11, 1],
  dsssb: [8, 0, 1, 10, 5, 11, 6, 9],
  cpct: [10, 0, 4, 5, 8, 7, 9, 1],
  "rajasthan-court": [3, 0, 4, 11, 10, 7, 1, 6],
  "allahabad-court": [3, 0, 1, 4, 10, 11, 8, 7],
};

export function buildOfficialStylePassage(language: TypingLanguageCode, paperIndex: number, minimumWords: number, pattern: ExamPassagePattern = "general") {
  const blocks = language === "en" ? ENGLISH_OFFICIAL_STYLE_BLOCKS : HINDI_OFFICIAL_STYLE_BLOCKS;
  const order = PATTERN_BLOCK_ORDER[pattern];
  const steps = [1, 3, 5, 7] as const;
  const step = steps[Math.abs(paperIndex) % steps.length];
  const start = Math.abs(paperIndex * 3) % order.length;
  const selected: string[] = [];
  let totalWords = 0;
  let cursor = 0;

  while (totalWords < minimumWords && cursor < order.length * 3) {
    const block = blocks[order[(start + cursor * step) % order.length]];
    selected.push(block);
    totalWords += wordCount(block);
    cursor += 1;
  }

  return selected.join("\n\n");
}
