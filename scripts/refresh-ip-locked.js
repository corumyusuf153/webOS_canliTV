// cnnturk, atv ve nowtv'nin token'ları isteği yapan IP'ye kilitli — bu yüzden
// GitHub Actions'ın bulut sunucusundan asla düzeltilemiyorlar. Bu script,
// TV ile aynı ev ağından (bu bilgisayardan) launchd ile periyodik çalışır.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CHANNELS = [
  { id: 'cnnturk', pageUrl: 'https://www.cnnturk.com/canli-yayin' },
  { id: 'atv', pageUrl: 'https://www.atv.com.tr/canli-yayin' },
  { id: 'nowtv', pageUrl: 'https://www.nowtv.com.tr/canli-yayin' }
];

const OUTPUT_PATH = path.join(__dirname, '..', 'overrides.json');

async function sniffChannel(browser, channel) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'tr-TR',
    extraHTTPHeaders: { 'Accept-Language': 'tr-TR,tr;q=0.9' }
  });
  const page = await context.newPage();
  const found = [];
  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('.m3u8') && res.status() === 200) {
      found.push(u);
    }
  });

  try {
    await page.goto(channel.pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(8000);
  } catch (err) {
    console.log(channel.id + ': goto error - ' + err.message);
  } finally {
    await context.close();
  }

  const best =
    found.find((u) => /daioncdn\.net/.test(u) && /1080p/.test(u)) ||
    found.find((u) => /1080p/.test(u)) ||
    found.find((u) => /720p/.test(u)) ||
    found[0] ||
    null;

  return best;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const result = {};
  for (const channel of CHANNELS) {
    const url = await sniffChannel(browser, channel);
    if (url) {
      result[channel.id] = url;
      console.log(channel.id + ': OK');
    } else {
      console.log(channel.id + ': BULUNAMADI (atlanıyor, eski link korunuyor)');
    }
  }

  await browser.close();

  let existing = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    } catch (err) {
      existing = {};
    }
  }

  const merged = Object.assign({}, existing, result);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + '\n');
  console.log('overrides.json güncellendi (yerel/IP-kilitli kanallar).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
