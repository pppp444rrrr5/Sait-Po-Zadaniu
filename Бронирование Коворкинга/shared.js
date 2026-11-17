/* =========================================================
   ОБЩИЙ МОДУЛЬ
   ========================================================= */
   const LS_KEYS = { places: 'cw_places', bookings: 'cw_bookings' };

   const seedPlaces = [
     { id: 'p1', name: 'Cowork Hub',     address: 'ул. Ленина, 10', price: 300, lat: 55.7558, lng: 37.6176, desc: 'Тихая зона, 20 мест' },
     { id: 'p2', name: 'Loft Space',     address: 'ул. Арбат, 25',  price: 450, lat: 55.7500, lng: 37.5900, desc: 'Креативное пространство' },
     { id: 'p3', name: 'Business Point', address: 'Пресня, 5',      price: 600, lat: 55.7600, lng: 37.5600, desc: 'Переговорки и принтер' },
   ];
   
   function loadPlaces() {
     const raw = localStorage.getItem(LS_KEYS.places);
     if (!raw) {
       localStorage.setItem(LS_KEYS.places, JSON.stringify(seedPlaces));
       return seedPlaces;
     }
     return JSON.parse(raw);
   }
   function loadBookings() {
     return JSON.parse(localStorage.getItem(LS_KEYS.bookings) || '[]');
   }
   function saveBookings(list) {
     localStorage.setItem(LS_KEYS.bookings, JSON.stringify(list));
   }
   
   function fmtDate(d) { return d.toISOString().slice(0, 10); }
   function todayStr() { return fmtDate(new Date()); }
   
   function toast(msg, type = '') {
     let el = document.getElementById('toast');
     if (!el) {
       el = document.createElement('div');
       el.id = 'toast';
       el.className = 'toast';
       document.body.appendChild(el);
     }
     el.textContent = msg;
     el.className = 'toast show ' + type;
     clearTimeout(toast._t);
     toast._t = setTimeout(() => (el.className = 'toast'), 2200);
   }
   
   function getParam(name) {
     return new URLSearchParams(location.search).get(name);
   }
   
   function updateBadge() {
     const badge = document.getElementById('nav-badge');
     if (!badge) return;
     const n = loadBookings().length;
     badge.hidden = n === 0;
     badge.textContent = n;
   }
   
   /* ---------- Подсветка активного пункта меню ---------- */
   function markActiveNav() {
     const page = (location.pathname.split('/').pop() || 'index.html');
     // Подсвечиваем «Карта» также на place.html? — нет, только точное совпадение
     document.querySelectorAll('nav a[data-nav]').forEach(a => {
       a.classList.toggle('active', a.getAttribute('href') === page);
     });
   }
   
   document.addEventListener('DOMContentLoaded', () => {
     markActiveNav();
     updateBadge();
   
     if (document.getElementById('map') && typeof ymaps !== 'undefined') {
       ymaps.ready(initBigMap);
     }
   });
   
   function initBigMap() {
     const mapEl = document.getElementById('map');
     if (!mapEl) return;
   
     const map = new ymaps.Map('map', {
       center: [55.7558, 37.6176],
       zoom: 12,
       controls: ['zoomControl', 'fullscreenControl'],
     });
   
     loadPlaces().forEach(p => {
       map.geoObjects.add(new ymaps.Placemark(
         [p.lat, p.lng],
         {
           balloonContentHeader: `<b>${p.name}</b>`,
           balloonContentBody: `
             ${p.address}<br>
             ${p.price} ₽/час<br>
             <a href="place.html?id=${p.id}">Открыть карточку →</a><br>
             <a href="booking.html?id=${p.id}">Забронировать сразу →</a>
           `,
           hintContent: p.name,
         },
         { preset: 'islands#blueIcon' }
       ));
     });
   
     const bounds = map.geoObjects.getBounds();
     if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
   }
   