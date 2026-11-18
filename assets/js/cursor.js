// İmleci takip eden mor nokta + parlayan kuyruk.
// Sitenin tek JavaScript dosyası. Silinirse site aynen çalışır, sadece bu efekt kaybolur.
//
// Nasıl çalışıyor:
// 1. Sayfanın üstüne tam ekran, tıklanamayan bir <canvas> konuyor.
// 2. Nokta fareye her karede aradaki mesafenin %18'i kadar yaklaşıyor
//    (bu yüzden biraz geriden, yumuşak takip ediyor).
// 3. Noktanın son 22 konumu saklanıyor; bunlar arasına giderek incelen
//    ve soluklaşan çizgiler çiziliyor: kuyruk bu.
// 4. Fare durunca bütün konumlar aynı noktada toplanır, kuyruk kendiliğinden kaybolur.

(() => {
  // dokunmatik ekranda imleç yok; hareket azaltma tercih edenlerde efekt kapalı
  if (matchMedia('(pointer: coarse)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#9d00ff';

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: 0, y: 0 };
  const dot = { x: 0, y: 0 };
  const trail = [];
  const TRAIL_LENGTH = 22;
  let visible = false;
  let opacity = 0;

  window.addEventListener('pointermove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (!visible) {
      // sayfaya yeni girdiyse nokta uzaktan uçup gelmesin
      dot.x = mouse.x;
      dot.y = mouse.y;
      trail.length = 0;
    }
    visible = true;
  });

  // fare pencereden çıkınca yavaşça kaybol
  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) visible = false;
  });

  function draw() {
    dot.x += (mouse.x - dot.x) * 0.18;
    dot.y += (mouse.y - dot.y) * 0.18;

    trail.unshift({ x: dot.x, y: dot.y });
    if (trail.length > TRAIL_LENGTH) trail.pop();

    opacity += ((visible ? 1 : 0) - opacity) * 0.1;

    ctx.clearRect(0, 0, width, height);

    if (opacity > 0.01) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.shadowColor = color;

      // kuyruk: baştan sona doğru incelip soluklaşıyor
      ctx.shadowBlur = 26;
      for (let i = 1; i < trail.length; i++) {
        const fade = 1 - i / trail.length;
        ctx.globalAlpha = opacity * fade * 0.6;
        ctx.lineWidth = 16 * fade + 2;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      // baştaki nokta
      ctx.globalAlpha = opacity;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
