document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const pinInput = document.getElementById('pinInput');
  const loginMessage = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pin = pinInput.value.trim();
    loginMessage.textContent = '';

    if (!supabase) {
      console.error('Supabase client is not initialized.');
      loginMessage.textContent = 'Unable to log in right now. Supabase client not initialized.';
      return;
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      loginMessage.textContent = 'Please enter a valid 4-digit PIN.';
      return;
    }

    try {
      console.debug('Login attempt for PIN', pin);
      const { data: hostData, error: hostError } = await supabase.from(HOST_TABLE).select('id,name').eq('pin', pin).maybeSingle();
      if (hostError) {
        console.error('Host lookup error', hostError);
        const hostTableMissing = /does not exist|relation.*does not exist|undefined_table|42P01/i.test(hostError.message || '');
        if (!hostTableMissing) {
          loginMessage.textContent = hostError.message || 'Host lookup failed.';
          return;
        }
        console.warn('HOST_TABLE is missing or invalid, continuing with guest login only.');
      }

      if (hostData) {
        sessionStorage.setItem(APP_MODE_KEY, 'host');
        sessionStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify({ hostId: hostData.id, hostName: hostData.name }));
        window.location.href = 'dashboard.html';
        return;
      }

      const { data, error } = await supabase.from(GUEST_TABLE).select('id,name,message').eq('pin', pin).maybeSingle();
      if (error) {
        console.error('Guest lookup error', error);
        loginMessage.textContent = error.message || 'Guest lookup failed.';
        return;
      }

      if (!data) {
        loginMessage.textContent = 'PIN not found. Try again or ask the host for access.';
        return;
      }

      sessionStorage.setItem(APP_MODE_KEY, 'guest');
      sessionStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify({ guestId: data.id, guestName: data.name }));
      window.location.href = 'book.html';
    } catch (error) {
      console.error('Login request failed', error);
      loginMessage.textContent = error?.message || 'Unable to log in right now. Please refresh.';
    }
  });
});
