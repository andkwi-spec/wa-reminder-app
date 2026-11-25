import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.resolve("data/reminders.json");
const WA_API_URL = process.env.WA_API_URL;
const WA_API_TOKEN = process.env.WA_API_TOKEN;

async function run() {
  if (!WA_API_URL) {
    throw new Error("WA_API_URL belum diatur.");
  }

  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const reminders = JSON.parse(raw);
  const now = new Date();
  let hasChanges = false;

  for (const item of reminders) {
    const targetTime = new Date(item.sendAt);

    if (!item.sent && targetTime <= now) {
      console.log(`Mengirim reminder [${item.id}] ke ${item.target}...`);

      const response = await fetch(WA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WA_API_TOKEN ? { Authorization: `Bearer ${WA_API_TOKEN}` } : {})
        },
        body: JSON.stringify({
          target: item.target,
          message: item.message
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gagal mengirim [${item.id}]: ${response.status} - ${errText}`);
        continue;
      }

      item.sent = true;
      hasChanges = true;
      console.log(`Berhasil terkirim [${item.id}].`);
    }
  }

  if (hasChanges) {
    await fs.writeFile(DATA_PATH, JSON.stringify(reminders, null, 2) + "\n", "utf-8");
    console.log("Status reminders.json diperbarui.");
  } else {
    console.log("Tidak ada reminder yang perlu dikirim saat ini.");
  }
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
