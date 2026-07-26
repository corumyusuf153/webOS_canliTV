// Kanal listesi — url alanı doğrudan yayın akışı (.m3u8), pageUrl ise oynatma
// başarısız olursa "kanalın kendi sitesini aç" yedek seçeneği için.
//
// Bu linkler süreli/imzalı token içerir; zamanla geçersiz olabilir. Geçersiz
// olduklarında burayı güncellemek gerekir — id ve name zorunlu, color logo
// yoksa gösterilecek karo rengi.
window.CANLI_TV_CHANNELS = [
  { id: 'trt1', name: 'TRT 1', url: 'https://trt.daioncdn.net/trt-1/master.m3u8?app=web', pageUrl: 'https://www.trt1.com.tr/canli-yayin', color: '#c0392b' },
  { id: 'showtv', name: 'Show TV', url: 'https://ciner.daioncdn.net/showtv/showtv_1080p.m3u8?ex=1664766175&st=RBzhSuGauna0OGld-DJUVA&tv=1&sid=8m3ie9n9ybx2&app=4bc856ef-4c68-4a94-bc87-37dfaaa66558&ce=3', pageUrl: 'https://www.showtv.com.tr/canli-yayin', color: '#8e44ad' },
  { id: 'atv', name: 'ATV', url: 'https://trkvz.daioncdn.net/atv/atv_1080p.m3u8?e=1785121813&st=Dzk89j2d48V-1QAQ8a0FhQ&sid=8m3jwafj7eg5&app=d1ce2d40-5256-4550-b02e-e73c185a314e&ce=3', pageUrl: 'https://www.atv.com.tr/canli-yayin', color: '#16a085' },
  { id: 'kanald', name: 'Kanal D', url: 'https://demiroren.daioncdn.net/kanald/kanald_1080p.m3u8?&sid=8m3iflctgbp9&app=da2109ea-5dfe-4107-89ab-23593336ed61&ce=3', pageUrl: 'https://www.kanald.com.tr/canli-yayin', color: '#d35400' },
  { id: 'startv', name: 'Star TV', url: 'https://dogus.daioncdn.net/startv/startv_720p.m3u8?&sid=8m3ih3e7pai8&app=a20ac41e-bdc3-4aa1-934d-26b484480ac9&ce=3', pageUrl: 'https://www.startv.com.tr/canli-yayin', color: '#f39c12' },
  { id: 'tv8', name: 'TV8', url: 'https://tv8.daioncdn.net/tv8/tv8_1080p.m3u8?&sid=8m3ii0rupm4g&app=7ddc255a-ef47-4e81-ab14-c0e5f2949788&ce=3', pageUrl: 'https://www.tv8.com.tr/canli-yayin', color: '#2980b9' },
  { id: 'nowtv', name: 'Now TV', url: 'https://nowtv-live-ad.ercdn.net/nowtv/nowtv_720p.m3u8?e=1785133226&st=ZCWdEl9enH6GECAYmJjOeA', pageUrl: 'https://www.nowtv.com.tr/canli-yayin', color: '#27ae60' },
  { id: 'ntv', name: 'NTV', url: 'https://dogus.daioncdn.net/ntv/ntv_1080p.m3u8?token=e8c0dec16bf84c8cc187224d13811c0e705fd2c58b25d7ee&sid=8m3ij9hm8ewy&app=c68bddbe-3dbf-49f7-892a-93de5ae37f1f&ce=3', pageUrl: 'https://www.ntv.com.tr/canli-yayin/ntv', color: '#c0392b' },
  { id: 'haberturk', name: 'Habertürk', url: 'https://ciner.daioncdn.net/haberturktv/haberturktv_1080p.m3u8?sid=8m3ikrlpkgsi&app=c98ab0b0-50cc-495b-bb37-778e91f5ff5b&ce=3', pageUrl: 'https://www.haberturk.com/canliyayin', color: '#2c3e50' },
  { id: 'cnnturk', name: 'CNN Türk', url: 'https://live.duhnet.tv//S2/HLS_LIVE/cnnturknp/playlist.m3u8?&live=true&app=com.cnnturk&st=b8rnduG357GwYV_QD_OFoA&e=1785100687', pageUrl: 'https://www.cnnturk.com/canli-yayin', color: '#7f1d1d' }
];
