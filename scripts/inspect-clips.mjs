import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1050, height: 770 } });
  await page.goto('http://localhost:3011');
  await page.setContent(`<body style="margin:20px;background:#f2f6f8;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;font:16px Arial">${['waiting', 'thinking_suggesting', 'reading', 'researching', 'complete', 'retry'].map(name => `<div><p>${name}</p><video src="http://localhost:3011/design/carra-character/${name}.mp4" muted preload="auto" style="width:100%;height:290px;object-fit:contain"></video></div>`).join('')}</body>`);
  const metadata = await page.evaluate(async () => Promise.all([...document.querySelectorAll('video')].map(async video => {
    await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = reject; if (video.readyState >= 2) resolve(); });
    video.currentTime = 1;
    await new Promise(resolve => video.onseeked = resolve);
    return { src: video.src.split('/').pop(), width: video.videoWidth, height: video.videoHeight, duration: video.duration };
  })));
  console.log(metadata);
  await page.screenshot({ path: 'artifacts/clip-preview.png' });
} finally { await browser.close(); }
