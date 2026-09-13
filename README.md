# Survival Online

بازی بقای سه‌بعدی، چندنفره‌ی آنلاین. تمام گرافیک (زمین، درخت، سنگ، اسلحه‌ها، کوله‌پشتی، آیتم‌ها)
با کد و Three.js ساخته می‌شود — هیچ فایل تصویر یا مدل خارجی استفاده نشده.
چندنفره با Supabase Realtime (بدون نیاز به دیتابیس یا سرور اختصاصی).

## ساختار پروژه

```
survival-online/
├── index.html              رابط کاربری (HTML/CSS) — بدون منطق بازی
├── package.json
├── vite.config.js
├── .env.example             نمونه‌ی متغیرهای Supabase
└── src/
    ├── main.js               نقطه‌ی ورود — همه‌چیز را به هم وصل می‌کند
    ├── world/
    │   ├── world.js          RNG قطعی + تابع ارتفاع زمین (تولید نقشه)
    │   ├── terrain.js        ساخت مش زمین + دریاچه
    │   └── nature.js         درخت/سنگ/علف (InstancedMesh)
    ├── entities/
    │   ├── weapons.js        هندسه‌ی تپانچه/تفنگ/تبر/کوله + تعریف آیتم‌ها
    │   └── items.js          اسپاون و مدیریت آیتم‌های روی زمین
    ├── systems/
    │   ├── input.js          کیبورد/ماوس (PC) + جوی‌استیک لمسی (موبایل)
    │   ├── multiplayer.js    اتصال Supabase Realtime، سینک بازیکن‌ها
    │   └── dayNight.js       چرخه‌ی روز/شب
    └── ui/
        └── hud.js            آپدیت DOM: نوار سلامتی، هات‌بار، کوله، پیام‌ها
```

## اجرا روی سیستم خودت

1. [Node.js](https://nodejs.org) نسخه‌ی ۱۸ به بالا نصب کن.
2. در پوشه‌ی پروژه:
   ```
   npm install
   npm run dev
   ```
3. آدرسی که در ترمینال می‌آید (چیزی مثل `http://localhost:5173`) را در مرورگر باز کن.

## چندنفره کردن (اختیاری)

1. یک پروژه‌ی رایگان در [supabase.com](https://supabase.com) بساز.
2. از بخش Project Settings → API، مقدار `Project URL` و `anon public key` را بردار.
3. یا این دو مقدار را مستقیم در صفحه‌ی شروع بازی وارد کن،
   یا فایل `.env.example` را کپی کن به نام `.env` و مقادیر را آنجا بگذار:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Realtime به‌صورت پیش‌فرض روی پروژه‌های جدید Supabase فعال است؛ نیازی به ساخت جدول نیست.

## ساخت نسخه‌ی نهایی برای انتشار

```
npm run build
```
خروجی در پوشه‌ی `dist/` ساخته می‌شود؛ همان را روی هر هاستی (Vercel، Netlify، GitHub Pages) آپلود کن.
