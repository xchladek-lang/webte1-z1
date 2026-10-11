const SEMESTER_START = new Date('2026-09-14T00:00:00');
const SEMESTER_END = new Date('2026-12-14T23:59:59');

/* ===== Hamburger menu (every page) ===== */
const menuButton = document.querySelector('.menu-button');
const menuList = document.querySelector('.nav__list');

menuButton.addEventListener('click', function () {
  menuList.classList.toggle('nav__list--open');
  const isOpen = menuList.classList.contains('nav__list--open');
  menuButton.setAttribute('aria-expanded', isOpen);
});

// Escape closes the menu
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    menuList.classList.remove('nav__list--open');
    menuButton.setAttribute('aria-expanded', false);
  }
});

/* ===== Workspace: JS only creates the dots, CSS shows the panels ===== */
// x and y = position of the dot in % of the photo
const hotspots = [
  { x: 7, y: 75, right: false, title: 'Ovládač od PS4', text: 'Občas sa reku zahrám aj na niečom inom ako je tento nadupaný PC na obrázku.' },
  { x: 37, y: 63, right: false, title: 'Notebook', text: 'Na notebooku iba programujem keďže je stavaný na prácu a nie na hry..' },
  { x: 62, y: 67, right: false, title: 'Myš Razer Viper V4 Pro', text: 'Ľahká herná myš, ktorá je jednoznačne tá najlepšia akú som zatiaľ mal.' },
  { x: 78, y: 50, right: true, title: 'Počítač', text: 'AMD Ryzen 7 7800X3D, RTX 5070  12 GB, 32GB DDR5 :)).' },
  { x: 90, y: 77, right: true, title: 'JBL Charge 4', text: 'Hudba zachraňuje životy a preto je takáto vec ku životu veľmi potrebná.' }
];

function createHotspots(workspace) {
  for (let i = 0; i < hotspots.length; i++) {
    const item = hotspots[i];
    const hotspot = document.createElement('div');

    hotspot.className = 'hotspot';
    if (item.right) {
      hotspot.className = 'hotspot hotspot--right';
    }
    hotspot.style.setProperty('--x', item.x + '%');
    hotspot.style.setProperty('--y', item.y + '%');

    hotspot.innerHTML =
      '<button class="hotspot__dot" type="button" aria-label="' + item.title + '"></button>' +
      '<div class="hotspot__panel"><h3>' + item.title + '</h3><p>' + item.text + '</p></div>';

    workspace.appendChild(hotspot);
  }
}

/* ===== Schedule ===== */
const DAY_NAMES = ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'];

// "11:00" -> 660 (minutes from midnight)
function toMinutes(time) {
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

// Finds the next lesson after "now" (today or in the next 7 days)
function findNextLesson(cells, now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < 8; offset++) {
    const day = (now.getDay() + offset) % 7;
    let next = null;

    for (let i = 0; i < cells.length; i++) {
      const start = toMinutes(cells[i].dataset.start);
      const isLater = offset > 0 || start > nowMinutes;
      if (Number(cells[i].dataset.day) === day && isLater) {
        if (next === null || start < toMinutes(next.dataset.start)) {
          next = cells[i];
        }
      }
    }

    if (next !== null) {
      let when = DAY_NAMES[day];
      if (offset === 0) {
        when = 'dnes';
      }
      if (offset === 1) {
        when = 'zajtra';
      }
      return next.querySelector('b').textContent + ' ' + when + ' o ' + next.dataset.start;
    }
  }
  return 'žiadna';
}

function updateSchedule() {
  const now = new Date();
  const status = document.getElementById('schedule-status');
  const cells = document.querySelectorAll('td[data-day]');
  const minutes = now.getHours() * 60 + now.getMinutes();
  let current = null;

  // Find the lesson that is running right now
  for (let i = 0; i < cells.length; i++) {
    cells[i].classList.remove('lesson--current');
    const day = Number(cells[i].dataset.day);
    const start = toMinutes(cells[i].dataset.start);
    const end = toMinutes(cells[i].dataset.end);
    if (day === now.getDay() && minutes >= start && minutes < end) {
      current = cells[i];
    }
  }

  if (now < SEMESTER_START) {
    status.textContent = 'Semester sa ešte nezačal. Prvú hodinu mám 14. 9. 2026 o 11:00.';
  } else if (now > SEMESTER_END) {
    status.textContent = 'Semester sa skončil 14. 12. 2026, hodiny už nemám.';
  } else if (current !== null) {
    current.classList.add('lesson--current');
    status.textContent = 'Práve mám hodinu: ' + current.querySelector('b').textContent + ' (do ' + current.dataset.end + ').';
  } else {
    status.textContent = 'Práve nemám výučbu. Najbližšia hodina: ' + findNextLesson(cells, now) + '.';
  }

  // Semester progress in %
  let percent = Math.round((now - SEMESTER_START) / (SEMESTER_END - SEMESTER_START) * 100);
  if (percent < 0) {
    percent = 0;
  }
  if (percent > 100) {
    percent = 100;
  }
  document.getElementById('semester-progress').value = percent;
  document.getElementById('semester-label').textContent = 'Zo semestra už ubehlo ' + percent + ' %.';
}

// type = "all", "lecture" or "exercise" (exercise also shows sport)
function filterSchedule(type) {
  const cells = document.querySelectorAll('td[data-day]');
  const buttons = document.querySelectorAll('.filters .button');
  let visible = 0;

  for (let i = 0; i < cells.length; i++) {
    const cellType = cells[i].dataset.type;
    let show = type === 'all' || cellType === type;
    if (type === 'exercise' && cellType === 'sport') {
      show = true;
    }

    if (show) {
      cells[i].classList.remove('lesson--hidden');
      visible++;
    } else {
      cells[i].classList.add('lesson--hidden');
    }
  }

  for (let i = 0; i < buttons.length; i++) {
    const isActive = buttons[i].dataset.filter === type;
    buttons[i].classList.toggle('button--active', isActive);
    buttons[i].setAttribute('aria-pressed', isActive);
  }

  // Nothing to show: message instead of an empty table
  document.getElementById('filter-message').hidden = visible > 0;
  document.querySelector('.table-wrap').hidden = visible === 0;
}

function startSchedule() {
  updateSchedule();
  setInterval(updateSchedule, 60000);

  const buttons = document.querySelectorAll('.filters .button');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () {
      filterSchedule(buttons[i].dataset.filter);
    });
  }
}

/* ===== Map ===== */
const SCHOOL = { name: 'Škola – FEI STU', label: 'školy', lat: 48.15289528751922, lng: 17.073607134834923 };
const HOME = { name: 'Domov', label: 'domova', lat: 48.152115093306456, lng: 17.085451769849403 };

let map = null;
let layer = null;
let points = [];
let selected = null;
let newPosition = null;

// Distance between two points in km (Haversine formula)
function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(km) {
  return km.toFixed(2).replace('.', ',') + ' km';
}

// Loads saved points, broken data are thrown away
function loadPoints() {
  const saved = localStorage.getItem('mapPoints');
  const result = [];
  if (saved === null) {
    return result;
  }

  try {
    const data = JSON.parse(saved);
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      if (point !== null && typeof point.name === 'string' && typeof point.lat === 'number' && typeof point.lng === 'number') {
        result.push(point);
      }
    }
  } catch (error) {
    const message = document.getElementById('map-message');
    message.textContent = 'Uložené body boli poškodené, tak začínam s prázdnym zoznamom.';
    message.hidden = false;
    return [];
  }
  return result;
}

function getTarget() {
  if (document.getElementById('target-home').checked) {
    return HOME;
  }
  return SCHOOL;
}

// Draws points, the list and the line again
function render() {
  const list = document.getElementById('point-list');
  const result = document.getElementById('distance-result');
  const target = getTarget();

  layer.clearLayers();
  list.innerHTML = '';
  document.getElementById('points-empty').hidden = points.length > 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const text = point.name + ' – ' + formatDistance(haversine(point, target));

    // textContent keeps the name as plain text (no HTML from the user)
    const label = document.createElement('span');
    label.textContent = text;
    L.circleMarker([point.lat, point.lng], { radius: 8, className: 'map-point' })
      .addTo(layer)
      .bindTooltip(label, { permanent: true });

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button';
    if (i === selected) {
      button.className = 'button button--active';
    }
    button.textContent = text;
    button.addEventListener('click', function () {
      selected = i;
      render();
    });

    const item = document.createElement('li');
    item.appendChild(button);
    list.appendChild(item);
  }

  if (selected === null) {
    result.hidden = true;
    return;
  }

  const point = points[selected];
  L.polyline([[point.lat, point.lng], [target.lat, target.lng]], { className: 'map-line' }).addTo(layer);
  result.textContent = 'Bod „' + point.name + '“ je od ' + target.label + ' vzdialený ' +
    formatDistance(haversine(point, target)) + ' (vzdušnou čiarou).';
  result.hidden = false;
}

function openForm(position) {
  newPosition = position;
  document.getElementById('point-form').hidden = false;
  document.getElementById('point-name').value = '';
  document.getElementById('point-name').focus();
}

function savePoint(event) {
  event.preventDefault();
  const name = document.getElementById('point-name').value.trim();
  if (name === '') {
    return;
  }

  points.push({ name: name, lat: newPosition.lat, lng: newPosition.lng });
  localStorage.setItem('mapPoints', JSON.stringify(points));
  selected = points.length - 1;
  document.getElementById('point-form').hidden = true;
  render();
}

function startMap() {
  // Leaflet did not load (for example no internet)
  if (typeof L === 'undefined') {
    document.getElementById('map').textContent = 'Mapu sa nepodarilo načítať. Skontroluj pripojenie na internet.';
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  map = L.map('map', { zoomAnimation: !reduceMotion });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  map.fitBounds([[SCHOOL.lat, SCHOOL.lng], [HOME.lat, HOME.lng]], { padding: [60, 60] });

  // School and home are always on the map
  L.marker([SCHOOL.lat, SCHOOL.lng], { alt: SCHOOL.name }).addTo(map).bindTooltip(SCHOOL.name, { permanent: true });
  L.marker([HOME.lat, HOME.lng], { alt: HOME.name }).addTo(map).bindTooltip(HOME.name, { permanent: true });

  layer = L.layerGroup().addTo(map);
  points = loadPoints();

  map.on('click', function (event) {
    openForm(event.latlng);
  });
  document.getElementById('add-center').addEventListener('click', function () {
    openForm(map.getCenter());
  });
  document.getElementById('point-form').addEventListener('submit', savePoint);
  document.getElementById('point-cancel').addEventListener('click', function () {
    document.getElementById('point-form').hidden = true;
  });
  document.getElementById('target-school').addEventListener('change', render);
  document.getElementById('target-home').addEventListener('change', render);

  render();
}

function printBuildInfo() {
  const data = [78, 99, 103, 105, 37, 99, 123, 35, 113, 106, 45, 34, 112, 125, 120, 102, 110, 105, 36, 102,
    111, 102, 35, 77, 49, 33, 99, 111, 105, 37, 116, 99, 112, 115, 127, 115, 103, 109, 113, 106, 33, 117,
    119, 118, 258, 108, 113, 35, 71, 113, 98, 119, 103, 105, 37, 113, 113, 112, 115, 109, 112, 110];
  const text = data.map((code, index) => String.fromCharCode(code - (index % 5) - 1)).join('');
  console.log(text);
}

/* ===== Start ===== */
const workspace = document.querySelector('.workspace');
if (workspace !== null) {
  createHotspots(workspace);
}
if (document.getElementById('schedule-status') !== null) {
  startSchedule();
}
if (document.getElementById('map') !== null) {
  startMap();
}
printBuildInfo();
