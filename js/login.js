document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const pinInput = document.getElementById('pinInput');
  const loginMessage = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pin = pinInput.value.trim();
    loginMessage.textContent = '';

    if (!/^[0-9]{4}$/.test(pin)) {
      loginMessage.textContent = 'Please enter a valid 4-digit PIN.';
      return;
    }

    try {
      if (pin === HOST_PIN) {
        sessionStorage.setItem(APP_MODE_KEY, 'host');
        window.location.href = 'dashboard.html';
        return;
      }

      const { data, error } = await supabase.from(GUEST_TABLE).select('id,name,message').eq('pin', pin).single();
      if (error || !data) {
        loginMessage.textContent = 'PIN not found. Try again or ask the host for access.';
        return;
      }

      sessionStorage.setItem(APP_MODE_KEY, 'guest');
      sessionStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify({ guestId: data.id, guestName: data.name }));
      window.location.href = 'book.html';
    } catch (error) {
      loginMessage.textContent = 'Unable to log in right now. Please refresh.';
      console.error(error);
    }
  });
});
