/* ══════════════════════════════════════════════════════════════
   MANIFEST SUPPLY CO. — interactions
   cart · filters · accordion · scroll reveals · forms · tracker
   ══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => '$' + n.toLocaleString('en-US');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 0. API Configuración (vía Proxy Nginx /api/)
  const API_BASE = '/api';
  const SLUG_TO_ID = {
    'aether': 1,
    'halcyon': 2,
    'vantage': 3,
    'nomad': 4,
    'solis': 5
  };

  /* ─────────────────────────  1. Scroll reveals  ───────────────────────── */
  const revealables = $$('.reveal');
  revealables.forEach(el => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty('--d', d + 'ms');
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(el => io.observe(el));
  }

  /* ─────────────────────────  2. Sticky nav state  ───────────────────────── */
  const nav = $('#nav');
  if (nav) {
    let ticking = false;
    const sync = () => {
      nav.classList.toggle('is-stuck', window.scrollY > 12);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(sync); }
    }, { passive: true });
    sync();
  }

  /* ─────────────────────────  3. Category filters  ───────────────────────── */
  const chips   = $$('.chip');
  const cards   = $$('#productGrid .card');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;

      chips.forEach(c => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-selected', String(on));
      });

      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !show);
        if (show && !reduceMotion) {
          card.animate(
            [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
            { duration: 420, easing: 'cubic-bezier(.19,1,.22,1)', fill: 'both' }
          );
        }
      });

      const shown = cards.filter(c => !c.classList.contains('is-hidden')).length;
      const counter = $('#filterCount');
      if (counter) counter.textContent = `${shown} product${shown === 1 ? '' : 's'}`;
    });
  });

  // initialise result count
  const counter = $('#filterCount');
  if (counter) counter.textContent = `${cards.length} products`;

  /* ─────────────────────────  4. Cart  ───────────────────────── */
  const cart     = $('#cart');
  const scrim    = $('#scrim');
  const cartBtn  = $('#cartBtn');
  const cartClose= $('#cartClose');
  const cartList = $('#cartList');
  const cartEmpty= $('#cartEmpty');
  const cartFoot = $('#cartFoot');
  const countEls = [$('#cartCount'), $('#cartCountLabel')];

  /** @type {Map<string, {id:string,name:string,price:number,qty:number}>} */
  const items = new Map();

  const thumbSVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l1 10.2a1.6 1.6 0 0 1-1.6 1.8H5.6A1.6 1.6 0 0 1 4 18.2L5 8Z"/>
      <path d="M8.6 8V6.6A3.4 3.4 0 0 1 12 3.2a3.4 3.4 0 0 1 3.4 3.4V8" fill="none"/>
    </svg>`;

  function render() {
    const list = [...items.values()];
    const count = list.reduce((s, i) => s + i.qty, 0);
    const subtotal = list.reduce((s, i) => s + i.qty * i.price, 0);

    countEls.forEach(el => { if (el) el.textContent = el.id === 'cartCountLabel' ? `${count} item${count === 1 ? '' : 's'}` : count; });

    cartEmpty.hidden = list.length > 0;
    cartFoot.hidden  = list.length === 0;
    cartEmpty.style.display = list.length ? 'none' : '';

    cartList.innerHTML = list.map(i => `
      <li class="citem" data-id="${i.id}">
        <div class="citem__thumb">${thumbSVG}</div>
        <div>
          <p class="citem__name">${i.name}</p>
          <p class="citem__price">${money(i.price)} each</p>
          <div class="citem__qty">
            <button type="button" data-act="dec" aria-label="Decrease quantity of ${i.name}">−</button>
            <span>${i.qty}</span>
            <button type="button" data-act="inc" aria-label="Increase quantity of ${i.name}">+</button>
          </div>
        </div>
        <div class="citem__right">
          <p class="citem__line">${money(i.price * i.qty)}</p>
          <button type="button" class="citem__remove" data-act="rm">Remove</button>
        </div>
      </li>`).join('');

    $('#cartSubtotal').textContent = money(subtotal);
    $('#cartShip').textContent     = subtotal >= 75 || subtotal === 0 ? 'Free' : money(8);
    $('#cartTotal').textContent    = money(subtotal + (subtotal > 0 && subtotal < 75 ? 8 : 0));
  }

  function addItem({ id, name, price }) {
    const existing = items.get(id);
    const numId = SLUG_TO_ID[id] || (parseInt(id, 10) || 1);
    if (existing) existing.qty += 1;
    else items.set(id, { id, productId: numId, name, price: Number(price), qty: 1 });
    render();

    cartBtn.classList.remove('is-bumped');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('is-bumped');
  }

  // add-to-cart buttons (grid + spotlight)
  $$('.add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      addItem(btn.dataset);

      const original = btn.textContent;
      btn.classList.add('is-added');
      btn.textContent = 'Added ✓';
      setTimeout(() => {
        btn.classList.remove('is-added');
        btn.textContent = original;
      }, 1250);
    });
  });

  // line-item controls (event delegation)
  cartList.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const row = btn.closest('.citem');
    const id  = row?.dataset.id;
    const item = items.get(id);
    if (!item) return;

    switch (btn.dataset.act) {
      case 'inc': item.qty += 1; break;
      case 'dec': item.qty -= 1; if (item.qty <= 0) items.delete(id); break;
      case 'rm':  items.delete(id); break;
    }
    render();
  });

  /* drawer open / close */
  let lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    scrim.hidden = false;
    requestAnimationFrame(() => {
      scrim.classList.add('is-open');
      cart.classList.add('is-open');
    });
    cart.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    cartClose.focus();
  }

  function closeCart() {
    scrim.classList.remove('is-open');
    cart.classList.remove('is-open');
    cart.setAttribute('aria-hidden', 'true');
    cartBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => { scrim.hidden = true; }, 420);
    if (lastFocus) lastFocus.focus();
  }

  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  $$('[data-close-cart]').forEach(el => el.addEventListener('click', closeCart));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (cart.classList.contains('is-open')) closeCart();
    else if (trackerOpen) hideRoute();
  });

  /* ─────────────────────────  4b. Checkout Modal & API Order Placement  ───────────────────────── */
  const checkoutBtn      = $('#checkoutBtn');
  const checkoutModal    = $('#checkoutModal');
  const checkoutScrim    = $('#checkoutScrim');
  const checkoutClose    = $('#checkoutClose');
  const checkoutCancel   = $('#checkoutCancel');
  const checkoutForm     = $('#checkoutForm');
  const checkoutFeedback = $('#checkoutFeedback');
  const checkoutSubmit   = $('#checkoutSubmit');

  function openCheckout() {
    if (items.size === 0) return;
    checkoutScrim.hidden = false;
    checkoutModal.hidden = false;
    checkoutFeedback.style.display = 'none';
    $('#custName').focus();
  }

  function closeCheckout() {
    checkoutScrim.hidden = true;
    checkoutModal.hidden = true;
  }

  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckout);
  if (checkoutCancel) checkoutCancel.addEventListener('click', closeCheckout);
  if (checkoutScrim) checkoutScrim.addEventListener('click', closeCheckout);

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (items.size === 0) return;

      checkoutSubmit.disabled = true;
      checkoutSubmit.textContent = 'Processing Payment...';
      checkoutFeedback.style.display = 'block';
      checkoutFeedback.style.background = '#e3f2fd';
      checkoutFeedback.style.color = '#0d47a1';
      checkoutFeedback.textContent = 'Connecting to payment gateway...';

      const orderItems = [...items.values()].map(item => ({
        product_id: Number(item.productId) || SLUG_TO_ID[item.id] || (parseInt(item.id, 10) || 1),
        quantity: item.qty
      }));

      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: $('#custName').value.trim(),
            customer_email: $('#custEmail').value.trim(),
            shipping_address: $('#custAddress').value.trim(),
            items: orderItems
          })
        });

        if (res.status === 201) {
          const data = await res.json();
          checkoutFeedback.style.background = '#e8f5e9';
          checkoutFeedback.style.color = '#1b5e20';
          checkoutFeedback.innerHTML = `<b>✓ Payment Approved!</b><br>Order <b>${data.order_number}</b> saved to PostgreSQL.<br>Waybill loaded into Order Tracker below!`;
          
          if ($('#trackNo')) {
            $('#trackNo').value = data.order_number;
          }

          items.clear();
          render();
          closeCart();

          setTimeout(() => {
            closeCheckout();
            checkoutSubmit.disabled = false;
            checkoutSubmit.textContent = 'Pay & Place Order';
            const trackSec = $('#track');
            if (trackSec) trackSec.scrollIntoView({ behavior: 'smooth' });
            if ($('#trackBtn')) $('#trackBtn').click();
          }, 2400);

        } else if (res.status === 402) {
          const err = await res.json();
          checkoutFeedback.style.background = '#ffebee';
          checkoutFeedback.style.color = '#b71c1c';
          checkoutFeedback.innerHTML = `<b>⚠️ Payment Declined (Chaos Simulator):</b><br>${err.detail || 'Transaction rejected by card network'}.<br>Your cart is preserved. Click below to retry!`;
          checkoutSubmit.disabled = false;
          checkoutSubmit.textContent = 'Retry Payment';
        } else {
          const err = await res.json().catch(() => ({}));
          checkoutFeedback.style.background = '#ffebee';
          checkoutFeedback.style.color = '#b71c1c';
          checkoutFeedback.textContent = `Error (${res.status}): ${err.detail || 'Could not place order'}`;
          checkoutSubmit.disabled = false;
          checkoutSubmit.textContent = 'Pay & Place Order';
        }
      } catch (err) {
        checkoutFeedback.style.background = '#ffebee';
        checkoutFeedback.style.color = '#b71c1c';
        checkoutFeedback.textContent = 'Connection error: Unable to reach /api/orders.';
        checkoutSubmit.disabled = false;
        checkoutSubmit.textContent = 'Pay & Place Order';
      }
    });
  }

  /* ─────────────────────────  5. FAQ accordion  ───────────────────────── */
  const qas = $$('.qa');
  qas.forEach(qa => {
    qa.addEventListener('toggle', () => {
      if (!qa.open) return;
      qas.forEach(other => {
        if (other !== qa && other.open) other.open = false;
      });
    });
  });

  /* ─────────────────────────  6. Order tracker (API + Demo)  ───────────────────────── */
  const trackBtn   = $('#trackBtn');
  const trackInput = $('#trackNo');
  const trackHint  = $('#trackHint');
  const DEMO = 'MSC-4417-0928-QX';
  let trackerOpen = false;

  function hideRoute() {
    trackerOpen = false;
    trackHint.textContent = 'Try the demo waybill: ' + DEMO;
    trackHint.classList.remove('is-ok', 'is-err');
    trackHint.style.display = '';
  }

  if (trackBtn) {
    trackBtn.addEventListener('click', async () => {
      const value = (trackInput.value || '').trim().toUpperCase();
      trackHint.classList.remove('is-ok', 'is-err');

      if (!value) {
        trackHint.textContent = 'Enter a waybill number to continue.';
        trackHint.classList.add('is-err');
        return;
      }

      if (value === DEMO) {
        trackerOpen = true;
        trackHint.textContent = '✓ In transit — departed local depot 04:12 · arriving Thu, 2 Oct · signature not required';
        trackHint.classList.add('is-ok');
        return;
      }

      // Consulta en tiempo real a PostgreSQL vía /api/orders/track/{number}
      trackHint.textContent = 'Checking order status in database...';
      try {
        const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(value)}`);
        if (res.ok) {
          const o = await res.json();
          trackerOpen = true;
          trackHint.innerHTML = `<b>✓ Order Found:</b> ${o.order_number} · <b>Status:</b> ${o.status.toUpperCase()} · <b>Total:</b> $${o.total_amount} · <b>Destination:</b> ${o.shipping_address}`;
          trackHint.classList.add('is-ok');
        } else {
          trackHint.textContent = `Order "${value}" was not found in PostgreSQL database. Double-check your number.`;
          trackHint.classList.add('is-err');
        }
      } catch (err) {
        trackHint.textContent = 'Connection error: Unable to reach tracking API.';
        trackHint.classList.add('is-err');
      }
    });

    trackInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); trackBtn.click(); }
    });
  }

  /* ─────────────────────────  7. Newsletter  ───────────────────────── */
  const form  = $('#newsletter');
  const note  = $('#newsletterNote');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#email').value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      note.classList.remove('is-ok', 'is-err');

      if (!valid) {
        note.textContent = 'That email address doesn\'t look complete — mind checking it?';
        note.classList.add('is-err');
        $('#email').focus();
        return;
      }

      note.textContent = `✓ You're on the list. First drop lands Thursday at ${email}.`;
      note.classList.add('is-ok');
      form.querySelector('button').textContent = 'Subscribed';
      $('#email').value = '';
      $('#email').disabled = true;
    });
  }

  /* ─────────────────────────  8. Boot & Catalog API Sync  ───────────────────────── */
  render();

  async function syncCatalogFromAPI() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) return;
      const products = await res.json();
      console.log(`[Manifest API] Connected! ${products.length} products loaded from PostgreSQL.`);
    } catch (e) {
      console.log('[Manifest API] Running with local catalog fallback.');
    }
  }
  syncCatalogFromAPI();
})();
