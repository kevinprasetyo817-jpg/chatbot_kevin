const { clearHistory } = require("../ai/ollama");
const path = require("path");
const fs = require("fs");

const GAMBAR_DIR = path.join(__dirname, "../../gambar");
const WEBSITE_BUSINESS = "https://ultima28.com/ika11405";

const conversationState = new Map();

const HEALTH_IMAGE_FILES = [
  "Kandungan Hikari.png",
  "Kandungan Subarashi.png",
  "Kandungan Utkushi.png",
  "Paten Fungsi Subarashi.png",
  "Paten Fungsi Utsukushi.png",
  "Paten Hikari.png",
];

const BUSINESS_IMAGE_FILES = [
  "Paket Join Member AFC.png",
  "Bonus Sponsor dan Bonus Pass Up.png",
  "Bonus Pairing atau Pasangan.png",
  "Bonus Bulanan dan Tahunan.png",
];

const GREETING_KEYWORDS = [
  "halo",
  "hai",
  "hello",
  "helo",
  "hi",
  "permisi",
  "pagi",
  "siang",
  "sore",
  "malam",
  "assalamualaikum",
  "menu",
  "start",
  "mulai",
];

const BUSINESS_KEYWORDS = [
  "peluang bisnis",
  "peluang usaha",
  "bisnis",
  "usaha",
  "gabung bisnis",
  "join bisnis",
  "join member",
  "member afc",
  "agen",
  "reseller",
  "kemitraan",
  "pass up",
  "bonus pairing",
  "bonus sponsor",
];

const BOTH_KEYWORDS = [
  "keduanya",
  "dua duanya",
  "dua-duanya",
  "dua2nya",
  "semuanya",
  "dua dua",
];

const SPECIFIC_HEALTH_KEYWORDS = [
  "diabetes",
  "gula darah",
  "kolesterol",
  "asam urat",
  "hipertensi",
  "darah tinggi",
  "jantung",
  "stroke",
  "ginjal",
  "maag",
  "asam lambung",
  "lambung",
  "lever",
  "hati",
  "kanker",
  "tumor",
  "kista",
  "miom",
  "paru",
  "autoimun",
  "vertigo",
  "insomnia",
  "saraf",
  "diabet",
  "batuk",
  "pilek",
  "flu",
  "demam",
  "radang tenggorokan",
  "tenggorokan",
  "sesak napas",
  "sesak",
  "asma",
  "alergi",
  "migren",
  "pusing",
  "sakit kepala",
  "nyeri sendi",
  "nyeri lutut",
  "pegal",
  "lemas",
  "diare",
  "sembelit",
  "bab",
  "wasir",
  "batu empedu",
  "prostat",
];

const GENERAL_HEALTH_KEYWORDS = [
  "keluhan kesehatan",
  "kesehatan",
  "untuk kesehatan",
  "pemulihan",
  "perbaikan organ",
  "fungsi organ",
  "metabolisme",
  "stem cell",
  "nutrisi",
  "badan sering capek",
  "sering lemas",
  "daya tahan tubuh",
  "imun",
  "sering sakit",
];

const HESITATION_KEYWORDS = [
  "masih ragu",
  "ragu ragu",
  "ragu-ragu",
  "belum yakin",
  "masih mikir",
  "masih pikir",
  "belum bisa beli",
  "belum mau beli",
  "nanti dulu",
  "takut ga cocok",
  "takut gak cocok",
  "takut nggak cocok",
  "belum percaya",
  "mahal",
  "masih pertimbangkan",
];

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function clearConversationState(phone) {
  conversationState.delete(phone);
}

function getImagesByFileNames(fileNames, firstCaption = "") {
  return fileNames
    .map((fileName, index) => {
      const fullPath = path.join(GAMBAR_DIR, fileName);
      if (!fs.existsSync(fullPath)) {
        return null;
      }

      return {
        path: fullPath,
        caption: index === 0 ? firstCaption : "",
      };
    })
    .filter(Boolean);
}

function imageResponseFromFiles(fileNames, text, fallbackReply, firstCaption = "") {
  const images = getImagesByFileNames(fileNames, firstCaption);

  if (images.length > 0) {
    return {
      handled: true,
      type: "image",
      text,
      images,
    };
  }

  return {
    handled: true,
    reply: fallbackReply,
  };
}

function isGreetingOnly(text) {
  return text === "hi" || text === "halo" || text === "hai" || text === "menu";
}

function buildGreetingReply() {
  return (
    "Halo kak, saya Kevin, asisten virtual yang bantu jawab info produk dan peluang bisnis.\n\n" +
    "Sebelum lanjut, boleh perkenalkan diri dulu ya kak, misalnya nama dan domisili.\n\n" +
    "Setelah itu, kakak sedang cari info untuk:\n" +
    "1. Keluhan kesehatan\n" +
    "2. Peluang bisnis\n" +
    "3. Keduanya"
  );
}

function buildNeedSelectionReply() {
  return (
    "Terima kasih kak sudah memperkenalkan diri.\n\n" +
    "Supaya saya arahkan dengan pas, kakak ingin fokus ke:\n" +
    "1. Keluhan kesehatan\n" +
    "2. Peluang bisnis\n" +
    "3. Keduanya"
  );
}

function buildGeneralHealthReply() {
  return (
    "Untuk kebutuhan keluhan kesehatan, pendekatannya bukan sekadar menutup gejala ya kak.\n\n" +
    "Memasuki usia 18+ ke atas, metabolisme tubuh cenderung mulai menurun, perbaikan fungsi organ perlu lebih dijaga, aktivitas stem cell tidak seaktif saat usia lebih muda, sehingga tubuh perlu asupan nutrisi yang cukup dan konsisten.\n\n" +
    "Kalau kakak berkenan, boleh info keluhan yang paling dirasakan apa supaya saya bantu arahkan penjelasan produknya."
  );
}

function buildSpecificHealthReply() {
  return (
    "Kalau keluhannya sudah spesifik, saya bantu tampilkan dulu kandungan dan paten fungsi produknya ya kak supaya kakak bisa pelajari dengan lebih jelas.\n\n" +
    "Silakan lihat gambar berikut. Kalau mau, setelah itu saya bantu jelaskan satu per satu produk yang paling relevan untuk dipelajari.\n\n" +
    "Catatan: produk ini diposisikan sebagai nutrisi pendukung, bukan pengganti obat atau saran dokter."
  );
}

function buildBusinessReply() {
  return (
    "Siap kak, untuk peluang bisnis saya arahkan ke web resmi ini ya:\n" +
    `${WEBSITE_BUSINESS}\n\n` +
    "Saya juga kirimkan gambaran paket join member dan bonusnya supaya kakak lebih mudah mempelajarinya. Kalau setelah itu kakak mau dibantu pilih langkah mulai yang paling pas, saya siap bantu."
  );
}

function buildBothReply() {
  return (
    "Siap kak, berarti kakak tertarik ke kesehatan dan peluang bisnis sekaligus.\n\n" +
    "Dari sisi kesehatan, fokusnya adalah membantu tubuh mendapat nutrisi yang cukup karena memasuki usia 18+ metabolisme dan proses regenerasi tubuh cenderung menurun.\n\n" +
    "Dari sisi bisnis, kakak bisa pelajari jalur join dan bonusnya di web ini:\n" +
    `${WEBSITE_BUSINESS}\n\n` +
    "Kalau mau, kita bisa mulai dari keluhan kesehatan dulu lalu lanjut ke peluang bisnisnya."
  );
}

function buildHesitationReply() {
  return (
    "Wajar kok kak kalau masih ragu sebelum memutuskan.\n\n" +
    "Biasanya customer jadi lebih yakin setelah memahami kandungan, fungsi paten, cara pakai, dan alasan kenapa produk ini dipakai sebagai nutrisi pendukung tubuh. Jadi bukan sekadar beli karena janji, tapi karena paham manfaat yang sedang dicari.\n\n" +
    "Kalau kakak mau, saya bisa bantu jelaskan pelan-pelan sesuai kebutuhan kakak dulu. Kalau memang cocok, baru dipertimbangkan untuk lanjut."
  );
}

function buildAdminReply() {
  return "Baik kak, kalau diperlukan saya bantu arahkan ke admin untuk penjelasan lanjutan ya.";
}

function handleCommand(phone, text) {
  const lower = text.trim().toLowerCase();
  const state = conversationState.get(phone);

  if (lower === "ping") {
    return { handled: true, reply: "pong" };
  }

  if (lower === "reset" || lower === "/reset") {
    clearHistory(phone);
    clearConversationState(phone);
    return {
      handled: true,
      reply: "Siap kak, percakapannya saya reset dulu ya. Kita mulai lagi dari awal.",
    };
  }

  if (lower === "admin") {
    return {
      handled: true,
      reply: buildAdminReply(),
    };
  }

  if (includesAny(lower, BUSINESS_KEYWORDS)) {
    clearConversationState(phone);
    return imageResponseFromFiles(
      BUSINESS_IMAGE_FILES,
      buildBusinessReply(),
      `Siap kak, untuk peluang bisnis bisa langsung cek web ini ya:\n${WEBSITE_BUSINESS}`,
    );
  }

  if (includesAny(lower, BOTH_KEYWORDS)) {
    conversationState.set(phone, { stage: "awaiting_health_detail" });
    return {
      handled: true,
      reply: buildBothReply(),
    };
  }

  if (includesAny(lower, SPECIFIC_HEALTH_KEYWORDS)) {
    clearConversationState(phone);
    return imageResponseFromFiles(
      HEALTH_IMAGE_FILES,
      buildSpecificHealthReply(),
      "Siap kak, untuk keluhan spesifik saya sarankan pelajari dulu kandungan dan paten fungsi produknya ya. Kalau perlu, nanti saya bantu jelaskan dari data yang tersedia.",
    );
  }

  if (includesAny(lower, GENERAL_HEALTH_KEYWORDS)) {
    conversationState.set(phone, { stage: "awaiting_health_detail" });
    return {
      handled: true,
      reply: buildGeneralHealthReply(),
    };
  }

  if (includesAny(lower, HESITATION_KEYWORDS)) {
    return {
      handled: true,
      reply: buildHesitationReply(),
    };
  }

  if (isGreetingOnly(lower) || includesAny(lower, GREETING_KEYWORDS)) {
    conversationState.set(phone, { stage: "awaiting_intro_or_need" });
    return {
      handled: true,
      reply: buildGreetingReply(),
    };
  }

  if (state?.stage === "awaiting_intro_or_need") {
    conversationState.set(phone, { stage: "awaiting_need_selection" });
    return {
      handled: true,
      reply: buildNeedSelectionReply(),
    };
  }

  if (state?.stage === "awaiting_need_selection") {
    return {
      handled: true,
      reply:
        "Saya siap bantu kak. Tinggal pilih saja ya: keluhan kesehatan, peluang bisnis, atau keduanya.",
    };
  }

  if (state?.stage === "awaiting_health_detail") {
    return {
      handled: true,
      reply:
        "Siap kak, saya catat dulu keluhannya. Kalau kondisinya sudah spesifik, saya bisa bantu tampilkan kandungan dan paten fungsi produk supaya kakak lebih mudah mempelajarinya.",
    };
  }

  return { handled: false };
}

module.exports = {
  handleCommand,
  clearConversationState,
};
