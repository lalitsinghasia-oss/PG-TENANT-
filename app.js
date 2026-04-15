// Data
let tenants = [];
let currentEditId = null;
let currentPaymentData = null;

// Months data
const months = [];
const currentDate = new Date();
for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    months.unshift({ key: monthKey, name: monthName });
}

// Initialize sample data
function initSampleData() {
    if (localStorage.getItem('pgData')) {
        tenants = JSON.parse(localStorage.getItem('pgData'));
    } else {
        tenants = [
            {
                id: 1,
                name: "Rahul Sharma",
                room: "201",
                mobile: "9876543210",
                rent: 8000,
                deposit: 16000,
                joinDate: "2024-01-15",
                status: "active",
                payments: {}
            },
            {
                id: 2,
                name: "Priya Patel",
                room: "105",
                mobile: "9876543211",
                rent: 7500,
                deposit: 15000,
                joinDate: "2024-02-01",
                status: "active",
                payments: {}
            },
            {
                id: 3,
                name: "Amit Kumar",
                room: "302",
                mobile: "9876543212",
                rent: 9000,
                deposit: 18000,
                joinDate: "2024-01-10",
                status: "active",
                payments: {}
            }
        ];
        
        // Initialize payments for all tenants
        tenants.forEach(tenant => {
            months.forEach(month => {
                if (!tenant.payments[month.key]) {
                    tenant.payments[month.key] = Math.random() > 0.3 ? 'paid' : 'pending';
                }
            });
        });
        
        saveData();
    }
}

// Save to localStorage
function saveData() {
    localStorage.setItem('pgData', JSON.stringify(tenants));
}

// Get current month key
function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Render Dashboard
function renderDashboard() {
    const activeTenants = tenants.filter(t => t.status === 'active');
    const totalTenants = activeTenants.length;
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + t.rent, 0);
    
    const currentMonth = getCurrentMonthKey();
    const pendingCount = activeTenants.filter(t => t.payments[currentMonth] === 'pending').length;
    const paidCount = activeTenants.filter(t => t.payments[currentMonth] === 'paid').length;
    
    document.getElementById('totalTenants').textContent = totalTenants;
    document.getElementById('monthlyRevenue').textContent = `₹${monthlyRevenue.toLocaleString('en-IN')}`;
    document.getElementById('pendingPayments').textContent = pendingCount;
    document.getElementById('paidThisMonth').textContent = paidCount;
    
    // Recent tenants
    const recentHtml = tenants.slice(0, 5).map(tenant => `
        <tr>
            <td><strong>${tenant.name}</strong></td>
            <td>${tenant.room}</td>
            <td>${tenant.mobile}</td>
            <td><span class="badge ${tenant.status === 'active' ? 'badge-active' : 'badge-inactive'}">${tenant.status === 'active' ? 'Active' : 'Inactive'}</span></td>
        </tr>
    `).join('');
    document.getElementById('recentTenants').innerHTML = recentHtml;
}

// Render Tenants
function renderTenants() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    let filtered = tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchTerm) || 
                             tenant.room.includes(searchTerm) || 
                             tenant.mobile.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    const html = filtered.map(tenant => `
        <tr>
            <td>${tenant.id}</td>
            <td><strong>${tenant.name}</strong></td>
            <td>${tenant.room}</td>
            <td>${tenant.mobile}</td>
            <td>₹${tenant.rent.toLocaleString('en-IN')}</td>
            <td>${formatDate(tenant.joinDate)}</td>
            <td><span class="badge ${tenant.status === 'active' ? 'badge-active' : 'badge-inactive'}">${tenant.status === 'active' ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="action-edit" onclick="editTenant(${tenant.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-delete" onclick="deleteTenant(${tenant.id})"><i class="fas fa-trash"></i> Delete</button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('tenantsTable').innerHTML = html || '<tr><td colspan="8" style="text-align:center;">No tenants found</td></tr>';
}

// Render Payments
function renderPayments() {
    const monthFilter = document.getElementById('monthFilter')?.value || getCurrentMonthKey();
    const paymentFilter = document.getElementById('paymentFilter')?.value || 'all';
    const monthName = months.find(m => m.key === monthFilter)?.name || monthFilter;
    
    const activeTenants = tenants.filter(t => t.status === 'active');
    
    let filtered = activeTenants.filter(tenant => {
        const paymentStatus = tenant.payments[monthFilter] || 'pending';
        return paymentFilter === 'all' || paymentStatus === paymentFilter;
    });
    
    const html = filtered.map(tenant => {
        const paymentStatus = tenant.payments[monthFilter] || 'pending';
        return `
            <tr>
                <td><strong>${tenant.name}</strong></td>
                <td>${tenant.room}</td>
                <td>${monthName}</td>
                <td>₹${tenant.rent.toLocaleString('en-IN')}</td>
                <td><span class="badge ${paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}">${paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}</span></td>
                <td>
                    <button class="action-pay" onclick="openPaymentModal(${tenant.id}, '${monthFilter}')">
                        <i class="fas fa-${paymentStatus === 'paid' ? 'edit' : 'money-bill'}"></i> Update
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('paymentsTable').innerHTML = html || '<tr><td colspan="6" style="text-align:center;">No payment records found</td></tr>';
}

// Render Reports
function renderReports() {
    let totalExpected = 0;
    let totalCollected = 0;
    
    tenants.filter(t => t.status === 'active').forEach(tenant => {
        months.forEach(month => {
            totalExpected += tenant.rent;
            if (tenant.payments[month.key] === 'paid') {
                totalCollected += tenant.rent;
            }
        });
    });
    
    const totalPending = totalExpected - totalCollected;
    const collectionRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;
    
    document.getElementById('totalExpected').textContent = `₹${totalExpected.toLocaleString('en-IN')}`;
    document.getElementById('totalCollected').textContent = `₹${totalCollected.toLocaleString('en-IN')}`;
    document.getElementById('totalPendingAmount').textContent = `₹${totalPending.toLocaleString('en-IN')}`;
    document.getElementById('collectionRate').textContent = `${collectionRate}%`;
}

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

// Add Tenant
function addTenant(tenantData) {
    const newId = tenants.length > 0 ? Math.max(...tenants.map(t => t.id)) + 1 : 1;
    const payments = {};
    months.forEach(month => {
        payments[month.key] = 'pending';
    });
    
    tenants.push({
        id: newId,
        ...tenantData,
        payments: payments
    });
    saveData();
    refreshAll();
}

// Update Tenant
function updateTenant(id, updatedData) {
    const index = tenants.findIndex(t => t.id === id);
    if (index !== -1) {
        tenants[index] = { ...tenants[index], ...updatedData };
        saveData();
        refreshAll();
    }
}

// Delete Tenant
window.deleteTenant = function(id) {
    if (confirm('Are you sure you want to delete this tenant? This will remove all payment records.')) {
        tenants = tenants.filter(t => t.id !== id);
        saveData();
        refreshAll();
    }
};

// Edit Tenant
window.editTenant = function(id) {
    const tenant = tenants.find(t => t.id === id);
    if (tenant) {
        currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Tenant';
        document.getElementById('tenantId').value = tenant.id;
        document.getElementById('name').value = tenant.name;
        document.getElementById('room').value = tenant.room;
        document.getElementById('mobile').value = tenant.mobile;
        document.getElementById('rent').value = tenant.rent;
        document.getElementById('deposit').value = tenant.deposit;
        document.getElementById('joinDate').value = tenant.joinDate;
        document.getElementById('status').value = tenant.status;
        document.getElementById('tenantModal').style.display = 'block';
    }
};

// Open Payment Modal
window.openPaymentModal = function(tenantId, month) {
    const tenant = tenants.find(t => t.id === tenantId);
    const monthName = months.find(m => m.key === month)?.name || month;
    
    currentPaymentData = { tenantId, month };
    
    document.getElementById('payTenantName').textContent = tenant.name;
    document.getElementById('payRoomNo').textContent = tenant.room;
    document.getElementById('payMonth').textContent = monthName;
    document.getElementById('payAmount').textContent = tenant.rent;
    document.getElementById('paymentStatusSelect').value = tenant.payments[month] || 'pending';
    
    document.getElementById('paymentModal').style.display = 'block';
};

// Update Payment
function updatePayment() {
    if (currentPaymentData) {
        const tenant = tenants.find(t => t.id === currentPaymentData.tenantId);
        const newStatus = document.getElementById('paymentStatusSelect').value;
        tenant.payments[currentPaymentData.month] = newStatus;
        saveData();
        refreshAll();
        document.getElementById('paymentModal').style.display = 'none';
        currentPaymentData = null;
    }
}

// Refresh all views
function refreshAll() {
    renderDashboard();
    renderTenants();
    renderPayments();
    renderReports();
}

// Populate month filter
function populateMonthFilter() {
    const monthSelect = document.getElementById('monthFilter');
    if (monthSelect) {
        monthSelect.innerHTML = months.map(month => 
            `<option value="${month.key}" ${month.key === getCurrentMonthKey() ? 'selected' : ''}>${month.name}</option>`
        ).join('');
    }
}

// Export functions
function exportToExcel() {
    let csv = "ID,Name,Room,Mobile,Rent,Join Date,Status\n";
    tenants.forEach(tenant => {
        csv += `${tenant.id},"${tenant.name}",${tenant.room},${tenant.mobile},${tenant.rent},${tenant.joinDate},${tenant.status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pg_tenants_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>PG Tenants Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #4361ee; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #f5f5f5; }
                .header { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PG Manager Pro - Tenants Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Total Tenants: ${tenants.length}</p>
            </div>
            <table>
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Room</th><th>Mobile</th><th>Rent</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${tenants.map(tenant => `
                        <tr>
                            <td>${tenant.id}</td>
                            <td>${tenant.name}</td>
                            <td>${tenant.room}</td>
                            <td>${tenant.mobile}</td>
                            <td>₹${tenant.rent}</td>
                            <td>${tenant.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Page switching
function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageName}Page`).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${pageName}"]`).classList.add('active');
    
    const titles = {
        dashboard: { title: 'Dashboard', desc: 'Overview of your PG business' },
        tenants: { title: 'Tenants', desc: 'Manage all tenants' },
        payments: { title: 'Payments', desc: 'Track monthly payments' },
        reports: { title: 'Reports', desc: 'Financial reports' }
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName].title;
    document.getElementById('pageDesc').textContent = titles[pageName].desc;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initSampleData();
    populateMonthFilter();
    refreshAll();
    
    // Page navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            switchPage(page);
        });
    });
    
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const page = el.dataset.page;
            if (page) switchPage(page);
        });
    });
    
    // Add tenant button
    document.getElementById('addTenantBtn').addEventListener('click', () => {
        currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Tenant';
        document.getElementById('tenantForm').reset();
        document.getElementById('tenantId').value = '';
        document.getElementById('status').value = 'active';
        document.getElementById('tenantModal').style.display = 'block';
    });
    
    // Form submission
    document.getElementById('tenantForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tenantData = {
            name: document.getElementById('name').value,
            room: document.getElementById('room').value,
            mobile: document.getElementById('mobile').value,
            rent: parseInt(document.getElementById('rent').value),
            deposit: parseInt(document.getElementById('deposit').value) || 0,
            joinDate: document.getElementById('joinDate').value,
            status: document.getElementById('status').value
        };
        
        const id = document.getElementById('tenantId').value;
        if (id) {
            updateTenant(parseInt(id), tenantData);
        } else {
            addTenant(tenantData);
        }
        
        document.getElementById('tenantModal').style.display = 'none';
    });
    
    // Update payment button
    document.getElementById('updatePaymentBtn').addEventListener('click', updatePayment);
    
    // Export buttons
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    
    // Filters
    document.getElementById('searchInput')?.addEventListener('input', () => renderTenants());
    document.getElementById('statusFilter')?.addEventListener('change', () => renderTenants());
    document.getElementById('monthFilter')?.addEventListener('change', () => renderPayments());
    document.getElementById('paymentFilter')?.addEventListener('change', () => renderPayments());
    
    // Close modals
    document.querySelectorAll('.modal-close, .modal-close-payment, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('tenantModal').style.display = 'none';
            document.getElementById('paymentModal').style.display = 'none';
        });
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('tenantModal')) {
            document.getElementById('tenantModal').style.display = 'none';
        }
        if (e.target === document.getElementById('paymentModal')) {
            document.getElementById('paymentModal').style.display = 'none';
        }
    });
});

// Make functions global
window.switchPage = switchPage;     

// Add this at the end of your app.js file
// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    
    // Close sidebar when clicking on a link (mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });
}