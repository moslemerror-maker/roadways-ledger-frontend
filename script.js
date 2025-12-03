// Corrected and Consolidated Global Declarations for script.js

const API_URL = 'https://roadways-ledger-backend.onrender.com'; // CHECK URL after deployment!

let state = {
    data: [],
    editingId: null,
    currentUser: null, // Ensure this property is included for login state
};

// Define the DOM selector helper once
const $ = (selector) => document.querySelector(selector);

// --- MAIN APPLICATION ELEMENTS ---
const biltyForm = $('#bilty-form');
const biltyTableBody = $('#bilty-table-body');
const formTitle = $('#form-title');
const saveBtn = $('#save-btn');
const saveBtnText = $('#save-btn-text');
const cancelBtn = $('#cancel-btn');
const loading = $('#loading'); // Defined ONLY ONCE
const noDataMsg = $('#no-data-msg');
const exportBtn = $('#export-btn');
const formError = $('#form-error');

// --- TOAST/FEEDBACK ELEMENTS ---
const toast = $('#toast');
const toastMessage = $('#toast-message');

// --- AUTHENTICATION ELEMENTS ---
const loginView = $('#login-view');
const loginForm = $('#login-form'); // Defined ONLY ONCE
const loginError = $('#login-error');
const mainAppContent = $('#main-app-content');
const loginButtonText = $('#login-button-text');
const logoutBtn = $('#logout-btn'); 
const createUserForm = $('#create-user-form');
const userCreationError = $('#user-creation-error');
const cancelCreateUserBtn = $('#cancel-create-user');

// --- FIELD NAMES (Required for forms/exports) ---
const FIELD_NAMES = [
    'bilty_sl_no', 'lr_no', 'bill_no', 'bill_date', 'truck_no', 'destination',
    'weight', 'freight', 'diesel', 'total_adv', 'balance', 'pump_name', 
    'payment_officer', 'damage_if_any', 'margin'
];

// All subsequent code in script.js (functions, listeners) should follow these declarations.



function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden', 'bg-green-600', 'bg-red-600');
    toast.classList.add(isError ? 'bg-red-600' : 'bg-green-600');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}


function renderUI() {
    if (state.currentUser) {
        // This runs only AFTER login
        mainAppContent.classList.remove('hidden');
        loadData(); // THIS IS CORRECT HERE
        showToast(`Welcome, ${state.currentUser.username}!`);
    } else {
        // This runs UNCONDITIONALLY on page load if no session exists
        loginView.classList.remove('hidden');
        
        
    }
}

// INSIDE frontend/script.js

async function handleLogin(e) {
    e.preventDefault(); 
    loginError.classList.add('hidden');
    loginButtonText.textContent = 'Logging In...';

    const username = $('#username').value;
    const password = $('#password').value;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        // --- MODIFIED ERROR HANDLING BLOCK ---
        if (response.ok) {
            // SUCCESS
            const user = await response.json();
            state.currentUser = user;
                        
            renderUI();

        } else {
            // FAILURE (401, 404, 500, etc.)
            let errorMessage = 'Login failed. Check server logs.';
            try {
                // Try to read the error message from the JSON body
                const err = await response.json(); 
                errorMessage = err.error || `Error ${response.status}: Failed to process login.`;
            } catch (readError) {
                // If the response is not valid JSON (e.g., plain text 500 error)
                errorMessage = `Server Error (${response.status}). Check server logs for details.`;
            }
            
            loginError.textContent = errorMessage;
            loginError.classList.remove('hidden');
        }
        // --- END MODIFIED BLOCK ---
        
    } catch (err) {
        console.error('Network error during login:', err);
        loginError.textContent = 'Cannot connect to server. Please check your API URL.';
        loginError.classList.remove('hidden');
    } finally {
        loginButtonText.textContent = 'Log In';
    }
}

function handleLogout() {
    state.currentUser = null;
    
    state.data = []; 
    renderUI();
    showToast('Logged out successfully.');
}

async function handleCreateUserSubmit(e) {
    e.preventDefault();
    userCreationError.classList.add('hidden');

    const username = $('#new-username').value;
    const password = $('#new-password').value;

    try {
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            showToast('User created successfully! You can now log in.', false);
            createUserModal.classList.add('hidden');
            createUserForm.reset();
        } else {
            const err = await response.json();
            userCreationError.textContent = err.error || 'Failed to create user.';
            userCreationError.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Creation error:', err);
        userCreationError.textContent = 'Error connecting to server for user creation.';
        userCreationError.classList.remove('hidden');
    }
}



biltyForm.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', resetForm);
exportBtn.addEventListener('click', exportToCSV);


loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout); 
cancelCreateUserBtn.addEventListener('click', () => createUserModal.classList.add('hidden'));
createUserForm.addEventListener('submit', handleCreateUserSubmit);

function formatCurrency(value) {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
}



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

    
    FIELD_NAMES.forEach(field => {
        const inputEl = $(`#${field}`);
        let value = entry[field];
        
        if (inputEl) {
            if (field === 'bill_date' && value) {
                
                inputEl.value = value.split('T')[0]; 
            } else if (inputEl.type === 'number' && value !== null) {
                
                inputEl.value = parseFloat(value).toString();
            } else {
                inputEl.value = value || '';
            }
        }
    });
    
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
         
         $('#bilty_sl_no').disabled = false; 
    }
}


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
        
        // Freight (₹) - **REMOVE FORMATTING/SYMBOL**
            `"${parseFloat(item.freight) || 0}"`, // Export raw number (or 0 if null)
        
        // Diesel (L) - Keep as fixed(2)
            `"${parseFloat(item.diesel).toFixed(2) || '0.00'}"`,
        
        // Total Adv (₹) - **REMOVE FORMATTING/SYMBOL**
            `"${parseFloat(item.total_adv) || 0}"`, // Export raw number (or 0 if null)
        
        // Balance (₹) - **REMOVE FORMATTING/SYMBOL**
            `"${parseFloat(item.balance) || 0}"`, // Export raw number (or 0 if null)
        
        // Pump Name, Payment Officer, Damage If Any
            `"${item.pump_name || ''}"`,
            `"${item.payment_officer || ''}"`,
            `"${item.damage_if_any || ''}"`,
        
        // Margin (₹) - **REMOVE FORMATTING/SYMBOL**
            `"${parseFloat(item.margin) || 0}"`, // Export raw number (or 0 if null)
        
        // Date Added
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