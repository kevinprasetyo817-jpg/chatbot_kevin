const { handleCommand } = require("../handlers/commandHandler");
const { handleAI } = require("../handlers/aiHandler");
const { isRateLimited, randomDelay } = require("../utils/throttle");
const { logger, maskPhone } = require("../utils/logger");
const fs = require("fs");
const path = require("path");

const phoneQueues = new Map();

function enqueueForPhone(phone, fn) {
  const prev = phoneQueues.get(phone) || Promise.resolve();
  const next = prev.then(fn).catch(() => {});
  phoneQueues.set(phone, next);
  next.finally(() => {
    if (phoneQueues.get(phone) === next) phoneQueues.delete(phone);
  });
  return next;
}

async function routeMessage(sock, msg) {
  try {
    const jid = msg.key.remoteJid;

    if (jid.endsWith("@g.us")) {
      logger.debug({ jid }, "Skipping group message");
      return;
    }

    if (jid === "status@broadcast" || jid.includes("broadcast")) return;

    const isMediaMessage =
      !!msg.message?.imageMessage ||
      !!msg.message?.videoMessage ||
      !!msg.message?.documentMessage ||
      !!msg.message?.stickerMessage;

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      "";

    if (isMediaMessage && (!text || text.trim() === "")) {
      const phone = jid.replace("@s.whatsapp.net", "");
      logger.info(
        { phone: maskPhone(phone) },
        "Media message received, replying with generic follow-up",
      );
      await randomDelay();
      await sendMessage(
        sock,
        jid,
        "Baik kak, file atau referensinya sudah saya terima ya.\nKalau mau, kakak bisa lanjut tulis kebutuhan kakak untuk keluhan kesehatan, peluang bisnis, atau keduanya.",
      );
      return;
    }

    if (!text || text.trim() === "") {
      logger.debug({ jid: maskPhone(jid) }, "Empty message, skipping");
      return;
    }

    const phone = jid.replace("@s.whatsapp.net", "");
    logger.info(
      { phone: maskPhone(phone), text: text.slice(0, 80) },
      "Incoming message",
    );

    if (isRateLimited(phone)) {
      logger.warn({ phone: maskPhone(phone) }, "Rate limited");
      await sendMessage(
        sock,
        jid,
        "Kak, kamu terlalu banyak kirim pesan. Tunggu sebentar ya.",
      );
      return;
    }

    await randomDelay();

    const commandResult = handleCommand(phone, text);
    if (commandResult.handled) {
      logger.info(
        { phone: maskPhone(phone) },
        `Command handled: "${text.slice(0, 30)}"`,
      );
      if (commandResult.type === "image") {
        if (commandResult.text) {
          await sendMessage(sock, jid, commandResult.text);
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
        const sentCount = await sendImages(sock, jid, commandResult.images);
        if (sentCount === 0) {
          await sendMessage(
            sock,
            jid,
            "Maaf kak, gambar belum berhasil terkirim. Coba ulangi sekali lagi atau ketik admin ya.",
          );
        }
      } else {
        await sendMessage(sock, jid, commandResult.reply);
      }
      return;
    }

    await enqueueForPhone(phone, async () => {
      const aiReply = await handleAI(phone, text);
      await sendMessage(sock, jid, aiReply);
    });
  } catch (err) {
    logger.error({ err: err.message }, "routeMessage error");
  }
}

async function sendMessage(sock, jid, text) {
  try {
    await sock.sendMessage(jid, { text });
  } catch (err) {
    logger.error({ jid, err: err.message }, "Failed to send message");
  }
}

async function sendImages(sock, jid, images) {
  let sentCount = 0;

  for (const img of images) {
    try {
      if (!img?.path || !fs.existsSync(img.path)) {
        logger.error({ jid, path: img?.path }, "Image file not found");
        continue;
      }

      const ext = path.extname(img.path).toLowerCase();
      const mimetype = getImageMimeType(ext);

      await sock.sendMessage(jid, {
        image: { url: img.path },
        caption: img.caption || "",
        mimetype,
        fileName: path.basename(img.path),
      });
      sentCount += 1;

      if (images.length > 1) await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err) {
      logger.error(
        { jid, path: img.path, err: err.message },
        "Failed to send image",
      );
    }
  }

  return sentCount;
}

function getImageMimeType(ext) {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".png":
    default:
      return "image/png";
  }
}

module.exports = { routeMessage };
