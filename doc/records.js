/* ============================================================
   RECORDS PAGE — Filter & Search logic
   ============================================================ */

'use strict';

const recordsList = document.getElementById('recordsList');
const noResults = document.getElementById('noResults');
const recordSearch = document.getElementById('recordSearch');
const filterChips = document.querySelectorAll('.filter-chip');
const sortBy = document.getElementById('sortBy');

let activeFilter = 'all';
let searchQuery = '';
let sortOrder = 'newest';

function filterRecords() {
  const items = recordsList.querySelectorAll('.record-item');
  let visible = 0;

  items.forEach(item => {
    const type = item.dataset.type || '';
    const text = item.textContent.toLowerCase();
    const matchesFilter = activeFilter === 'all' || type === activeFilter;
    const matchesSearch = searchQuery === '' || text.includes(searchQuery);

    if (matchesFilter && matchesSearch) {
      item.style.display = '';
      visible++;
    } else {
      item.style.display = 'none';
    }
  });

  if (noResults) {
    noResults.classList.toggle('hidden', visible > 0);
  }

  // Sort visible items
  sortRecords();
}

function sortRecords() {
  const items = Array.from(recordsList.querySelectorAll('.record-item:not([style*="display: none"])'));
  const parent = recordsList;

  items.sort((a, b) => {
    const dateA = new Date(a.dataset.date || '');
    const dateB = new Date(b.dataset.date || '');
    if (sortOrder === 'newest') return dateB - dateA;
    if (sortOrder === 'oldest') return dateA - dateB;
    if (sortOrder === 'type') return (a.dataset.type || '').localeCompare(b.dataset.type || '');
    return 0;
  });

  items.forEach(item => parent.appendChild(item));
}

// Filter chips
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    filterRecords();
  });
});

// Search input
if (recordSearch) {
  recordSearch.addEventListener('input', function () {
    searchQuery = this.value.toLowerCase().trim();
    filterRecords();
  });
}

// Sort select
if (sortBy) {
  sortBy.addEventListener('change', function () {
    sortOrder = this.value;
    sortRecords();
  });
}
