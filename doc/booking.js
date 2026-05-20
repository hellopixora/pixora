/* ============================================================
   BOOKING PAGE — Multi-step flow logic
   ============================================================ */

'use strict';

// === STATE ===
const booking = { doctor: null, specialty: null, date: null, time: null, type: null };

// === STEP NAVIGATION ===
let currentStep = 1;

function goToStep(n) {
  document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step' + n)?.classList.remove('hidden');
  currentStep = n;
  updateProgress(n);
  updateSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(n) {
  document.querySelectorAll('.progress-step').forEach((step, i) => {
    const sn = i + 1;
    step.classList.remove('active', 'done');
    if (sn < n) step.classList.add('done');
    else if (sn === n) step.classList.add('active');
  });
  document.querySelectorAll('.progress-line').forEach((line, i) => {
    line.classList.remove('done', 'active');
    if (i + 1 < n) line.classList.add('done');
    else if (i + 1 === n) line.classList.add('active');
  });
}

function updateSummary() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (val && val !== 'Not selected') { el.textContent = val; el.classList.add('set'); }
    else { el.textContent = 'Not selected'; el.classList.remove('set'); }
  };
  set('sumDoctorVal', booking.doctor);
  set('sumDateVal', booking.date);
  set('sumTimeVal', booking.time);
  set('sumTypeVal', booking.type);
}

// === STEP 1: DOCTOR SELECTION ===
document.querySelectorAll('.doctor-pick-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.doctor-pick-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    booking.doctor = card.dataset.doctor;
    booking.specialty = card.dataset.specialty;
    document.getElementById('toStep2').disabled = false;
    updateSummary();
  });
});

const toStep2 = document.getElementById('toStep2');
if (toStep2) toStep2.addEventListener('click', () => goToStep(2));

// Doctor search filter
const doctorSearch = document.getElementById('doctorSearch');
if (doctorSearch) {
  doctorSearch.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.doctor-pick-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// === STEP 2: DATE SELECTION ===
function buildDateStrip() {
  const strip = document.getElementById('dateStrip');
  if (!strip) return;
  strip.innerHTML = '';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const today = new Date();

  // 50% of days have availability randomly but deterministically
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const hasAvail = d.getDay() !== 0 && (i % 3 !== 2); // No Sundays, skip every 3rd
    const chip = document.createElement('button');
    chip.className = 'date-chip' + (hasAvail ? '' : ' no-avail');
    chip.disabled = !hasAvail;
    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const monthStr = months[d.getMonth()];
    chip.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="day-num">${dayNum}</span>
      <span class="text-xs" style="color:${hasAvail ? 'var(--teal)' : 'var(--text-muted)'};">${monthStr}</span>
      <span class="avail-dot"></span>
    `;
    if (hasAvail) {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        booking.date = `${dayName}, ${monthStr} ${dayNum}`;
        document.getElementById('toStep3').disabled = false;
        updateSummary();
      });
    }
    strip.appendChild(chip);
  }
}
buildDateStrip();

const backTo1 = document.getElementById('backTo1');
const toStep3 = document.getElementById('toStep3');
if (backTo1) backTo1.addEventListener('click', () => goToStep(1));
if (toStep3) toStep3.addEventListener('click', () => goToStep(3));

// === STEP 3: TIME SLOT ===
document.querySelectorAll('.timeslot.available').forEach(slot => {
  slot.addEventListener('click', () => {
    document.querySelectorAll('.timeslot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    booking.time = slot.dataset.time;
    document.getElementById('toStep4').disabled = false;
    updateSummary();
  });
});

const backTo2 = document.getElementById('backTo2');
const toStep4 = document.getElementById('toStep4');
if (backTo2) backTo2.addEventListener('click', () => goToStep(2));
if (toStep4) toStep4.addEventListener('click', () => goToStep(4));

// === STEP 4: VISIT TYPE ===
document.querySelectorAll('.visit-type-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.visit-type-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    booking.type = card.dataset.type;
    document.getElementById('toStep5').disabled = false;
    updateSummary();
  });
});

const backTo3 = document.getElementById('backTo3');
const toStep5 = document.getElementById('toStep5');
if (backTo3) backTo3.addEventListener('click', () => goToStep(3));
if (toStep5) {
  toStep5.addEventListener('click', () => {
    // Populate review
    document.getElementById('reviewDoctor').textContent = booking.doctor || '—';
    document.getElementById('reviewDateTime').textContent = (booking.date && booking.time) ? `${booking.date} · ${booking.time}` : '—';
    document.getElementById('reviewType').textContent = booking.type || '—';
    goToStep(5);
  });
}

// === STEP 5: CONFIRM ===
const backTo4 = document.getElementById('backTo4');
const confirmBooking = document.getElementById('confirmBooking');
if (backTo4) backTo4.addEventListener('click', () => goToStep(4));
if (confirmBooking) {
  confirmBooking.addEventListener('click', () => {
    // Show success
    document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
    const successStep = document.getElementById('stepSuccess');
    successStep.classList.remove('hidden');
    document.getElementById('successDoctor').textContent = booking.doctor || '—';
    document.getElementById('successDateTime').textContent = (booking.date && booking.time) ? `${booking.date} · ${booking.time}` : '—';
    document.getElementById('successType').textContent = booking.type || '—';

    // Mark all steps done
    document.querySelectorAll('.progress-step').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    document.querySelectorAll('.progress-line').forEach(l => l.classList.add('done'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Appointment confirmed! Check your email for details.');
  });
}

// Add to Calendar button
const addToCalendar = document.getElementById('addToCalendar');
if (addToCalendar) {
  addToCalendar.addEventListener('click', () => {
    showToast('Calendar invite sent to your email.');
  });
}
