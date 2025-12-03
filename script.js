// frontend/script.js

// Placeholder URL - This MUST be updated after Render deployment!
const API_URL = 'https://roadways-ledger-backend.onrender.com'; 

let state = {
    data: [],
    editingId: null,
};

const $ = (selector) => document.querySelector(selector);

// --- DOM ELEMENT REFERENCES ---
const biltyForm = $('#bilty-form');
const biltyTableBody = $('#bilty-table-body');
const formTitle = $('#form-title');
const saveBtn = $('#save-btn');
const saveBtnText = $('#save-btn-text');
const cancelBtn = $('#cancel-btn');
const loading = $('#loading');
const noDataMsg = $('#no-data-msg');
const exportBtn = $('#export-btn');
const formError = $('#form-error');

const toast = $('#toast');
const toastMessage = $('#toast-message');

const FIELD_NAMES = [
    'bilty_sl_no', 'lr_no', 'bill_no', 'bill_date', 'truck_no', 'destination',
    'weight', 'freight', 'diesel', 'total_adv', 'balance', 'pump_name', 
    'payment_officer', 'damage_if_any', 'margin'
];

// --- CORE UTILITIES ---

function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden', 'bg-green-600', 'bg-red-600');
    toast.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function formatCurrency(value) {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
}

// --- DATA FETCHING & RENDERING ---

async function loadData() {
    loading.classList.remove('hidden');
    noDataMsg.classList.add('hidden');
    try {
        const response = await fetch(`${API_URL}/api/bilty`);
        if (!response.ok) throw new Error('Failed to fetch data');
        state.data = await response.json();
        renderTable();
    } catch (err) {
        console.error('Data load error:', err);
        showToast('Error loading data. Check backend URL.', true);
    } finally {
        loading.classList.add('hidden');
    }
}

function renderTable() {
    biltyTableBody.innerHTML = '';
    if (state.data.length === 0) {
        noDataMsg.classList.remove('hidden');
        return;
    }
    noDataMsg.classList.add('hidden');

    state.data.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-100 divide-x divide-gray-200';
        
        const displayDate = item.bill_date ? new Date(item.bill_date).toLocaleDateString() : 'N/A';

        tr.innerHTML = `
            <td class="px-3 py-3 whitespace-nowrap text-sm font-bold text-roadways">${item.bilty_sl_no}</td>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                <span class="block">${item.lr_no || 'N/A'}</span>
                <span class="block text-xs text-gray-400">${item.bill_no || ''}</span>
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                ${item.truck_no || 'N/A'}
                <span class="block text-xs text-gray-500">${item.destination || ''}</span>
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-weight">${parseFloat(item.weight).toFixed(3) || '0.000'} MT</td>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-freight">₹ ${formatCurrency(item.freight)}</td>
            <td class="px-3 py-3 whitespace-nowrap text-sm">
                <span class="block font-semibold text-advance-balance">Adv: ₹ ${formatCurrency(item.total_adv)}</span>
                <span class="block text-xs text-advance-balance">Bal: ₹ ${formatCurrency(item.balance)}</span>
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                ${parseFloat(item.diesel).toFixed(2) || '0.00'} L
                <span class="block text-xs text-gray-500">${item.pump_name || ''}</span>
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-margin">₹ ${formatCurrency(item.margin)}</td>
            <td class="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                <button class="edit-btn text-roadways hover:text-blue-900" data-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn text-red-600 hover:text-red-900" data-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        biltyTableBody.appendChild(tr);
    });
    attachButtonListeners();
}

// --- FORM & CRUD LOGIC ---

function attachButtonListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleEdit(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleDelete(parseInt(e.currentTarget.dataset.id)));
    });
}

function handleEdit(id) {
    const entry = state.data.find(item => item.id === id);
    if (!entry) return;

    state.editingId = id;
    formTitle.textContent = `Edit Record #${entry.bilty_sl_no}`;
    saveBtnText.textContent = 'Update Record';
    cancelBtn.classList.remove('hidden');

    // Populate form fields
    FIELD_NAMES.forEach(field => {
        const inputEl = $(`#${field}`);
        let value = entry[field];
        
        if (inputEl) {
            if (field === 'bill_date' && value) {
                // Format full date string to YYYY-MM-DD for input type="date"
                inputEl.value = value.split('T')[0]; 
            } else if (inputEl.type === 'number' && value !== null) {
                // Ensure number fields show raw value from DB
                inputEl.value = parseFloat(value).toString();
            } else {
                inputEl.value = value || '';
            }
        }
    });
    // Disable Bilty SL No. field when editing
    $('#bilty_sl_no').disabled = true;
}

async function handleDelete(id) {
    if (!confirm('Are you sure you want to permanently delete this record?')) return;
    try {
        const response = await fetch(`${API_URL}/api/bilty/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete record');
        
        state.data = state.data.filter(item => item.id !== id);
        renderTable();
        showToast('Record deleted successfully.', true);
        
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Error deleting record.', true);
    }
}

function resetForm() {
    biltyForm.reset();
    state.editingId = null;
    formTitle.textContent = 'New Dispatch Record';
    saveBtnText.textContent = 'Save New Record';
    cancelBtn.classList.add('hidden');
    formError.classList.add('hidden');
    // Re-enable Bilty SL No. field
    $('#bilty_sl_no').disabled = false;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    saveBtn.disabled = true;
    formError.classList.add('hidden');

    const formData = {};
    FIELD_NAMES.forEach(field => {
        formData[field] = $(`#${field}`).value;
    });

    const isEditing = !!state.editingId;
    const url = isEditing ? `${API_URL}/api/bilty/${state.editingId}` : `${API_URL}/api/bilty`;
    const method = isEditing ? 'PUT' : 'POST';
    
    // Disable Bilty SL No. during submission
    if(isEditing) {
         $('#bilty_sl_no').disabled = true;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to save entry');
        }
        
        const savedEntry = await response.json();
        
        if (isEditing) {
            const index = state.data.findIndex(item => item.id === state.editingId);
            if (index !== -1) {
                state.data[index] = savedEntry;
            }
        } else {
            state.data.unshift(savedEntry);
        }
        
        resetForm();
        renderTable();
        showToast(isEditing ? 'Record updated!' : 'Record saved!');
        
    } catch (err) {
        console.error('Save error:', err);
        formError.textContent = `Error: ${err.message}`;
        formError.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
         // Re-enable Bilty SL No. regardless of success/fail (for next entry)
         $('#bilty_sl_no').disabled = false; 
    }
}

// --- EXPORT LOGIC ---
function exportToCSV() {
    if (state.data.length === 0) {
        showToast('No data to export.', true);
        return;
    }

    const headers = ['ID', 'BILTY SL NO.', 'LR NO.', 'BILL NO', 'BILL DATE', 'TRUCK NO', 'DESTINATION', 'Weight (MT)', 'Freight (₹)', 'DIESEL (L)', 'TOTAL ADV (₹)', 'BALANCE (₹)', 'PUMP NAME', 'Payment Officer', 'Damage If Any', 'MARGIN (₹)', 'Date Added'];
    
    const rows = state.data.map(item => 
        [
            `"${item.id}"`,
            `"${item.bilty_sl_no}"`,
            `"${item.lr_no || ''}"`,
            `"${item.bill_no || ''}"`,
            `"${item.bill_date ? new Date(item.bill_date).toLocaleDateString() : ''}"`,
            `"${item.truck_no || ''}"`,
            `"${item.destination || ''}"`,
            `"${parseFloat(item.weight).toFixed(3) || '0.000'}"`,
            `"₹ ${formatCurrency(item.freight)}"`,
            `"${parseFloat(item.diesel).toFixed(2) || '0.00'}"`,
            `"₹ ${formatCurrency(item.total_adv)}"`,
            `"₹ ${formatCurrency(item.balance)}"`,
            `"${item.pump_name || ''}"`,
            `"${item.payment_officer || ''}"`,
            `"${item.damage_if_any || ''}"`,
            `"₹ ${formatCurrency(item.margin)}"`,
            `"${item.date_added ? new Date(item.date_added).toLocaleDateString() : ''}"`
        ].join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'North_East_Roadways_Ledger.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data exported successfully!');
}