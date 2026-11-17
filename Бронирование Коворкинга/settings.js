/* =========================================================
   НАСТРОЙКИ САЙТА
   =========================================================
   Чтобы поставить ВИДЕО-фон на весь сайт:
   1. Положите файл, например, background.mp4 в папку проекта.
      (можно также .webm — он легче и качественнее)
   2. Укажите путь ниже: window.SITE_VIDEO = 'background.mp4';
   3. Готово — видео применится на всех страницах.

   Если оставить пустую строку — будет стандартный
   тёмно-фиолетовый фон.

   Настройки затемнения:
   window.SITE_VIDEO_BRIGHTNESS = 0.35;  // 0.2 — темнее, 0.6 — светлее
   ========================================================= */
   window.SITE_VIDEO = '';            // например: 'background.mp4'
   window.SITE_VIDEO_BRIGHTNESS = 0.35;
   
   (function applyVideoBackground() {
     const src = window.SITE_VIDEO;
     if (!src) return;
   
     const video = document.createElement('video');
     video.src = src;
     video.autoplay = true;
     video.muted = true;
     video.loop = true;
     video.playsInline = true;
     video.setAttribute('aria-hidden', 'true');
   
     Object.assign(video.style, {
       position: 'fixed',
       inset: '0',
       width: '100%',
       height: '100%',
       objectFit: 'cover',
       zIndex: '-2',
       filter: `brightness(${window.SITE_VIDEO_BRIGHTNESS})`,
       pointerEvents: 'none',
     });
   
     // Если видео не загрузилось — просто скрываем его
     video.addEventListener('error', () => {
       console.warn('[settings.js] Не удалось загрузить видео-фон:', src);
       video.remove();
     });
   
     document.body.prepend(video);
   })();