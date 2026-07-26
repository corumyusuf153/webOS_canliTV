# Canlı TV — LG webOS Uygulaması

Türkiye'nin bilinen kanallarını (TRT 1, Show TV, ATV, Kanal D, Star TV, TV8, Now TV, NTV,
Habertürk, CNN Türk) uzaktan kumandayla gezip izleyebileceğin, LG TV'ye kurulan basit bir
webOS uygulaması.

## Nasıl çalışıyor?

Uygulama, kanalın resmi web sitesini açmıyor — her kanalın doğrudan yayın akışını
(`.m3u8`) native bir `<video>` oynatıcıda tam ekran oynatıyor. Yani reklamsız, site
arayüzü olmadan, sade bir "canlı yayın izleme" ekranı.

**Bilinmesi gereken (önemli):** Bu yayın linkleri, kanalların kendi player'larının
tarayıcıdan doğal olarak çektiği, süreli/imzalı token'lar içerir. Zamanla (birkaç gün
ile birkaç hafta arası, kanaldan kanala değişebilir) geçersiz olabilirler.

Bunun için otomatik bir çözüm var: [GitHub Actions üzerinde](.github/workflows/refresh-tokens.yml)
her 4 saatte bir çalışan bir görev, tüm kanalların sitelerini ziyaret edip taze linkleri
`overrides.json`'a yazıyor. TV'deki ana ekranda sağ üstteki **"⟳ Yenile"** butonuna (veya
uzaktan kumandanın **yeşil tuşuna**) basınca, uygulama bu dosyayı GitHub'dan çekip kanal
linklerini günceller — hiçbir yeniden kurulum gerekmez. Bir kanal yine de "Yayın açılamadı"
derse, önce Yenile'yi dene; o da çözmezse bana söyle, script'i/seçici mantığı incelerim.

## Kanal listesini düzenlemek

`js/channels.js` dosyasındaki diziyi düzenle — her satırda `id`, `name`, `url` (doğrudan
`.m3u8` yayın linki), `pageUrl` (yedek/referans olarak kanalın resmi sayfası) ve `color`
(logo yerine gösterilecek karo rengi) var. Bir kanalın linki geçersiz olursa sadece o
satırdaki `url`'i güncellemen yeterli.

## Uzaktan kumanda tuşları

- **Yön tuşları**: kanal ızgarasında gezinme
- **OK / Enter**: seçili kanalı aç
- **Geri**: kanaldan çıkıp ızgaraya dön

## TV'ye kurulum

Bu proje `@webos-tools/cli` (LG'nin güncel bakımı yapılan webOS CLI paketi) ile test edildi
ve çalıştı. **`@webosose/ares-cli` paketini kullanma** — 2023'ten beri güncellenmiyor ve
gerçek bir TV ile anahtar alışverişi için gereken `ares-novacom --getkey` komutunu içermiyor.

**Not:** TV artık [webOS Homebrew Channel](https://www.webosbrew.org/) ile root'landı (bkz.
aşağıdaki "Kalıcı erişim" bölümü), bu yüzden Developer Mode'un ~50-1000 saatlik oturum süresine
bağlı değiliz — uygulama TV'de kalıcı olarak duruyor. Aşağıdaki 1-6 arası adımlar, sıfırdan bir
TV'ye kurulum yapman gerekirse (ör. TV değişirse) referans olsun diye duruyor.

### 1) Gerekli araçları kur (proje klasöründe, bir kere)

Global kurulum (`npm install -g`) genelde izin hatası verir (sudo ister); bunun yerine proje
içine yerel kur, `npx` ile çalıştır:

```bash
cd webOS_canliTV
npm install @webos-tools/cli --save-dev
```

Artık her komutu `npx ares-...` şeklinde çalıştıracaksın (aşağıdaki örnekler de öyle).

### 2) TV'de Geliştirici Modunu aç

1. LG TV'de **LG Content Store**'dan **"Developer Mode"** uygulamasını indir.
2. Uygulamayı aç, LG hesabınla giriş yap.
3. **Dev Mode Status**'u **On** yap, TV yeniden başlayacak.
4. Uygulamayı tekrar aç — ekranda TV'nin **IP adresi** ve bir **Passphrase (Anahtar)** görünecek.
   - Not: Geliştirici modu oturumu yaklaşık 50 saat sonra kapanır; uygulamayı tekrar açıp süreyi uzatman gerekir.

### 3) Bilgisayarını TV'ye tanıt

```bash
npx ares-setup-device -a mytv -i "host=TV_IP" -i "port=9922" -i "username=prisoner"
```

`TV_IP` yerine TV'de gördüğün IP adresini yaz.

### 4) SSH anahtarını al (her kurulumda gerekebilir — dikkat edilecek nokta)

Developer Mode uygulamasında **Dev Mode Status**'un yanında ayrı bir **"Key Server"** anahtarı/
düğmesi daha var — **onu da açman lazım**, sadece Dev Mode Status yetmiyor. Bu key server kısa
süre sonra kendiliğinden kapanıyor gibi görünüyor, o yüzden açar açmaz hemen şu komutu çalıştır:

```bash
npx ares-novacom --device mytv --getkey
```

TV ekranındaki **Passphrase**'i soracak (6 karakter — harf/rakamları dikkatli oku, örn. `5` ile
`S` karışabiliyor). Doğru girersen `~/.ssh/mytv_webos` adında bir anahtar dosyası oluşur ve
cihaz kaydına otomatik eklenir. "Failed to get ssh private key" hatası alırsan büyük ihtimalle
key server kapanmıştır — TV'de tekrar aç, hemen yeniden dene.

### 5) Uygulamayı paketle

`node_modules` klasörü (CLI'nin kendisi) proje içinde olduğu için doğrudan `ares-package .`
çalıştırmak hataya düşüyor (bazı dosya adları paketleyiciyle uyuşmuyor). Bunun yerine sadece
uygulamanın gerçek dosyalarını temiz bir klasöre kopyalayıp oradan paketle:

```bash
rm -rf /tmp/canlitv_build && mkdir -p /tmp/canlitv_build
cp -R appinfo.json index.html icons css js /tmp/canlitv_build/
rm -rf dist && mkdir -p dist
npx ares-package /tmp/canlitv_build --outdir dist
```

`dist/com.yusuftalha.canlitv_1.0.0_all.ipk` dosyası oluşur.

### 6) TV'ye yükle ve başlat

```bash
npx ares-install --device mytv dist/com.yusuftalha.canlitv_1.0.0_all.ipk
npx ares-launch --device mytv com.yusuftalha.canlitv
```

Uygulama TV'nin ana ekranında **"Canlı TV"** adıyla görünecek, bir daha bu komutları
çalıştırmana gerek kalmadan doğrudan TV'den açabilirsin.

### Güncelleme yapınca

Kod üzerinde değişiklik yaptıktan sonra tekrar kurmak için 5. ve 6. adımları tekrarlaman
yeterli (anahtar hâlâ geçerliyse 3-4. adımları tekrar yapmana gerek yok).

## Kalıcı erişim (Developer Mode süresine bağlı değil)

TV, [webOS Homebrew Channel](https://www.webosbrew.org/) ile root'landı ("dangbro" yöntemi —
TV'nin firmware'i o sırada bu yönteme karşı henüz yamalanmamıştı). Bunun sonucunda:

- Developer Mode uygulaması TV'den kaldırıldı, eski `mytv` cihaz kaydı (port 9922, `prisoner`
  kullanıcısı) artık çalışmıyor.
- Bunun yerine **port 22'de, `root` kullanıcısıyla, kalıcı bir SSH erişimi** var — bir oturum
  süresine bağlı değil, TV yeniden başlasa da kalıyor.
- Bilgisayarda `~/.ssh/mytv_root` adında bir SSH anahtarı oluşturuldu ve TV'nin
  `/home/root/.ssh/authorized_keys` dosyasına eklendi (parolasız giriş için).
- `npx ares-setup-device -l` ile görebileceğin `mytv-root` cihaz kaydı bu erişimi kullanıyor:

```bash
npx ares-setup-device -a mytv-root -i "host=TV_IP" -i "port=22" -i "username=root" -i "privatekey=mytv_root"
```

Uygulamayı güncellemek için artık 5. ve 6. adımlardaki `--device mytv` yerine
**`--device mytv-root`** kullan:

```bash
npx ares-install --device mytv-root dist/com.yusuftalha.canlitv_1.0.0_all.ipk
npx ares-launch --device mytv-root com.yusuftalha.canlitv
```

TV'nin Homebrew Channel uygulaması üzerinden ayarlarına girip SSH/Telnet sunucusunu
kapatıp açabilirsin; kapatırsan `mytv-root` üzerinden erişim de kesilir (SSH sunucusu kapalıyken
uygulamayı güncelleyemezsin, ama TV'de kurulu kalan uygulama etkilenmez/silinmez).

## Otomatik link yenileme (GitHub Actions)

Proje [github.com/corumyusuf153/webOS_canliTV](https://github.com/corumyusuf153/webOS_canliTV)
adresinde barınıyor. `.github/workflows/refresh-tokens.yml`, her 4 saatte bir (ayrıca elle de
tetiklenebilir: `gh workflow run refresh-tokens.yml`) `scripts/refresh-tokens.js`'i çalıştırıp
her kanalın güncel `.m3u8` linkini `overrides.json`'a yazıyor ve repoya push'luyor.

TV'deki uygulama, `js/app.js` içindeki `OVERRIDES_URL` (GitHub raw linki) üzerinden bu dosyayı
çekiyor — "Yenile" butonuna/yeşil tuşa her basıldığında en güncel halini alıyor. Yani:

- Bir kanal linki geçersiz olursa **en geç 4 saat içinde** otomatik düzeliyor (kullanıcı hiçbir
  şey yapmasa bile bir sonraki "Yenile" basışında güncel linki alır).
- `scripts/refresh-tokens.js` bir kanalı bulamazsa o kanalın eski (varsa) override'ı korunur,
  hiçbir zaman `null`/boş ile ezilmez.
- İstersen `overrides.json`'ı GitHub'da doğrudan da görebilirsin: taze halinin ham linki
  `https://raw.githubusercontent.com/corumyusuf153/webOS_canliTV/main/overrides.json`.

### Bilinen istisnalar

- **CNN Türk otomasyona dahil değil.** `duhnet.tv`'nin verdiği token, isteği yapan IP'ye
  kilitleniyor — GitHub Actions'ın sunucusundan alınan bir link, TV'nin (farklı IP'deki)
  isteğinde 403 ile reddediliyor. Bu yüzden CNN yalnızca **TV ile aynı ağdan** (yani bana
  "CNN gitti" dediğinde, benim bilgisayarından çalıştırdığım bir oturumdan) yenilenebiliyor.
- **Habertürk bazen "donuk" kalabilir** (aynı sahneyi tekrar tekrar oynatır) — bu bizim
  token'ımızla ilgili değil, denediğimiz her güncel token'da da aynı donuk kareye rastladık;
  büyük ihtimalle Habertürk'ün kendi canlı yayın altyapısındaki geçici bir sorun. Bu durumda
  Yenile'ye basmak yardımcı olmaz, biraz bekleyip tekrar denemek gerekir.

## Bilgisayarda hızlı test (TV'ye yüklemeden önce)

```bash
cd webOS_canliTV
python3 -m http.server 8934
```

Tarayıcıda `http://localhost:8934` adresini aç, klavyeyle yön tuşları + Enter + Escape
(geri) ile deneyebilirsin.
