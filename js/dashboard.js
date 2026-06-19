document.addEventListener('DOMContentLoaded', async () => {
  const mode = sessionStorage.getItem(APP_MODE_KEY);
  if (mode !== 'host') {
    window.location.href = 'index.html';
    return;
  }

  const panels = document.querySelectorAll('.panel');
  const navLinks = document.querySelectorAll('.nav-link');
  const customerTableWrapper = document.getElementById('customerTableWrapper');
  const customerSearch = document.getElementById('customerSearch');
  const newCustomerButton = document.getElementById('newCustomerButton');
  const customerModal = document.getElementById('customerModal');
  const customerModalClose = document.getElementById('customerModalClose');
  const customerForm = document.getElementById('customerForm');
  const customerName = document.getElementById('customerName');
  const customerMessage = document.getElementById('customerMessage');
  const customerPin = document.getElementById('customerPin');
  const customerId = document.getElementById('customerId');
  const generatePinButton = document.getElementById('generatePinButton');
  const modalMessage = document.getElementById('modalMessage');
  const signOutButton = document.getElementById('signOutButton');
  const uploadLibraryButton = document.getElementById('uploadLibraryButton');
  const customerPanel = document.getElementById('customersPanel');

  let customers = [];

  function switchPanel(panelId) {
    panels.forEach(panel => panel.classList.toggle('active-panel', panel.id === panelId));
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.panel === panelId));
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => switchPanel(link.dataset.panel));
  });

  signOutButton.addEventListener('click', () => {
    sessionStorage.removeItem(APP_MODE_KEY);
    sessionStorage.removeItem(SUPABASE_SESSION_KEY);
    window.location.href = 'index.html';
  });

  uploadLibraryButton.addEventListener('click', () => {
    document.getElementById('galleryFileInput').click();
  });

  customerSearch.addEventListener('input', async (event) => {
    await renderCustomers(event.target.value.trim());
  });

  newCustomerButton.addEventListener('click', () => {
    openCustomerModal();
  });

  customerModalClose.addEventListener('click', () => closeCustomerModal());

  generatePinButton.addEventListener('click', () => {
    customerPin.value = generatePin();
  });

  customerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    modalMessage.textContent = '';

    const payload = {
      name: customerName.value.trim(),
      message: customerMessage.value.trim(),
      pin: customerPin.value.trim(),
      created_at: new Date().toISOString()
    };

    if (!payload.name || !payload.message || !/^[0-9]{4}$/.test(payload.pin)) {
      modalMessage.textContent = 'Complete all fields with a valid 4-digit PIN.';
      return;
    }

    try {
      if (customerId.value) {
        await updateCustomer(customerId.value, payload);
      } else {
        await addCustomer(payload);
      }
      await renderCustomers(customerSearch.value.trim());
      closeCustomerModal();
    } catch (error) {
      modalMessage.textContent = 'Could not save customer. Try again.';
      console.error(error);
    }
  });

  async function openCustomerModal(customer = null) {
    modalMessage.textContent = '';
    customerModal.classList.remove('hidden');
    if (customer) {
      customerName.value = customer.name;
      customerMessage.value = customer.message;
      customerPin.value = customer.pin;
      customerId.value = customer.id;
      document.getElementById('modalTitle').textContent = 'Edit Customer';
    } else {
      customerName.value = '';
      customerMessage.value = '';
      customerPin.value = generatePin();
      customerId.value = '';
      document.getElementById('modalTitle').textContent = 'Add Customer';
    }
  }

  function closeCustomerModal() {
    customerModal.classList.add('hidden');
  }

  function generatePin() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async function renderCustomers(searchTerm = '') {
    try {
      customers = await fetchCustomers(searchTerm);
      if (!customers.length) {
        customerTableWrapper.innerHTML = '<p class="empty-state">No customers found. Add a new guest to begin.</p>';
        return;
      }

      const rows = customers.map(customer => `
        <tr>
          <td>${escapeHtml(customer.name)}</td>
          <td>${escapeHtml(customer.message)}</td>
          <td>${escapeHtml(customer.pin)}</td>
          <td>${new Date(customer.created_at).toLocaleDateString()}</td>
          <td>
            <div class="button-row">
              <button class="btn btn-secondary" data-action="edit" data-id="${customer.id}">Edit</button>
              <button class="btn btn-ghost" data-action="delete" data-id="${customer.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      customerTableWrapper.innerHTML = `
        <table class="customer-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Message</th>
              <th>PIN</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;

      customerTableWrapper.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', async () => {
          const action = button.dataset.action;
          const id = button.dataset.id;
          const customer = customers.find(item => String(item.id) === String(id));
          if (action === 'edit' && customer) {
            openCustomerModal(customer);
          }
          if (action === 'delete' && customer) {
            if (confirm(`Delete ${customer.name}? This cannot be undone.`)) {
              await deleteCustomer(id);
              await renderCustomers(customerSearch.value.trim());
            }
          }
        });
      });
    } catch (error) {
      customerTableWrapper.innerHTML = '<p class="empty-state">Unable to load customers. Please try again later.</p>';
      console.error(error);
    }
  }

  await renderCustomers();
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
