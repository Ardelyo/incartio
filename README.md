# 🚗 FINCARS - Jelajahi Sejarah Pasar

> *"Drive Through Market History"*

Game finansial mobile-first buatan anak bangsa, tempat grafik nilai tukar menjadi lintasan yang kamu lewati.  
Finance × Gaming. Belajar pasar modal sambil ngegas!

---

## 🤔 Apaan sih ini?

Fincars itu game mobile-first yang ngeubah data pergerakan harga mata uang dunia jadi terrain yang bisa lu tancap gas. 

Naik terus? Itu bull run, mobil lu nanjak.  
Anjlok? Itu bear market, hati-hati kecelakaan.  
Flat? Santai aja, jalan datar buat ngumpulin koin.

Intinya: lu ngerasain volatilitas pasar secara langsung, bukan cuma liat angka doang di layar.

---

## ✨ Fitur Keren

- 🌍 **Real Market Data** — Data live & historis dari Alpha Vantage & Google Gemini
- 🎮 **Terrain dari Chart** — Setiap pergerakan harga jadi bentuk jalanan beneran
- ⛽ **Fuel System** — Strategi bensin jadi penting, jangan sampe abis di tengah jalan
- 🏆 **Achievement & Best Score** — Pamer skor terbaik lu per currency pair
- 🚙 **Garage & Skin** — Kustomisasi mobil (Caru) pake koin hasil main. **No pay-to-win!**
- 😀 **Caru Mood System** — Mobil lu punya ekspresi sesuai kondisi pasar
- ⚡ **Crisis Zone** — Lewatin zona crash kayak 2008 atau COVID-19 dapet bonus gede

---

## 🛠 Tech Stack

- React 19 + TypeScript
- Vite 6.2
- Tailwind CSS 4.1 + Motion
- Zustand 5.0
- HTML5 Canvas (game engine custom)
- Google Gemini API 2.4
- Alpha Vantage API

---

## 🚀 Cara Jalanin

```bash
# Clone repo
git clone https://github.com/ardelyo/fincars.git
cd fincars

# Install dependencies
npm install

# Setup environment variables
1. Copy [.env.example](.env.example) to `.env.local`
2. Set the `GEMINI_API_KEY` to your Gemini API key
3. Add any server-side market data keys you want to use

# Start the secure API proxy
npm run server

# In another terminal, run the app
npm run dev
```
