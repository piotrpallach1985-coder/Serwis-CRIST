import { initFirebase, getDb, isConnected, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from './firebase-config.js';

// Application State
const state = {
    currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    payments: [],
    categories: [
        { id: 'cat-1', name: 'Zobowiązania / Czynsz', color: '#3b82f6' },
        { id: 'cat-2', name: 'Media i Telefon', color: '#10b981' },
        { id: 'cat-3', name: 'Edukacja i Dzieci', color: '#f59e0b' },
        { id: 'cat-4', name: 'Podatki i Usługi', color: '#ef4444' },
        { id: 'cat-5', name: 'Ubezpieczenia', color: '#8b5cf6' }
    ],
    templates: [
        { id: 'tpl-1', title: 'Czynsz', categoryId: 'cat-1', amount: 550.00, recurrence: 'MONTHLY', defaultDay: 1 },
        { id: 'tpl-2', title: 'Energa', categoryId: 'cat-2', amount: 250.00, recurrence: 'EVERY_2_MONTHS', defaultDay: 10 },
        { id: 'tpl-3', title: 'Chopin', categoryId: 'cat-1', amount: 124.60, recurrence: 'MONTHLY', defaultDay: 15 },
        { id: 'tpl-4', title: 'Play', categoryId: 'cat-2', amount: 180.00, recurrence: 'MONTHLY', defaultDay: 20 },
        { id: 'tpl-5', title: 'Pod Doch', categoryId: 'cat-4', amount: 300.00, recurrence: 'MONTHLY', defaultDay: 25 },
        { id: 'tpl-6', title: 'VAT', categoryId: 'cat-4', amount: 1500.00, recurrence: 'MONTHLY', defaultDay: 25 },
        { id: 'tpl-7', title: 'Ubezpieczenie zdrowotne', categoryId: 'cat-5', amount: 381.81, recurrence: 'MONTHLY', defaultDay: 20 }
    ],
    activeTab: 'payments',
    searchQuery: '',
    filterCategory: 'ALL',
    filterStatus: 'ALL'
};

// Map Recurrence Labels
const RECURRENCE_MAP = {
    'MONTHLY': 'Co miesiąc (1m)',
    'EVERY_2_MONTHS': 'Co 2 miesiące',
    'QUARTERLY': 'Co kwartał (3m)',
    'HALF_YEARLY': 'Co pół roku (6m)',
    'YEARLY': 'Co rok (12m)',
    'ONEOFF': 'Jednorazowa'
};

// Chart Instances
let pieChartInstance = null;
let barChartInstance = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    initFirebase();
    updateDbStatusUI();
    
    document.getElementById('currentMonthInput').value = state.currentMonth;
    
    await loadInitialData();
    setupEventListeners();
    renderAll();
    lucide.createIcons();
});

function updateDbStatusUI() {
    const dot = document.getElementById('dbStatusDot');
    const title = document.getElementById('dbStatusTitle');
    const desc = document.getElementById('dbStatusDesc');

    if (isConnected()) {
        dot.className = 'status-indicator online';
        title.textContent = 'Firebase Połączono';
        desc.textContent = 'Chmura w czasie rzeczywistym';
    } else {
        dot.className = 'status-indicator offline';
        title.textContent = 'Tryb Lokalny (Local)';
        desc.textContent = 'Brak konfiguracji Firebase';
    }
}

// Data Fetching / Saving Abstraction
async function loadInitialData() {
    if (isConnected()) {
        try {
            const db = getDb();
            // Fetch categories
            const catSnap = await getDocs(collection(db, 'categories'));
            if (!catSnap.empty) {
                state.categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            // Fetch templates
            const tplSnap = await getDocs(collection(db, 'templates'));
            if (!tplSnap.empty) {
                state.templates = tplSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            // Fetch payments
            const paySnap = await getDocs(collection(db, 'payments'));
            if (!paySnap.empty) {
                state.payments = paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            return;
        } catch (e) {
            console.error("Error reading Firebase:", e);
        }
    }

    // LocalStorage Fallback
    const localCat = localStorage.getItem('fincontrol_categories');
    if (localCat) state.categories = JSON.parse(localCat);

    const localTpl = localStorage.getItem('fincontrol_templates');
    if (localTpl) state.templates = JSON.parse(localTpl);

    const localPay = localStorage.getItem('fincontrol_payments');
    if (localPay) state.payments = JSON.parse(localPay);
}

async function saveData(type) {
    if (type === 'categories') {
        localStorage.setItem('fincontrol_categories', JSON.stringify(state.categories));
    } else if (type === 'templates') {
        localStorage.setItem('fincontrol_templates', JSON.stringify(state.templates));
    } else if (type === 'payments') {
        localStorage.setItem('fincontrol_payments', JSON.stringify(state.payments));
    }
}

async function dbAddDoc(collectionName, item) {
    item.id = item.id || 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    if (isConnected()) {
        // Nie blokujemy UI za pomocą 'await', wysyłamy w tle optymistycznie
        setDoc(doc(getDb(), collectionName, item.id), item).catch(e => {
            console.error("Firebase Add Error:", e);
            alert("Ostrzeżenie: Nie udało się zsynchronizować elementu z chmurą. Sprawdź reguły zapisu w Firestore.");
        });
    }
}

async function dbUpdateDoc(collectionName, id, item) {
    if (isConnected()) {
        updateDoc(doc(getDb(), collectionName, id), item).catch(e => console.error("Firebase Update Error:", e));
    }
}

async function dbDeleteDoc(collectionName, id) {
    if (isConnected()) {
        deleteDoc(doc(getDb(), collectionName, id)).catch(e => console.error("Firebase Delete Error:", e));
    }
}

// Render Functions
function renderAll() {
    renderCategoryDropdowns();
    renderPaymentsTable();
    renderMetrics();
    renderSummaryTab();
    renderCategoriesTab();
    renderTemplatesTab();
    lucide.createIcons();
}

function renderCategoryDropdowns() {
    const paymentCatSelect = document.getElementById('paymentCategory');
    const filterCatSelect = document.getElementById('filterCategorySelect');
    const templateCatSelect = document.getElementById('templateCategory');

    let options = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    paymentCatSelect.innerHTML = options;
    templateCatSelect.innerHTML = options;
    filterCatSelect.innerHTML = `<option value="ALL">Wszystkie kategorie</option>` + options;
}

function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTbody');
    const emptyState = document.getElementById('emptyPaymentsState');

    let filtered = state.payments.filter(p => p.month === state.currentMonth);

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(q));
    }

    if (state.filterCategory !== 'ALL') {
        filtered = filtered.filter(p => p.categoryId === state.filterCategory);
    }

    if (state.filterStatus === 'PAID') {
        filtered = filtered.filter(p => p.paid === true);
    } else if (state.filterStatus === 'PENDING') {
        filtered = filtered.filter(p => p.paid === false);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(p => {
        const cat = state.categories.find(c => c.id === p.categoryId) || { name: 'Ogólne', color: '#64748b' };
        return `
            <tr class="${p.paid ? 'paid-row' : ''}">
                <td class="text-center">
                    <input type="checkbox" class="status-checkbox" data-id="${p.id}" ${p.paid ? 'checked' : ''}>
                </td>
                <td>
                    <strong class="title-text">${p.title}</strong>
                </td>
                <td>
                    <span class="badge-category" style="background-color: ${cat.color}">${cat.name}</span>
                </td>
                <td>
                    <span class="badge-recurrence">${RECURRENCE_MAP[p.recurrence] || p.recurrence}</span>
                </td>
                <td>${p.dueDate || '-'}</td>
                <td class="text-right"><strong>${p.amount.toFixed(2)} zł</strong></td>
                <td class="text-center">
                    <button class="btn-icon edit-payment-btn" data-id="${p.id}"><i data-lucide="edit-3"></i></button>
                    <button class="btn-icon delete-payment-btn" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderMetrics() {
    const monthPayments = state.payments.filter(p => p.month === state.currentMonth);
    const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const paid = monthPayments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
    const pending = total - paid;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;

    document.getElementById('totalAmount').textContent = `${total.toFixed(2)} zł`;
    document.getElementById('paidAmount').textContent = `${paid.toFixed(2)} zł`;
    document.getElementById('pendingAmount').textContent = `${pending.toFixed(2)} zł`;
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
}

function renderSummaryTab() {
    const monthPayments = state.payments.filter(p => p.month === state.currentMonth);
    const totalMonthSum = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Grouping by category
    const catMap = {};
    state.categories.forEach(c => {
        catMap[c.id] = { category: c, total: 0, paid: 0, pending: 0, count: 0 };
    });

    monthPayments.forEach(p => {
        if (!catMap[p.categoryId]) {
            catMap[p.categoryId] = { category: { name: 'Inne', color: '#64748b' }, total: 0, paid: 0, pending: 0, count: 0 };
        }
        catMap[p.categoryId].total += p.amount;
        catMap[p.categoryId].count += 1;
        if (p.paid) catMap[p.categoryId].paid += p.amount;
        else catMap[p.categoryId].pending += p.amount;
    });

    // Summary Table Body
    const tbody = document.getElementById('categorySummaryTbody');
    const catList = Object.values(catMap).filter(item => item.count > 0);

    if (catList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Brak danych dla wybranego miesiąca</td></tr>`;
    } else {
        tbody.innerHTML = catList.map(item => {
            const share = totalMonthSum > 0 ? ((item.total / totalMonthSum) * 100).toFixed(1) : 0;
            return `
                <tr>
                    <td>
                        <span class="badge-category" style="background-color: ${item.category.color}">
                            ${item.category.name}
                        </span>
                    </td>
                    <td class="text-center">${item.count}</td>
                    <td class="text-right"><strong>${item.total.toFixed(2)} zł</strong></td>
                    <td class="text-right" style="color: var(--success);">${item.paid.toFixed(2)} zł</td>
                    <td class="text-right" style="color: var(--warning);">${item.pending.toFixed(2)} zł</td>
                    <td class="text-center"><strong>${share}%</strong></td>
                </tr>
            `;
        }).join('');
    }

    // Pie Chart
    const pieCtx = document.getElementById('categoryPieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    const chartLabels = catList.map(i => i.category.name);
    const chartData = catList.map(i => i.total);
    const chartColors = catList.map(i => i.category.color);

    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: chartLabels.length ? chartLabels : ['Brak danych'],
            datasets: [{
                data: chartData.length ? chartData : [1],
                backgroundColor: chartColors.length ? chartColors : ['#e2e8f0']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Bar Chart (Monthly Trends for top items like Energa, Play, VAT, Pod Doch)
    const barCtx = document.getElementById('monthlyBarChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    // Months: Jan, Feb, Mar 2026
    const months = ['2026-01', '2026-02', '2026-03'];
    const trackTitles = ['Energa', 'Play', 'VAT', 'Pod Doch'];
    
    const datasets = trackTitles.map((title, idx) => {
        const colors = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
        const data = months.map(m => {
            const item = state.payments.find(p => p.month === m && p.title.toLowerCase().includes(title.toLowerCase()));
            return item ? item.amount : 0;
        });
        return {
            label: title,
            data: data,
            backgroundColor: colors[idx % colors.length]
        };
    });

    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Styczeń 2026', 'Luty 2026', 'Marzec 2026'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderCategoriesTab() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = state.categories.map(c => `
        <div class="category-card-item">
            <div class="category-card-info">
                <div class="color-dot" style="background-color: ${c.color}"></div>
                <strong>${c.name}</strong>
            </div>
            <div>
                <button class="btn-icon edit-cat-btn" data-id="${c.id}"><i data-lucide="edit-3"></i></button>
                <button class="btn-icon delete-cat-btn" data-id="${c.id}"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join('');
}

function renderTemplatesTab() {
    const tbody = document.getElementById('templatesTbody');
    if (state.templates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Brak szablonów opłat cyklicznych.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.templates.map(t => {
        const cat = state.categories.find(c => c.id === t.categoryId) || { name: 'Ogólne', color: '#64748b' };
        return `
            <tr>
                <td><strong>${t.title}</strong></td>
                <td><span class="badge-category" style="background-color: ${cat.color}">${cat.name}</span></td>
                <td><span class="badge-recurrence">${RECURRENCE_MAP[t.recurrence] || t.recurrence}</span></td>
                <td class="text-center">${t.defaultDay}. dzień miesiąca</td>
                <td class="text-right"><strong>${t.amount.toFixed(2)} zł</strong></td>
                <td class="text-center">
                    <button class="btn-icon edit-tpl-btn" data-id="${t.id}"><i data-lucide="edit-3"></i></button>
                    <button class="btn-icon delete-tpl-btn" data-id="${t.id}"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = btn.dataset.tab;
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            // Header titles update
            const titles = {
                payments: ['Opłaty Miesięczne', 'Zarządzaj i kontroluj swoje regularne rachunki'],
                summary: ['Podsumowanie i Analityka', 'Przegląd kosztów, wykresy i analiza grupowa'],
                categories: ['Kategorie i Grupy', 'Organizuj opłaty w spersonalizowane grupy'],
                templates: ['Opłaty Cykliczne', 'Definiuj cykle płatności i łatwo generuj nowe miesiące'],
                settings: ['Ustawienia Firebase', 'Połącz aplikację z własną bazą Firestore']
            };
            document.getElementById('pageTitle').textContent = titles[targetTab][0];
            document.getElementById('pageSubtitle').textContent = titles[targetTab][1];

            state.activeTab = targetTab;
            renderAll();
        });
    });

    // Month Selector
    const monthInput = document.getElementById('currentMonthInput');
    monthInput.addEventListener('change', (e) => {
        state.currentMonth = e.target.value;
        renderAll();
    });

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        let [y, m] = state.currentMonth.split('-').map(Number);
        m -= 1;
        if (m < 1) { m = 12; y -= 1; }
        state.currentMonth = `${y}-${String(m).padStart(2, '0')}`;
        monthInput.value = state.currentMonth;
        renderAll();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        let [y, m] = state.currentMonth.split('-').map(Number);
        m += 1;
        if (m > 12) { m = 1; y += 1; }
        state.currentMonth = `${y}-${String(m).padStart(2, '0')}`;
        monthInput.value = state.currentMonth;
        renderAll();
    });

    // Filters
    document.getElementById('searchPaymentInput').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderPaymentsTable();
    });

    document.getElementById('filterCategorySelect').addEventListener('change', (e) => {
        state.filterCategory = e.target.value;
        renderPaymentsTable();
    });

    document.getElementById('filterStatusSelect').addEventListener('change', (e) => {
        state.filterStatus = e.target.value;
        renderPaymentsTable();
    });

    // Toggle Payment Paid Status (Table Checkbox)
    document.getElementById('paymentsTbody').addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-checkbox')) {
            const id = e.target.dataset.id;
            const pay = state.payments.find(p => p.id === id);
            if (pay) {
                pay.paid = e.target.checked;
                await dbUpdateDoc('payments', id, { paid: pay.paid });
                await saveData('payments');
                renderAll();
            }
        }
    });

    // Seed Data Button functionality removed

    // Generate Month from Templates
    document.getElementById('generateMonthBtn').addEventListener('click', async () => {
        const existingTitles = state.payments.filter(p => p.month === state.currentMonth).map(p => p.title);
        let addedCount = 0;

        for (const tpl of state.templates) {
            if (!existingTitles.includes(tpl.title)) {
                const dayStr = String(tpl.defaultDay).padStart(2, '0');
                const newPay = {
                    title: tpl.title,
                    categoryId: tpl.categoryId,
                    amount: tpl.amount,
                    month: state.currentMonth,
                    paid: false,
                    recurrence: tpl.recurrence,
                    dueDate: `${state.currentMonth}-${dayStr}`
                };
                await dbAddDoc('payments', newPay);
                state.payments.push(newPay);
                addedCount++;
            }
        }
        await saveData('payments');
        renderAll();
        alert(`Wygenerowano ${addedCount} opłat z szablonów dla miesiąca ${state.currentMonth}.`);
    });

    // Payment Modal Controls
    const paymentModal = document.getElementById('paymentModal');
    const openPaymentModal = () => {
        document.getElementById('paymentForm').reset();
        document.getElementById('paymentId').value = '';
        document.getElementById('paymentModalTitle').textContent = 'Dodaj nową opłatę';
        document.getElementById('paymentDueDate').value = `${state.currentMonth}-10`;
        paymentModal.classList.remove('hidden');
    };

    document.getElementById('openAddPaymentModalBtn').addEventListener('click', openPaymentModal);
    document.getElementById('closePaymentModalBtn').addEventListener('click', () => paymentModal.classList.add('hidden'));
    document.getElementById('cancelPaymentModalBtn').addEventListener('click', () => paymentModal.classList.add('hidden'));

    // Save Payment Form Submit
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('paymentId').value;
        const title = document.getElementById('paymentTitle').value;
        const categoryId = document.getElementById('paymentCategory').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
        const dueDate = document.getElementById('paymentDueDate').value;
        const recurrence = document.getElementById('paymentRecurrence').value;
        const paid = document.getElementById('paymentPaidStatus').checked;

        if (id) {
            // Edit
            const item = state.payments.find(p => p.id === id);
            if (item) {
                item.title = title;
                item.categoryId = categoryId;
                item.amount = amount;
                item.dueDate = dueDate;
                item.recurrence = recurrence;
                item.paid = paid;
                await dbUpdateDoc('payments', id, item);
            }
        } else {
            // Add New
            const newItem = {
                title, categoryId, amount, dueDate, recurrence, paid,
                month: state.currentMonth
            };
            await dbAddDoc('payments', newItem);
            state.payments.push(newItem);
        }

        await saveData('payments');
        paymentModal.classList.add('hidden');
        renderAll();
    });

    // Edit/Delete Payment Table Delegation
    document.getElementById('paymentsTbody').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-payment-btn');
        const deleteBtn = e.target.closest('.delete-payment-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const p = state.payments.find(item => item.id === id);
            if (p) {
                document.getElementById('paymentId').value = p.id;
                document.getElementById('paymentTitle').value = p.title;
                document.getElementById('paymentCategory').value = p.categoryId;
                document.getElementById('paymentAmount').value = p.amount;
                document.getElementById('paymentDueDate').value = p.dueDate || '';
                document.getElementById('paymentRecurrence').value = p.recurrence || 'MONTHLY';
                document.getElementById('paymentPaidStatus').checked = p.paid;

                document.getElementById('paymentModalTitle').textContent = 'Edytuj Opłatę';
                paymentModal.classList.remove('hidden');
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm("Czy na pewno chcesz usunąć tę opłatę?")) {
                await dbDeleteDoc('payments', id);
                state.payments = state.payments.filter(p => p.id !== id);
                await saveData('payments');
                renderAll();
            }
        }
    });

    // Categories Form Handler
    document.getElementById('categoryColor').addEventListener('input', (e) => {
        document.getElementById('colorHexText').textContent = e.target.value;
    });

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value;
        const color = document.getElementById('categoryColor').value;

        if (id) {
            const cat = state.categories.find(c => c.id === id);
            if (cat) {
                cat.name = name;
                cat.color = color;
                await dbUpdateDoc('categories', id, cat);
            }
        } else {
            const newCat = { name, color };
            await dbAddDoc('categories', newCat);
            state.categories.push(newCat);
        }

        await saveData('categories');
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        renderAll();
    });

    document.getElementById('categoryGrid').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-cat-btn');
        const deleteBtn = e.target.closest('.delete-cat-btn');

        if (editBtn) {
            const cat = state.categories.find(c => c.id === editBtn.dataset.id);
            if (cat) {
                document.getElementById('categoryId').value = cat.id;
                document.getElementById('categoryName').value = cat.name;
                document.getElementById('categoryColor').value = cat.color;
                document.getElementById('colorHexText').textContent = cat.color;
                document.getElementById('cancelCategoryBtn').classList.remove('hidden');
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm("Czy na pewno usunąć kategorię?")) {
                await dbDeleteDoc('categories', id);
                state.categories = state.categories.filter(c => c.id !== id);
                await saveData('categories');
                renderAll();
            }
        }
    });

    document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('cancelCategoryBtn').classList.add('hidden');
    });

    // Template Modal Controls
    const templateModal = document.getElementById('templateModal');
    document.getElementById('openAddTemplateModalBtn').addEventListener('click', () => {
        document.getElementById('templateForm').reset();
        document.getElementById('templateId').value = '';
        templateModal.classList.remove('hidden');
    });
    document.getElementById('closeTemplateModalBtn').addEventListener('click', () => templateModal.classList.add('hidden'));
    document.getElementById('cancelTemplateModalBtn').addEventListener('click', () => templateModal.classList.add('hidden'));

    document.getElementById('templateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('templateId').value;
        const title = document.getElementById('templateTitle').value;
        const categoryId = document.getElementById('templateCategory').value;
        const amount = parseFloat(document.getElementById('templateAmount').value) || 0;
        const recurrence = document.getElementById('templateRecurrence').value;
        const defaultDay = parseInt(document.getElementById('templateDay').value) || 10;

        if (id) {
            const tpl = state.templates.find(t => t.id === id);
            if (tpl) {
                tpl.title = title;
                tpl.categoryId = categoryId;
                tpl.amount = amount;
                tpl.recurrence = recurrence;
                tpl.defaultDay = defaultDay;
                await dbUpdateDoc('templates', id, tpl);
            }
        } else {
            const newTpl = { title, categoryId, amount, recurrence, defaultDay };
            await dbAddDoc('templates', newTpl);
            state.templates.push(newTpl);
        }

        await saveData('templates');
        templateModal.classList.add('hidden');
        renderAll();
    });

    document.getElementById('templatesTbody').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-tpl-btn');
        const deleteBtn = e.target.closest('.delete-tpl-btn');

        if (editBtn) {
            const tpl = state.templates.find(t => t.id === editBtn.dataset.id);
            if (tpl) {
                document.getElementById('templateId').value = tpl.id;
                document.getElementById('templateTitle').value = tpl.title;
                document.getElementById('templateCategory').value = tpl.categoryId;
                document.getElementById('templateAmount').value = tpl.amount;
                document.getElementById('templateRecurrence').value = tpl.recurrence;
                document.getElementById('templateDay').value = tpl.defaultDay;
                templateModal.classList.remove('hidden');
            }
        }

        if (deleteBtn) {
            if (confirm("Usunąć szablon opłaty?")) {
                const id = deleteBtn.dataset.id;
                await dbDeleteDoc('templates', id);
                state.templates = state.templates.filter(t => t.id !== id);
                await saveData('templates');
                renderAll();
            }
        }
    });

    // Firebase Configuration Form
    document.getElementById('firebaseConfigForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const configText = document.getElementById('firebaseConfigText').value.trim();

        try {
            let jsonStr = configText;
            // Szukamy obiektu pomiędzy znakami { i }
            const match = configText.match(/\{[\s\S]*\}/);
            if (match) {
                jsonStr = match[0];
            }
            
            // Konwersja stringa (kodu) do obiektu JS. Nowa Funkcja to bezpieczniejsza alternatywa dla eval().
            const config = new Function('return ' + jsonStr)();
            
            if (!config || !config.apiKey || !config.projectId) {
                throw new Error("Brak wymaganych pól w konfiguracji (np. apiKey, projectId).");
            }

            localStorage.setItem('fincontrol_firebase_config', JSON.stringify(config));
            alert("Konfiguracja Firebase zapisana! Strona zostanie odświeżona.");
            window.location.reload();
        } catch (error) {
            alert("Błąd podczas przetwarzania wklejonego kodu. Upewnij się, że wkleiłeś poprawny obiekt konfiguracji.\n\nSzczegóły: " + error.message);
        }
    });

    document.getElementById('disconnectDbBtn').addEventListener('click', () => {
        if (confirm("Czy na pewno chcesz odłączyć Firebase i używać trybu lokalnego?")) {
            localStorage.removeItem('fincontrol_firebase_config');
            window.location.reload();
        }
    });
}

