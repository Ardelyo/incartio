import React, { useRef, useState, useEffect } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if content fits without scrolling
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setScrollProgress(0);
      
      // Delay slightly to let layout compute height
      const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          const { scrollHeight, clientHeight } = container;
          if (scrollHeight <= clientHeight && clientHeight > 0) {
            setHasScrolledToBottom(true);
            setScrollProgress(100);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    const maximumScroll = scrollHeight - clientHeight;
    const scrollPercent = maximumScroll > 0 ? (scrollTop / maximumScroll) * 100 : 100;
    
    setScrollProgress(Math.min(100, Math.round(scrollPercent)));

    // 25px threshold to guarantee it triggers on Zoom/DPI differences reliably
    if (scrollTop + clientHeight >= scrollHeight - 25) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col font-sans">
        
        {/* Title Header */}
        <div className="flex flex-col px-6 py-5 border-b border-[#3c4043] bg-[#303134]/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#e8eaed] leading-tight select-none">
                SYARAT &amp; KETENTUAN PENGGUNAAN
              </h2>
              <p className="text-xs text-[#9aa0a6] font-medium tracking-wide mt-0.5 select-none">
                Pernyataan Penyangkalan &amp; Klarifikasi Hukum Menyeluruh
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-[#3c4043] h-1.5 rounded-full mt-4 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-150 ${hasScrolledToBottom ? 'bg-[#81c995]' : 'bg-[#fbbc04]'}`}
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-[#bdc1c6] space-y-6 text-sm leading-relaxed"
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Subtitle / Header inside content */}
          <div className="text-center pb-4 border-b border-[#3c4043]/50">
            <h1 className="text-base md:text-lg font-bold text-[#e8eaed] uppercase select-none">
              Aplikasi Permainan Simulasi Edukasi Finansial Berbasis Grafik Pasar
            </h1>
          </div>

          {/* Red Warning Card */}
          <div className="bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-xl p-5 select-none hover:bg-[#ea4335]/15 transition-colors">
            <h3 className="text-sm md:text-base font-bold text-[#f28b82] mb-3 flex items-center gap-2">
              ⚠️ PENTING — HARAP DIBACA SEPENUHNYA SEBELUM MENGGUNAKAN APLIKASI INI
            </h3>
            <p className="text-[#f5c2c1] font-medium leading-relaxed">
              Dengan mengakses, mengunduh, memasang, memuat, atau menggunakan aplikasi permainan ini dalam bentuk apa pun, Anda secara hukum dianggap telah membaca, memahami, menerima, dan terikat oleh seluruh ketentuan, penyangkalan, dan klausul yang tertuang dalam dokumen ini secara penuh dan tanpa pengecualian. Apabila Anda tidak menyetujui satu atau lebih ketentuan di bawah ini, Anda wajib segera menghentikan penggunaan aplikasi ini.
            </p>
          </div>

          {/* BAB I */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB I — DEFINISI DAN RUANG LINGKUP
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-[#e8eaed]">Pasal 1 — Definisi Resmi</h4>
                <p className="mt-1 text-[#9aa0a6] italic">
                  Dalam dokumen Syarat dan Ketentuan ini, istilah-istilah berikut memiliki pengertian sebagaimana didefinisikan di bawah ini:
                </p>
              </div>
              <ul className="space-y-3 pl-4 border-l-2 border-[#3c4043]">
                <li>
                  <strong className="text-[#e8eaed]">1.1 "Aplikasi"</strong> merujuk pada permainan simulasi berkendara dua dimensi berbasis grafik pasar keuangan yang menghadirkan karakter pengemudi bernama Caru, termasuk seluruh elemen di dalamnya seperti antarmuka pengguna, mekanisme permainan, sistem data, fitur edukasi, konten visual, audio, dan teks, yang dapat diakses melalui perangkat apa pun baik berbasis web, desktop, maupun mobile.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.2 "Pengembang"</strong> merujuk pada individu, tim, atau entitas yang menciptakan, mengembangkan, memelihara, mendistribusikan, dan/atau mengoperasikan Aplikasi ini beserta seluruh pembaruan dan versinya.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.3 "Pengguna"</strong> atau <strong className="text-[#e8eaed]">"Anda"</strong> merujuk pada setiap individu, kelompok, atau entitas yang dalam kapasitas apa pun mengakses, menggunakan, memainkan, mengamati, atau berinteraksi dengan Aplikasi ini, baik secara langsung maupun tidak langsung, termasuk namun tidak terbatas pada pemain, penonton siaran langsung (<em>streamer</em>), peneliti, pendidik, atau pihak yang sekadar mendemonstrasikan Aplikasi kepada pihak lain.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.4 "Konten Finansial"</strong> merujuk pada segala bentuk data harga, grafik, diagram, teks tip edukasi, angka fluktuasi, representasi visual aset keuangan, nama pasangan mata uang, nama aset kripto, dan informasi pasar lainnya yang ditampilkan atau digunakan dalam Aplikasi ini dalam konteks apa pun.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.5 "Data Pasar"</strong> merujuk pada data harga historis maupun data harga waktu nyata (<em>live</em>) dari pasangan mata uang fiat dunia, aset kripto, atau instrumen keuangan lainnya yang diperoleh dari sumber-sumber pihak ketiga melalui antarmuka pemrograman aplikasi (<em>API</em>) publik maupun berlisensi, yang digunakan sebagai pembentuk medan jalan dalam Aplikasi.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.6 "Medan Permainan"</strong> merujuk pada representasi visual dua dimensi berupa tanjakan, turunan, bukit, lembah, dan elemen topografi lainnya yang dibentuk dari Data Pasar semata-mata untuk keperluan hiburan dan edukasi dalam Aplikasi, bukan merupakan rekonstruksi akurat atau preskriptif dari kondisi pasar yang sesungguhnya.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.7 "Konten Edukasi"</strong> merujuk pada tips, informasi, konsep, dan penjelasan mengenai literasi keuangan umum yang disajikan melalui karakter asisten dalam Aplikasi, yang bersifat informatif umum dan tidak bersifat personal, spesifik, atau dapat diandalkan sebagai nasihat keuangan profesional.
                </li>
                <li>
                  <strong className="text-[#e8eaed]">1.8 "Nasihat Keuangan Profesional"</strong> merujuk pada saran, rekomendasi, strategi, atau panduan investasi yang diberikan oleh individu atau lembaga yang memiliki lisensi, sertifikasi, dan kewenangan hukum yang sah dari otoritas regulasi keuangan yang berwenang untuk memberikan rekomendasi keuangan yang dapat dipertanggungjawabkan secara hukum dan personal kepada individu atau entitas tertentu.
                </li>
              </ul>
            </div>
          </section>

          {/* BAB II */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB II — SIFAT DAN TUJUAN APLIKASI
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-[#e8eaed]">Pasal 2 — Pernyataan Resmi Mengenai Sifat Aplikasi</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-[#3c4043]">
                <p>
                  <strong className="text-[#e8eaed]">2.1 Aplikasi Ini Adalah Permainan Hiburan Edukatif</strong>
                  <br />
                  Aplikasi ini dirancang, dikembangkan, dan dimaksudkan semata-mata sebagai media hiburan interaktif berbasis edukasi finansial umum (<em>edutainment</em>). Karakter fundamental Aplikasi ini adalah sebuah <strong>permainan video</strong> (<em>video game</em>), bukan platform analisis keuangan, bukan alat investasi, bukan sistem perdagangan, dan bukan layanan penasihat keuangan dalam bentuk apa pun. Seluruh elemen dalam Aplikasi ini — termasuk namun tidak terbatas pada karakter Caru, sistem bensin, koin, checkpoint, rintangan, dan ekspresi emosional — merupakan elemen fiksi yang diciptakan semata-mata untuk tujuan hiburan.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">2.2 Penggunaan Data Finansial Sebagai Elemen Permainan Semata</strong>
                  <br />
                  Data Pasar yang diintegrasikan ke dalam Aplikasi ini digunakan <strong>secara eksklusif</strong> sebagai bahan baku pembentukan medan topografi visual permainan. Penggunaan ini murni bersifat alegoris dan dekoratif. Angka-angka, arah pergerakan harga, dan pola yang ditampilkan dalam bentuk bukit atau lembah dalam Aplikasi tidak dimaksudkan untuk, dan tidak boleh ditafsirkan sebagai:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#9aa0a6]">
                  <li>Prediksi pergerakan harga di masa depan;</li>
                  <li>Rekomendasi untuk membeli atau menjual aset keuangan tertentu;</li>
                  <li>Konfirmasi tren pasar yang sedang atau akan berlangsung;</li>
                  <li>Representasi akurat kondisi pasar yang dapat diandalkan untuk pengambilan keputusan investasi;</li>
                  <li>Sinyal perdagangan (<em>trading signals</em>) dalam bentuk apa pun.</li>
                </ul>
                <p>
                  <strong className="text-[#e8eaed]">2.3 Hubungan Alegori Antara Permainan dan Konsep Finansial</strong>
                  <br />
                  Korespondensi antara elemen permainan dan konsep finansial — seperti bensin sebagai representasi likuiditas, checkpoint sebagai target keuangan, atau rintangan sebagai pengeluaran darurat — merupakan <strong>metafora kreatif yang disederhanakan</strong> untuk tujuan pedagogis. Metafora ini tidak mencerminkan realita pasar keuangan yang kompleks secara utuh dan tidak boleh dijadikan acuan dalam memahami pasar keuangan yang sesungguhnya.
                </p>
              </div>
            </div>
          </section>

          {/* BAB III */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB III — PENYANGKALAN HUKUM KOMPREHENSIF
            </h3>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-[#e8eaed]">Pasal 3 — Bukan Nasihat Keuangan</h4>
              <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                <p>
                  <strong className="text-[#e8eaed]">3.1 Pernyataan Tegas Bukan Nasihat Investasi</strong>
                  <br />
                  <span className="text-[#f28b82] font-semibold">APLIKASI INI, SELURUH KONTENNYA, TERMASUK NAMUN TIDAK TERBATAS PADA DATA YANG DITAMPILKAN, TIP EDUKASI, REPRESENTASI VISUAL, DIALOG KARAKTER, DAN MEKANISME PERMAINAN, TIDAK MERUPAKAN DAN TIDAK BOLEH DITAFSIRKAN SEBAGAI NASIHAT KEUANGAN, NASIHAT INVESTASI, NASIHAT PERPAJAKAN, NASIHAT HUKUM, NASIHAT PERDAGANGAN, ATAU REKOMENDASI PROFESIONAL DALAM BIDANG APA PUN.</span>
                  <br />
                  Tidak ada satu pun konten dalam Aplikasi ini yang ditulis, dirancang, atau dimaksudkan untuk menggantikan konsultasi dengan penasihat keuangan berlisensi, manajer investasi bersertifikat, perencana keuangan tersertifikasi (<em>Certified Financial Planner</em>/CFP), analis keuangan chartered (<em>Chartered Financial Analyst</em>/CFA), akuntan publik bersertifikat (<em>Certified Public Accountant</em>/CPA), konsultan pajak berlisensi, atau profesional keuangan lainnya yang memiliki kewenangan hukum yang sah.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">3.2 Tidak Ada Hubungan Penasihat-Klien</strong>
                  <br />
                  Penggunaan Aplikasi ini tidak menciptakan, dan tidak boleh dianggap menciptakan, hubungan hukum apa pun antara Pengembang dan Pengguna dalam kapasitas sebagai penasihat keuangan dan klien, atau dalam kapasitas profesional serupa lainnya. Pengembang tidak bertindak sebagai fiduciary bagi Pengguna dalam kapasitas apa pun.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">3.3 Keputusan Keuangan adalah Tanggung Jawab Pribadi Sepenuhnya</strong>
                  <br />
                  Setiap keputusan investasi, perdagangan, pengelolaan aset, alokasi dana, atau keputusan keuangan lainnya yang dibuat oleh Pengguna, baik yang dipengaruhi maupun yang tidak dipengaruhi oleh penggunaan Aplikasi ini, merupakan sepenuhnya dan eksklusif tanggung jawab pribadi Pengguna. Pengembang tidak bertanggung jawab atas konsekuensi finansial apa pun yang timbul dari keputusan tersebut.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#e8eaed]">Pasal 4 — Penyangkalan Terkait Akurasi Data</h4>
              <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                <p>
                  <strong className="text-[#e8eaed]">4.1 Tidak Ada Jaminan Akurasi</strong>
                  <br />
                  Meskipun Aplikasi ini menggunakan Data Pasar dari sumber-sumber yang diyakini dapat diandalkan, Pengembang tidak memberikan jaminan, pernyataan, atau garansi apa pun — baik tersurat maupun tersirat — mengenai keakuratan, kelengkapan, atau kebenaran data yang ditampilkan, kesesuaian data yang ditampilkan dengan kondisi pasar aktual pada waktu yang bersamaan, ketiadaan kesalahan teknis, keterlambatan data, atau distorsi dalam proses pengambilan dan pengolahan data, serta ketersediaan data secara berkelanjutan tanpa gangguan.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">4.2 Potensi Keterlambatan dan Perbedaan Data</strong>
                  <br />
                  Data yang ditampilkan dalam Aplikasi, khususnya dalam mode LIVE, mungkin mengalami keterlambatan (<em>latency</em>) yang disebabkan oleh keterbatasan teknis API pihak ketiga, kondisi jaringan, atau faktor teknis lainnya. Keterlambatan ini dapat menyebabkan perbedaan signifikan antara data yang ditampilkan dalam Aplikasi dengan harga aktual di pasar pada waktu yang bersamaan. Perbedaan ini tidak merepresentasikan kesengajaan manipulasi data oleh Pengembang.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">4.3 Data Historis Bukan Indikator Masa Depan</strong>
                  <br />
                  Data historis yang digunakan dalam mode 1D, 5D, 1M, 1Y, dan MAX semata-mata merupakan pergerakan harga yang telah terjadi di masa lampau. Representasi visual data historis dalam Aplikasi ini <strong>sama sekali tidak</strong> mengimplikasikan bahwa pola serupa akan berulang di masa depan. Pernyataan klasik dan universal dalam industri keuangan berlaku sepenuhnya: <strong>kinerja masa lalu tidak menjamin hasil di masa depan</strong> (<em>past performance is not indicative of future results</em>).
                </p>
                <p>
                  <strong className="text-[#e8eaed]">4.4 Transformasi Data untuk Keperluan Permainan</strong>
                  <br />
                  Data Pasar yang digunakan dalam Aplikasi telah melalui proses transformasi, normalisasi, penskalaan, dan modifikasi teknis lainnya untuk keperluan pembuatan medan permainan yang dapat dimainkan dan dinikmati. Proses transformasi ini dapat menyebabkan representasi visual dalam Aplikasi berbeda secara signifikan dari grafik keuangan yang ditampilkan pada platform analisis atau perdagangan profesional. Perbedaan ini merupakan konsekuensi yang disengaja dari desain permainan dan bukan merupakan kekeliruan atau penipuan.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#e8eaed]">Pasal 5 — Penyangkalan Terkait Aset Keuangan dan Institusi</h4>
              <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                <p>
                  <strong className="text-[#e8eaed]">5.1 Tidak Ada Endorse atau Penolakan Terhadap Aset Tertentu</strong>
                  <br />
                  Penyebutan nama pasangan mata uang fiat (seperti EUR/USD, USD/IDR, USD/JPY, dan lainnya), aset kripto (seperti BTC/USD, ETH/USD, dan lainnya), atau instrumen keuangan lainnya dalam Aplikasi ini <strong>tidak merupakan</strong> dukungan (<em>endorsement</em>), promosi, rekomendasi untuk membeli, anjuran untuk memiliki, atau persetujuan atas aset-aset tersebut oleh Pengembang.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">5.2 Tidak Ada Diskreditasi Terhadap Aset atau Institusi</strong>
                  <br />
                  Secara setara dan simetris, representasi visual dari kondisi pasar yang berkaitan dengan aset atau mata uang tertentu — termasuk visualisasi kondisi bearish yang menurun, volatilitas tinggi, atau peristiwa krisis historis — <strong>tidak merupakan</strong> kritik, penghinaan, diskreditasi, meremehkan, atau sikap negatif apa pun dari Pengembang terhadap aset keuangan yang disebutkan, negara penerbit mata uang terkait, bank sentral atau otoritas moneter yang berwenang, lembaga keuangan, bursa, atau entitas yang berkaitan dengan aset tersebut, serta komunitas investor atau pengguna aset tersebut. Representasi visual tersebut semata-mata adalah refleksi mekanis dari data yang tersedia dan adatpasional serta kreatif dari data tersebut menjadi elemen permainan.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">5.3 Klarifikasi Khusus Mengenai Visualisasi Peristiwa Historis</strong>
                  <br />
                  Aplikasi ini mungkin menampilkan representasi visual dari peristiwa krisis keuangan historis, seperti krisis moneter Asia 1997-1998, krisis keuangan global 2008, keruntuhan pasar kripto, dan peristiwa pasar ekstrem lainnya. Representasi visual ini disajikan semata-mata sebagai konteks edukasi historis mengenai dinamika pasar keuangan, elemen permainan yang memberikan tantangan berbeda kepada pemain, serta materi pembelajaran tentang pentingnya diversifikasi dan manajemen risiko. Representasi ini <strong>sama sekali tidak dimaksudkan</strong> sebagai komentar politik, kritik terhadap kebijakan ekonomi pemerintah mana pun, penghinaan terhadap negara atau entitas mana pun, atau narasi yang menyalahkan pihak tertentu atas peristiwa historis yang terjadi. Peristiwa historis tersebut disajikan secara faktual dan netral semata-mata sebagai data yang telah terjadi.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-[#e8eaed]">Pasal 6 — Batasan Tanggung Jawab Pengembang</h4>
              <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                <p>
                  <strong className="text-[#e8eaed]">6.1 Pengecualian Tanggung Jawab Komprehensif</strong>
                  <br />
                  Sepanjang diizinkan oleh hukum yang berlaku, Pengembang tidak bertanggung jawab atas kerugian atau kerusakan dalam bentuk apa pun yang timbul dari atau berkaitan dengan penggunaan Aplikasi ini, termasuk namun tidak terbatas pada:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#9aa0a6]">
                  <li><strong className="text-[#bdc1c6]">Kerugian Finansial Langsung</strong>: Kerugian investasi, kehilangan modal, kerugian perdagangan, atau kerugian moneter lainnya;</li>
                  <li><strong className="text-[#bdc1c6]">Kerugian Finansial Tidak Langsung</strong>: Kehilangan keuntungan yang diharapkan, kehilangan peluang investasi, atau kerugian konsekuensial lainnya;</li>
                  <li><strong className="text-[#bdc1c6]">Kerugian Non-Finansial</strong>: Tekanan psikologis, keputusan hidup yang merugikan, atau dampak negatif lainnya;</li>
                  <li><strong className="text-[#bdc1c6]">Kerugian Akibat Ketidakakuratan Data</strong>;</li>
                  <li><strong className="text-[#bdc1c6]">Kerugian Akibat Gangguan Layanan/Aplikasi</strong>.</li>
                </ul>
                <p>
                  <strong className="text-[#e8eaed]">6.2 Batasan Tanggung Jawab Maksimum</strong>
                  <br />
                  Dalam yurisdiksi yang tidak mengizinkan pengecualian tanggung jawab sepenuhnya, total tanggung jawab Pengembang kepada Pengguna atas seluruh klaim yang timbul dari penggunaan Aplikasi ini tidak akan melebihi jumlah yang dibayarkan oleh Pengguna untuk mengakses Aplikasi ini dalam dua belas (12) bulan terakhir, atau jumlah nominal minimum yang ditetapkan oleh hukum yang berlaku, mana yang lebih rendah.
                </p>
              </div>
            </div>
          </section>

          {/* BAB IV */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB IV — KONTEN EDUKASI DAN INTERPRETASINYA
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 7 — Sifat Konten Edukasi Finansial</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">7.1 Informasi Umum Bukan Personal</strong>
                    <br />
                    Seluruh konten edukasi finansial yang disajikan dalam Aplikasi ini — termasuk tips mengenai diversifikasi aset, pengelolaan dana darurat, konsep inflasi, penghematan, rasio arus kas 50/30/20, dan topik literasi keuangan lainnya — merupakan <strong>informasi finansial umum</strong> (<em>general financial information</em>) yang dimaksudkan untuk meningkatkan kesadaran dan literasi keuangan secara mendasar. Informasi ini tidak mempertimbangkan kondisi keuangan pribadi, tujuan investasi, toleransi risiko, kewajiban pajak, status pernikahan, tanggungan keluarga, atau keadaan pribadi spesifik lainnya.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">7.2 Penyederhanaan untuk Tujuan Edukasi</strong>
                    <br />
                    Konsep-konsep keuangan yang disajikan dalam Aplikasi ini telah disederhanakan secara signifikan untuk tujuan aksesibilitas dan keterpahaman bagi audiens umum. Penyederhanaan ini berarti nuansa, pengecualian, dan kompleksitas yang ada dalam dunia keuangan nyata mungkin tidak tercermin sepenuhnya, konsep yang disajikan mungkin tidak berlaku secara universal, dan Pengguna tidak boleh mengambil keputusan keuangan semata-mata berdasarkan pemahaman yang diperoleh dari konten edukasi dalam Aplikasi ini tanpa melakukan riset lanjutan.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">7.3 Tidak Ada Jaminan Hasil</strong>
                    <br />
                    Pengembang tidak menjamin bahwa penerapan konsep-konsep keuangan umum yang disajikan dalam Aplikasi — seperti rasio 50/30/20 atau prinsip dana darurat — akan menghasilkan hasil keuangan yang positif, optimal, atau sesuai harapan bagi setiap individu.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 8 — Penggunaan Berbagai Bahasa dalam Konten Edukasi</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">8.1 Adaptasi Bahasa untuk Aksesibilitas</strong>
                    <br />
                    Fitur penyesuaian bahasa konten edukasi berdasarkan pasangan aset yang dipilih (misalnya Bahasa Indonesia untuk USD/IDR, Bahasa Jepang untuk USD/JPY) dirancang semata-mata untuk meningkatkan aksesibilitas dan relevansi budaya bagi Pengguna yang beragam. Fitur ini tidak mengimplikasikan penyesuaian regulasi keuangan spesifik negara yang dipilih ataupun kesesuaian dengan standar hukum perlindungan konsumen negara tersebut.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">8.2 Tanggung Jawab Pengguna untuk Verifikasi Konteks Lokal</strong>
                    <br />
                    Pengguna bertanggung jawab penuh untuk memverifikasi kesesuaian informasi umum yang disajikan dalam Aplikasi dengan regulasi, kebijakan, dan kondisi pasar keuangan yang berlaku di yurisdiksi tempat Pengguna berada.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* BAB V */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB V — PENGGUNAAN DATA DAN HAK KEKAYAAN INTELEKTUAL
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 9 — Sumber Data dan Pihak Ketiga</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">9.1 Data dari API Pihak Ketiga</strong>
                    <br />
                    Aplikasi ini menggunakan Data Pasar yang diperoleh dari penyedia data pihak ketiga melalui API publik atau berlisensi. Pengembang tidak memiliki kendali atas keakuratan, ketersediaan, atau kesinambungan data yang disediakan oleh pihak ketiga tersebut.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">9.2 Perubahan Penyedia Data</strong>
                    <br />
                    Pengembang berhak untuk mengubah, mengganti, atau menghentikan penggunaan penyedia data pihak ketiga mana pun kapan saja tanpa pemberitahuan sebelumnya.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">9.3 Tanggung Jawab Penyedia Data Pihak Ketiga</strong>
                    <br />
                    Pengembang tidak bertanggung jawab atas kegagalan, ketidakakuratan, atau pelanggaran yang dilakukan oleh penyedia data pihak ketiga.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 10 — Hak Kekayaan Intelektual</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">10.1 Kepemilikan Konten Aplikasi</strong>
                    <br />
                    Seluruh elemen orisinal dalam Aplikasi ini, termasuk namun tidak terbatas pada karakter Caru, desain visual, mekanisme permainan orisinal, konten teks orisinal, kode perangkat lunak, logo, dan merek dagang, merupakan kekayaan intelektual milik Pengembang yang dilindungi oleh hukum.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">10.2 Lisensi Penggunaan Terbatas</strong>
                    <br />
                    Pengembang memberikan kepada Pengguna lisensi terbatas, non-eksklusif, tidak dapat dipindahtangankan, dan dapat dicabut kapan saja untuk menggunakan Aplikasi ini semata-mata untuk tujuan hiburan dan edukasi personal.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* BAB VI */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB VI — KETENTUAN PENGGUNAAN DAN PEMBATASAN
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 11 — Penggunaan yang Diizinkan dan Dilarang</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">11.1 Penggunaan yang Diizinkan</strong>
                    <br />
                    Pengguna diizinkan untuk menggunakan Aplikasi ini untuk menikmati pengalaman permainan sebagai media hiburan, memperluas wawasan literasi keuangan umum secara personal, menggunakan Aplikasi sebagai media demonstrasi edukasi dalam konteks non-komersial, serta berbagi pengalaman bermain melalui media sosial atau platform streaming dengan menyertakan pengakuan bahwa Aplikasi ini adalah permainan edukasi semata.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">11.2 Penggunaan yang Dilarang</strong>
                    <br />
                    Pengguna dilarang keras untuk menggunakan tampilan atau data dalam Aplikasi sebagai dasar pembuatan keputusan investasi nyata, mempresentasikan Aplikasi sebagai platform analisis keuangan atau trading sinyal nyata, melakukan reverse engineering pada Aplikasi, menggunakan Aplikasi untuk tujuan ilegal, atau memindahtangankan/menjual Aplikasi secara komersial tanpa izin tertulis.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 12 — Pembatasan Usia dan Kapasitas Hukum</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">12.1 Batasan Usia Minimum</strong>
                    <br />
                    Aplikasi ini ditujukan untuk Pengguna yang telah berusia setidaknya tiga belas (13) tahun. Pengguna berusia di bawah delapan belas (18) tahun dianjurkan untuk menggunakan Aplikasi di bawah pengawasan orang tua atau wali yang sah.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">12.2 Kapasitas Hukum</strong>
                    <br />
                    Dengan menggunakan Aplikasi ini, Pengguna menyatakan memiliki kapasitas hukum yang penuh untuk terikat oleh ketentuan ini.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* BAB VII */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB VII — PERNYATAAN KHUSUS DAN KLARIFIKASI TAMBAHAN
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">
                  Pasal 13 — Klarifikasi Eksplisit Mengenai Hal-Hal yang Bukan Merupakan Tujuan Aplikasi
                </h4>
                <p className="mt-1 text-[#9aa0a6] italic">
                  Demi menghindari segala bentuk kesalahpahaman, Pengembang secara tegas menyatakan bahwa Aplikasi ini sama sekali tidak dibuat, dirancang, atau dimaksudkan untuk:
                </p>
                <ol className="list-decimal pl-5 space-y-2 border-l-2 border-[#3c4043]">
                  <li>
                    <strong className="text-[#e8eaed]">13.1</strong> Menjelekkan, mendiskreditkan, merendahkan, atau mencoreng nama baik instrumen keuangan, mata uang, aset kripto, atau kelas aset mana pun yang disebutkan atau ditampilkan dalam Aplikasi.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.2</strong> Menghina, meremehkan, atau mengekspresikan sentimen negatif terhadap negara, pemerintah, bank sentral, lembaga keuangan, bursa efek, atau otoritas regulasi mana pun yang berkaitan dengan aset atau mata uang yang ditampilkan.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.3</strong> Mempromosikan, menganjurkan, atau merekomendasikan investasi dalam aset keuangan mana pun yang ditampilkan dalam Aplikasi, baik secara langsung maupun tersirat.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.4</strong> Memengaruhi sentimen pasar atau opini publik terhadap aset keuangan tertentu melalui cara-cara yang tidak bertanggung jawab atau menyesatkan.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.5</strong> Menyediakan atau berpura-pura menyediakan informasi <em>insider</em>, prediksi pasar eksklusif, atau keunggulan informasional atas pasar keuangan dalam bentuk apa pun.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.6</strong> Memfasilitasi atau mendorong perilaku perjudian, perdagangan spekulatif berisiko tinggi, atau pengambilan risiko keuangan yang tidak bertanggung jawab.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.7</strong> Bertindak sebagai pengganti, kompetitor, atau alternatif dari platform analisis keuangan, platform perdagangan, atau layanan penasihat investasi yang berlisensi dan diregulasi.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.8</strong> Menciptakan kesan bahwa kemampuan seseorang dalam memainkan permainan ini berkorelasi dengan kemampuan atau keberhasilan mereka dalam berinvestasi atau berdagang di pasar keuangan nyata. Keberhasilan dalam permainan ini <strong>tidak</strong> mencerminkan, <strong>tidak</strong> memprediksi, dan <strong>tidak</strong> meningkatkan kemampuan investasi nyata seseorang.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.9</strong> Memanipulasi, mendistorsi, atau menyajikan data pasar keuangan dengan cara yang bertujuan untuk menipu atau menyesatkan Pengguna mengenai kondisi pasar yang sesungguhnya.
                  </li>
                  <li>
                    <strong className="text-[#e8eaed]">13.10</strong> Memberikan kesan bahwa cara-cara apa pun yang ditampilkan atau disimulasikan dalam permainan dapat diterapkan secara langsung dan identik ke dalam strategi keuangan nyata tanpa modifikasi, kajian profesional, dan pertimbangan kontekstual yang mendalam.
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 14 — Pernyataan Netralitas</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3">
                  <p>
                    <strong className="text-[#e8eaed]">14.1 Netralitas Politik dan Ekonomi</strong>
                    <br />
                    Pengembang tidak memiliki afiliasi politik, ideologis, atau ekonomi dengan pihak mana pun. Pemilihan pasangan mata uang, aset kripto, atau instrumen keuangan lainnya didasarkan semata-mata pada popularitas, ketersediaan data, dan keragaman pengalaman bermain, bukan pada preferensi atau pandangan politik atau ekonomi Pengembang.
                  </p>
                  <p>
                    <strong className="text-[#e8eaed]">14.2 Netralitas Terhadap Institusi Keuangan</strong>
                    <br />
                    Aplikasi ini tidak berafiliasi dengan, tidak didukung oleh, dan tidak mempromosikan kepentingan lembaga keuangan, bank, perusahaan investasi, bursa efek, atau entitas keuangan komersial mana pun.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* BAB VIII */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB VIII — PEMBARUAN, MODIFIKASI, DAN PENGHENTIAN LAYANAN
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-[#e8eaed]">Pasal 15 — Hak Pengembang untuk Memodifikasi</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-[#3c4043]">
                <p>
                  <strong className="text-[#e8eaed]">15.1 Perubahan Aplikasi</strong>
                  <br />
                  Pengembang berhak untuk, kapan saja dan tanpa pemberitahuan sebelumnya, memodifikasi, memperbarui, menambahkan, mengurangi, atau menghapus fungsionalitas apa pun dari Aplikasi, termasuk mengubah sumber data, menambah atau menghapus pasangan aset, mengubah mekanisme permainan, atau menghentikan operasi Aplikasi sepenuhnya.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">15.2 Perubahan Syarat dan Ketentuan</strong>
                  <br />
                  Pengembang berhak untuk mengubah dokumen Syarat dan Ketentuan ini kapan saja. Perubahan akan berlaku efektif segera setelah dipublikasikan. Penggunaan Aplikasi yang berkelanjutan setelah perubahan tersebut dipublikasikan merupakan penerimaan Anda atas ketentuan yang telah diubah.
                </p>
              </div>
            </div>
          </section>

          {/* BAB IX */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB IX — HUKUM YANG BERLAKU DAN PENYELESAIAN SENGKETA
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-[#e8eaed]">Pasal 16 — Yurisdiksi dan Hukum yang Berlaku</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-[#3c4043]">
                <p>
                  <strong className="text-[#e8eaed]">16.1 Hukum yang Berlaku</strong>
                  <br />
                  Dokumen Syarat dan Ketentuan ini, serta seluruh hubungan antara Pengembang dan Pengguna yang timbul dari penggunaan Aplikasi ini, tunduk pada dan ditafsirkan sesuai dengan hukum yang berlaku di yurisdiksi tempat Pengembang terdaftar secara resmi, tanpa mengindahkan ketentuan konflik hukum (<em>conflict of law provisions</em>).
                </p>
                <p>
                  <strong className="text-[#e8eaed]">16.2 Penyelesaian Sengketa</strong>
                  <br />
                  Dalam hal timbul sengketa yang berkaitan dengan penggunaan Aplikasi ini atau interpretasi Syarat dan Ketentuan ini, para pihak sepakat untuk terlebih dahulu berupaya menyelesaikan sengketa tersebut melalui negosiasi langsung secara itikad baik sebelum menempuh jalur hukum formal.
                </p>
                <p>
                  <strong className="text-[#e8eaed]">16.3 Pemisahan Klausul</strong>
                  <br />
                  Apabila satu atau lebih ketentuan dalam dokumen ini dinyatakan tidak sah, tidak dapat dilaksanakan, atau bertentangan dengan hukum yang berlaku oleh pengadilan yang berwenang, ketentuan tersebut akan dianggap terpisah dari dokumen ini, sementara ketentuan-ketentuan lainnya tetap berlaku penuh dan sah.
                </p>
              </div>
            </div>
          </section>

          {/* BAB X */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#8ab4f8] border-b border-[#3c4043] pb-1">
              BAB X — PERNYATAAN AKHIR DAN PERSETUJUAN
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 17 — Pernyataan Pemahaman dan Penerimaan Pengguna</h4>
                <p className="mt-1 text-[#9aa0a6] italic">
                  Dengan menggunakan Aplikasi ini, Anda secara eksplisit menyatakan dan mengonfirmasi bahwa:
                </p>
                <ul className="space-y-3 pl-4 border-l-2 border-[#3c4043]">
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.1</span> Anda telah membaca, memahami, dan menerima seluruh ketentuan, penyangkalan, dan klarifikasi yang tertuang dalam dokumen ini secara penuh dan tanpa pengecualian.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.2</span> Anda memahami sepenuhnya bahwa Aplikasi ini adalah <strong className="text-[#bdc1c6]">permainan hiburan edukatif</strong> semata dan bukan merupakan platform investasi, alat analisis keuangan, atau layanan penasihat keuangan dalam bentuk apa pun.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.3</span> Anda memahami bahwa seluruh Konten Finansial yang ditampilkan dalam Aplikasi digunakan semata-mata sebagai elemen permainan dan tidak merupakan rekomendasi, prediksi, atau panduan investasi.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.4</span> Anda tidak akan menggunakan informasi, data, atau pengalaman dari Aplikasi ini sebagai dasar tunggal atau utama untuk membuat keputusan investasi atau keuangan apa pun.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.5</span> Anda memahami bahwa keberhasilan dalam permainan ini tidak mencerminkan atau menjamin keberhasilan dalam investasi nyata.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.6</span> Anda menerima sepenuhnya tanggung jawab atas seluruh keputusan keuangan yang Anda buat, dan membebaskan Pengembang dari segala tuntutan, gugatan, atau klaim yang berkaitan dengan keputusan keuangan tersebut.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.7</span> Anda memahami bahwa untuk mendapatkan nasihat keuangan yang tepat, personal, dan dapat dipertanggungjawabkan, Anda harus berkonsultasi dengan profesional keuangan berlisensi yang kompeten di bidangnya.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.8</span> Anda telah berusia minimal tiga belas (13) tahun, atau apabila Anda berusia di bawah delapan belas (18) tahun, Anda menggunakan Aplikasi ini dengan sepengetahuan dan pengawasan orang tua atau wali yang sah.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.9</span> Anda memahami bahwa Pengembang berhak untuk mengubah, memperbarui, atau menghentikan Aplikasi kapan saja tanpa pemberitahuan sebelumnya.
                  </li>
                  <li>
                    <span className="text-[#81c995] font-bold">☑ 17.10</span> Anda memahami bahwa representasi visual peristiwa keuangan historis dalam Aplikasi ini tidak mengandung maksud penghinaan atau diskreditasi terhadap pihak mana pun, dan merupakan adaptasi kreatif data historis untuk tujuan edukasi dan hiburan semata.
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-[#e8eaed]">Pasal 18 — Catatan Penutup dari Pengembang</h4>
                <div className="pl-4 border-l-2 border-[#3c4043] space-y-3 text-[#9aa0a6] italic">
                  <p>
                    Aplikasi ini lahir dari keyakinan bahwa literasi keuangan seharusnya dapat diakses, dipahami, dan dinikmati oleh semua kalangan — bukan hanya oleh para profesional di industri keuangan. Dengan memadukan hiburan interaktif dan edukasi finansial, kami berharap Aplikasi ini dapat menjadi jembatan yang menyenangkan bagi semua orang untuk mulai memahami dinamika dasar dunia keuangan.
                  </p>
                  <p>
                    Namun, kami menyadari sepenuhnya bahwa dunia keuangan nyata jauh lebih kompleks, bernuansa, dan berisiko daripada yang dapat direpresentasikan oleh sebuah permainan. Oleh karena itu, kami mendorong setiap Pengguna untuk tidak berhenti belajar di sini — jadikan pengalaman bermain ini sebagai titik awal ketertarikan, dan lanjutkan perjalanan belajar Anda bersama sumber-sumber yang lebih mendalam dan profesional yang berlisensi.
                  </p>
                  <p className="font-bold text-center text-[#e8eaed] not-italic mt-3">
                    Bermainlah dengan gembira. Belajarlah dengan bijak. Berinvestasilah dengan hati-hati.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Copyright line */}
          <p className="text-xs text-[#5f6368] pt-6 border-t border-[#3c4043] italic uppercase tracking-wider text-center select-none">
            © Pengembang Aplikasi — Hak Cipta Dilindungi. Seluruh Hak Diperuntukkan.
          </p>
        </div>

        {/* Footer Area with Scrolling Status & Accept Button */}
        <div className="px-6 py-5 border-t border-[#3c4043] bg-[#303134] flex flex-col gap-4 select-none">
          {/* Scrolling dynamic feedback */}
          <div className="transition-all duration-300">
            {hasScrolledToBottom ? (
              <div className="bg-[#81c995]/10 border border-[#81c995]/30 rounded-xl p-3.5 flex items-center gap-3 text-xs md:text-sm text-[#81c995] animate-pulse">
                <span>✅</span>
                <div>
                  <h4 className="font-bold text-[#e8eaed]">Konfirmasi Pembacaan Mandiri Terbuka</h4>
                  <p className="text-[#a8dab5] text-[11px] mt-0.5">
                    Anda telah menelusuri seluruh Syarat &amp; Ketentuan. Silakan berikan tanda persetujuan Anda dengan mengeklik tombol di bawah.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#fbbc04]/10 border border-[#fbbc04]/30 rounded-xl p-3.5 flex items-center gap-3 text-xs md:text-sm text-[#f6ae3d]">
                <span className="animate-bounce">⏳</span>
                <div>
                  <h4 className="font-bold text-[#fbbc04]">Dibutuhkan Penelusuran Dokumen ({scrollProgress}% selesai)</h4>
                  <p className="text-[#fdd663]/80 text-[11px] mt-0.5">
                    Harap gulir / scroll dokumen ini hingga baris paling bawah untuk mengonfirmasi bahwa Anda telah membaca dan mengerti secara utuh.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              disabled={!hasScrolledToBottom}
              className={`px-8 py-3.5 rounded-full font-bold transition-all outline-none text-xs md:text-sm tracking-wide ${
                hasScrolledToBottom 
                  ? "bg-[#81c995] text-[#202124] hover:bg-[#a8dab5] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(129,201,149,0.30)] cursor-pointer"
                  : "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
              }`}
            >
              {hasScrolledToBottom ? "SAYA MENGERTI & MEMATUHI KETENTUAN" : "SILAKAN GULIR HINGGA AKHIR DOKUMEN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
