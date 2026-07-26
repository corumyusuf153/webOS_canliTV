// GitHub Actions tarafından periyodik çalıştırılır: her kanalın resmi canlı
// yayın sayfasını ziyaret edip tarayıcının doğal olarak çektiği güncel
// .m3u8 linkini yakalar, overrides.json'a yazar. TV'deki "Yenile" butonu bu
// dosyayı (GitHub raw üzerinden) okuyup kanal linklerini tazeler.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// cnnturk (duhnet.tv) kasıtlı olarak burada YOK: onun token'ı, isteği yapan
// IP'ye kilitleniyor. GitHub Actions'ın IP'sinden alınan bir cnnturk linki
// TV'de (farklı IP) 403 veriyor — bu yüzden cnnturk sadece TV ile aynı ağdan
// (yani elle, "npx"li bir oturumdan) yenilenebilir.
const CHANNELS = [
  { id: 'trt1', pageUrl: 'https://www.trt1.com.tr/canli-yayin' },
  { id: 'showtv', pageUrl: 'https://www.showtv.com.tr/canli-yayin' },
  { id: 'atv', pageUrl: 'https://www.atv.com.tr/canli-yayin' },
  { id: 'kanald', pageUrl: 'https://www.kanald.com.tr/canli-yayin' },
  { id: 'startv', pageUrl: 'https://www.startv.com.tr/canli-yayin' },
  { id: 'tv8', pageUrl: 'https://www.tv8.com.tr/canli-yayin' },
  { id: 'nowtv', pageUrl: 'https://www.nowtv.com.tr/canli-yayin' },
  { id: 'ntv', pageUrl: 'https://www.ntv.com.tr/canli-yayin/ntv' },
  { id: 'haberturk', pageUrl: 'https://www.haberturk.com/canliyayin' }
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

  // daioncdn.net kaynaklı linkler test edildi ve isteği yapan IP'ye kilitli
  // DEĞİL (GitHub Actions'tan alınıp TV'de sorunsuz çalışıyor). Bazı kanallar
  // (örn. atv) bazen bunun yerine ercdn.net/duhnet.tv gibi IP'ye kilitli bir
  // CDN'e yönlendirilebiliyor — o durumda TV'de 403 alınıyor. Bu yüzden aynı
  // kalitede birden fazla aday varsa daioncdn.net olanı tercih ediyoruz.
  const best =
    found.find((u) => /daioncdn\.net/.test(u) && /1080p/.test(u)) ||
    found.find((u) => /daioncdn\.net/.test(u) && /720p/.test(u)) ||
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
  console.log('overrides.json güncellendi.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
