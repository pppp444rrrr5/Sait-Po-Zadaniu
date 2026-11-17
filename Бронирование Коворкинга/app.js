/* =========================================================
   ХРАНИЛИЩЕ  (localStorage → позже API + БД)
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
   
   /* =========================================================
      УТИЛИТЫ
      ========================================================= */
   const $app = document.getElementById('app');
   const toastEl = document.getElementById('toast');
   
   function toast(msg, type = '') {
     toastEl.textContent = msg;
     toastEl.className = 'toast show ' + type;
     clearTimeout(toast._t);
     toast._t = setTimeout(() => (toastEl.className = 'toast'), 2200);
   }
   function fmtDate(d) { return d.toISOString().slice(0, 10); }
   function todayStr() { return fmtDate(new Date()); }
   function navigate(hash) { location.hash = hash; }
   
   function updateBadge() {
     const badge = document.getElementById('nav-badge');
     if (!badge) return;
     const n = loadBookings().length;
     badge.hidden = n === 0;
     badge.textContent = n;
   }
   
   /* =========================================================
      РОУТЕР
      #/map
      #/list
      #/place/:id
      #/booking/:id
      #/profile
      ========================================================= */
   function router() {
     const hash = location.hash.replace(/^#/, '') || '/map';
     const parts = hash.split('/').filter(Boolean);
     const page = parts[0];
     const id = parts[1];
   
     document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
     const navLink = document.querySelector(`nav a[data-nav="${page}"]`);
     if (navLink) navLink.classList.add('active');
   
     updateBadge();
   
     if (page === 'map')                return renderMap();
     if (page === 'list')               return renderList();
     if (page === 'place' && id)        return renderPlace(id);
     if (page === 'booking' && id)      return renderBooking(id);
     if (page === 'profile')            return renderProfile();
   
     renderList();
   }
   window.addEventListener('hashchange', router);
   window.addEventListener('DOMContentLoaded', router);
   
   /* =========================================================
      СТРАНИЦА 1: КАРТА
      ========================================================= */
   let ymapInstance = null;
   
   function renderMap() {
     $app.innerHTML = `
       <h1>Карта коворкингов</h1>
       <p class="muted">Кликните по метке — откроется карточка места. Метки кликабельны.</p>
       <div id="map"></div>
     `;
   
     if (ymapInstance) { ymapInstance.destroy(); ymapInstance = null; }
   
     if (typeof ymaps === 'undefined') {
       document.getElementById('map').innerHTML =
         '<div style="padding:20px;color:#c92a2a">Не удалось загрузить Яндекс.Карты. Проверьте API-ключ в index.html.</div>';
       return;
     }
   
     ymaps.ready(() => {
       ymapInstance = new ymaps.Map('map', {
         center: [55.7558, 37.6176],
         zoom: 12,
         controls: ['zoomControl', 'fullscreenControl'],
       });
   
       loadPlaces().forEach(p => {
         const placemark = new ymaps.Placemark(
           [p.lat, p.lng],
           {
             balloonContentHeader: `<b>${p.name}</b>`,
             balloonContentBody: `
               ${p.address}<br>
               ${p.price} ₽/час<br>
               <a href="#/place/${p.id}">Открыть карточку →</a>
             `,
             hintContent: p.name,
           },
           { preset: 'islands#blueIcon' }
         );
         ymapInstance.geoObjects.add(placemark);
       });
   
       const bounds = ymapInstance.geoObjects.getBounds();
       if (bounds) {
         ymapInstance.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
       }
     });
   }
   
   /* =========================================================
      СТРАНИЦА 2: СПИСОК МЕСТ
      ========================================================= */
   function renderList() {
     const places = loadPlaces();
     $app.innerHTML = `
       <h1>Все площадки</h1>
       <p class="muted">Нажмите на карточку, чтобы перейти к месту.</p>
       <div class="grid">
         ${places.map(p => `
           <div class="card" data-id="${p.id}">
             <h3>${p.name}</h3>
             <div class="meta">${p.address}</div>
             <div class="meta">${p.desc || ''}</div>
             <div class="price">${p.price} ₽ / час</div>
           </div>
         `).join('')}
       </div>
     `;
     $app.querySelectorAll('.card').forEach(el => {
       el.addEventListener('click', () => navigate(`/place/${el.dataset.id}`));
     });
   }
   
   /* =========================================================
      СТРАНИЦА 3: МЕСТО
      ========================================================= */
   let miniMapInstance = null;
   
   function renderPlace(id) {
     const place = loadPlaces().find(p => p.id === id);
     if (!place) { $app.innerHTML = '<p>Не найдено</p>'; return; }
   
     $app.innerHTML = `
       <div class="crumbs"><a href="#/list">← К списку</a></div>
       <h1>${place.name}</h1>
       <div class="detail">
         <div class="panel">
           <p><b>Адрес:</b> ${place.address}</p>
           <p><b>Описание:</b> ${place.desc || '—'}</p>
           <p><b>Стоимость:</b> <span class="price">${place.price} ₽ / час</span></p>
           <div class="btn-row">
             <button class="btn" id="go-book">Забронировать</button>
             <a class="btn secondary" href="#/map">Показать на карте</a>
           </div>
         </div>
         <div class="panel">
           <h2>Доступность сегодня</h2>
           <div id="today-availability" class="muted">Загрузка…</div>
         </div>
       </div>
       <div class="panel" style="margin-top:20px">
         <h2>Расположение</h2>
         <div id="mini-map"></div>
       </div>
     `;
   
     document.getElementById('go-book').addEventListener('click', () => navigate(`/booking/${place.id}`));
   
     // Доступность сегодня
     const bookings = loadBookings().filter(b => b.placeId === place.id && b.date === todayStr());
     const box = document.getElementById('today-availability');
     if (!bookings.length) {
       box.textContent = 'Сегодня свободно всё время';
     } else {
       box.innerHTML = 'Занято сегодня:<br>' +
         bookings.map(b => `<span class="muted">${b.slots.join(', ')}</span>`).join('<br>');
     }
   
     // Мини-карта
     if (miniMapInstance) { miniMapInstance.destroy(); miniMapInstance = null; }
     if (typeof ymaps !== 'undefined') {
       ymaps.ready(() => {
         miniMapInstance = new ymaps.Map('mini-map', {
           center: [place.lat, place.lng],
           zoom: 14,
           controls: ['zoomControl'],
         });
         miniMapInstance.geoObjects.add(new ymaps.Placemark(
           [place.lat, place.lng],
           { hintContent: place.name, balloonContentHeader: place.name, balloonContentBody: place.address },
           { preset: 'islands#blueIcon' }
         ));
       });
     }
   }
   
   /* =========================================================
      СТРАНИЦА 4: БРОНИРОВАНИЕ
      ========================================================= */
   const SLOTS = [
     '09:00','10:00','11:00','12:00','13:00','14:00',
     '15:00','16:00','17:00','18:00','19:00','20:00',
   ];
   
   let bookingState = { placeId: null, date: todayStr(), slots: [] };
   
   function renderBooking(id) {
     const place = loadPlaces().find(p => p.id === id);
     if (!place) { $app.innerHTML = '<p>Не найдено</p>'; return; }
   
     bookingState = { placeId: id, date: todayStr(), slots: [] };
   
     $app.innerHTML = `
       <div class="crumbs"><a href="#/place/${id}">← К месту</a></div>
       <h1>Бронирование: ${place.name}</h1>
       <div class="detail">
         <div class="panel">
           <h2>1. Выберите дату</h2>
           <div class="calendar" id="calendar"></div>
         </div>
         <div class="panel">
           <h2>2. Выберите время</h2>
           <div class="muted">${place.price} ₽ / час</div>
           <div class="slots" id="slots"></div>
           <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
             <div>Итого: <b id="total">0 ₽</b></div>
             <button class="btn" id="pay-btn" disabled>Оплатить и забронировать</button>
           </div>
         </div>
       </div>
     `;
   
     renderCalendar();
     renderSlots();
     document.getElementById('pay-btn').addEventListener('click', onPay);
   }
   
   function renderCalendar() {
     const cal = document.getElementById('calendar');
     const now = new Date();
     const year = now.getFullYear();
     const month = now.getMonth();
   
     function draw() {
       const first = new Date(year, month, 1);
       const startDow = (first.getDay() + 6) % 7;
       const daysInMonth = new Date(year, month + 1, 0).getDate();
       const dows = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
   
       let html = dows.map(d => `<div class="dow">${d}</div>`).join('');
       for (let i = 0; i < startDow; i++) html += `<div></div>`;
   
       for (let d = 1; d <= daysInMonth; d++) {
         const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
         const isPast = dateStr < todayStr();
         const selected = dateStr === bookingState.date;
         html += `<div class="cal-day ${isPast?'disabled':''} ${selected?'selected':''}"
                       data-date="${dateStr}">${d}</div>`;
       }
       cal.innerHTML = html;
   
       cal.querySelectorAll('.cal-day:not(.disabled)').forEach(el => {
         el.addEventListener('click', () => {
           bookingState.date = el.dataset.date;
           bookingState.slots = [];
           draw();
           renderSlots();
         });
       });
     }
     draw();
   }
   
   function renderSlots() {
     const taken = loadBookings()
       .filter(b => b.placeId === bookingState.placeId && b.date === bookingState.date)
       .flatMap(b => b.slots);
   
     const slotsEl = document.getElementById('slots');
     slotsEl.innerHTML = SLOTS.map(s => {
       const isBooked = taken.includes(s);
       const isSel = bookingState.slots.includes(s);
       return `<div class="slot ${isBooked?'booked':''} ${isSel?'selected':''}"
                    data-slot="${s}">${s}</div>`;
     }).join('');
   
     slotsEl.querySelectorAll('.slot:not(.booked)').forEach(el => {
       el.addEventListener('click', () => {
         const s = el.dataset.slot;
         const i = bookingState.slots.indexOf(s);
         if (i >= 0) bookingState.slots.splice(i, 1);
         else bookingState.slots.push(s);
         renderSlots();
         updateTotal();
       });
     });
     updateTotal();
   }
   
   function updateTotal() {
     const place = loadPlaces().find(p => p.id === bookingState.placeId);
     const total = bookingState.slots.length * place.price;
     document.getElementById('total').textContent = total + ' ₽';
     document.getElementById('pay-btn').disabled = bookingState.slots.length === 0;
   }
   
   function onPay() {
     const place = loadPlaces().find(p => p.id === bookingState.placeId);
     const total = bookingState.slots.length * place.price;
   
     const btn = document.getElementById('pay-btn');
     btn.disabled = true;
     btn.textContent = 'Обработка оплаты…';
   
     // Имитация оплаты
     setTimeout(() => {
       const bookings = loadBookings();
       bookings.push({
         id: 'b' + Date.now(),
         placeId: bookingState.placeId,
         placeName: place.name,
         date: bookingState.date,
         slots: [...bookingState.slots].sort(),
         total,
         createdAt: new Date().toISOString(),
       });
       saveBookings(bookings);
       updateBadge();
       toast(`✅ Оплачено ${total} ₽. Бронь подтверждена.`);
       navigate('/profile');
     }, 900);
   }
   
   /* =========================================================
      СТРАНИЦА 5: ПРОФИЛЬ
      ========================================================= */
   function renderProfile() {
     const bookings = loadBookings().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
   
     $app.innerHTML = `
       <h1>Мои бронирования</h1>
       <p class="muted">Всего броней: ${bookings.length}</p>
       <div class="panel">
         ${bookings.length ? bookings.map(b => `
           <div class="booking-row" data-id="${b.id}">
             <div class="info">
               <b>${b.placeName}</b>
               <small>${b.date} · ${b.slots.join(', ')} · ${b.total} ₽</small>
             </div>
             <div style="display:flex; gap:8px">
               <a class="btn secondary" href="#/place/${b.placeId}">К месту</a>
               <button class="btn danger" data-cancel="${b.id}">Отменить</button>
             </div>
           </div>
         `).join('') : '<p class="muted">Пока нет броней. <a href="#/list">Выбрать место →</a></p>'}
       </div>
     `;
   
     $app.querySelectorAll('[data-cancel]').forEach(btn => {
       btn.addEventListener('click', () => {
         const id = btn.dataset.cancel;
         if (!confirm('Отменить бронирование?')) return;
         saveBookings(loadBookings().filter(b => b.id !== id));
         updateBadge();
         toast('Бронь отменена');
         renderProfile();
       });
     });
   }