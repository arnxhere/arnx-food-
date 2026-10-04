/**
 * The Arnx Food & Drinks - Master Interactive JavaScript Application
 */

// Application State
const AppState = {
  cart: {}, // { itemId: quantity }
  activeCategory: 'all',
  activeDietaryFilter: 'all',
  searchQuery: '',
  appliedCoupon: null,
  orderType: 'delivery', // 'delivery', 'dinein', 'takeaway'
  deliveryFee: 40,
  taxRate: 0.05 // 5% GST on Restaurant food
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  initNavbar();
  renderCategoryTabs();
  renderMenuItems();
  initSearchAndFilters();
  initCartDrawer();
  initReservationForm();
  initCheckoutFlow();
  updateCartUI();
});

/* ==========================================================================
   Navigation & Navbar
   ========================================================================== */

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileNav = document.getElementById('mobileNavDrawer');
  const mobileClose = document.getElementById('mobileNavClose');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.add('open');
    });
  }

  if (mobileClose && mobileNav) {
    mobileClose.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  }

  // Close mobile drawer when clicking navigation links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNav) mobileNav.classList.remove('open');
    });
  });
}

/* ==========================================================================
   Menu Rendering & Filtering
   ========================================================================== */

function renderCategoryTabs() {
  const container = document.getElementById('categoryTabsContainer');
  if (!container) return;

  const categories = [
    { id: 'all', label: 'All Delights', icon: '✨' },
    { id: 'thalis', label: "Royal Thalis", icon: '👑' },
    { id: 'starters', label: 'Tandoor & Chaats', icon: '🔥' },
    { id: 'mains', label: 'Royal Curries & Naans', icon: '🍛' },
    { id: 'drinks', label: 'Artisanal Drinks', icon: '🍹' },
    { id: 'continental', label: 'Woodfired Pizza & Pasta', icon: '🍕' },
    { id: 'desserts', label: 'Divine Sweets', icon: '🍨' }
  ];

  container.innerHTML = categories.map(cat => `
    <button class="category-tab-btn ${cat.id === AppState.activeCategory ? 'active' : ''}" data-cat="${cat.id}">
      <span>${cat.icon}</span> ${cat.label}
    </button>
  `).join('');

  container.querySelectorAll('.category-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.activeCategory = btn.dataset.cat;
      renderMenuItems();
    });
  });
}

function initSearchAndFilters() {
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.toLowerCase().trim();
      renderMenuItems();
    });
  }

  const dietaryChips = document.querySelectorAll('.dietary-filter-chip');
  dietaryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dietaryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.activeDietaryFilter = chip.dataset.diet;
      renderMenuItems();
    });
  });
}

function renderMenuItems() {
  const container = document.getElementById('menuGridContainer');
  if (!container) return;

  // Filter items
  let filtered = MENU_ITEMS.filter(item => {
    // Category filter
    if (AppState.activeCategory !== 'all' && item.category !== AppState.activeCategory) {
      return false;
    }

    // Dietary filter
    if (AppState.activeDietaryFilter === 'chef' && !item.isChefSpecial) return false;
    if (AppState.activeDietaryFilter === 'bestseller' && !item.isBestseller) return false;
    if (AppState.activeDietaryFilter === 'jain' && !item.isJainAvailable) return false;

    // Search query
    if (AppState.searchQuery) {
      const matchName = item.name.toLowerCase().includes(AppState.searchQuery);
      const matchDesc = item.description.toLowerCase().includes(AppState.searchQuery);
      const matchTags = item.tags.some(t => t.toLowerCase().includes(AppState.searchQuery));
      if (!matchName && !matchDesc && !matchTags) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--gold-400);">🍽️</div>
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff;">No Dishes Found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search terms or dietary filters.</p>
        <button class="btn-primary btn-sm" style="margin-top: 1.5rem;" onclick="resetMenuFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const qty = AppState.cart[item.id] || 0;

    let spiceBadge = '';
    if (item.spiceLevel === 'mild') spiceBadge = '<span class="spice-tag" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">🌿 Mild</span>';
    else if (item.spiceLevel === 'medium') spiceBadge = '<span class="spice-tag">🌶️ Medium</span>';
    else if (item.spiceLevel === 'spicy') spiceBadge = '<span class="spice-tag" style="background: rgba(220, 38, 38, 0.2); color: #f87171; border-color: rgba(220, 38, 38, 0.4);">🌶️🌶️ Royal Spice</span>';

    return `
      <article class="menu-card" data-id="${item.id}">
        <div class="menu-card-img-wrap">
          <img src="${item.image}" alt="${item.name}" class="menu-card-img" loading="lazy">
          <div class="menu-card-badges">
            ${item.isChefSpecial ? '<span class="badge-tag chef">👑 Chef Signature</span>' : ''}
            ${item.isBestseller ? '<span class="badge-tag bestseller">⭐ Bestseller</span>' : ''}
          </div>
          <button class="menu-card-quick-view-btn" onclick="openQuickView('${item.id}')">
            🔍 Quick View
          </button>
        </div>

        <div class="menu-card-content">
          <div class="menu-card-meta">
            <div class="menu-card-veg-group">
              <span class="pure-veg-icon" title="100% Pure Vegetarian"></span>
              ${spiceBadge}
            </div>
            <div class="menu-card-rating">
              ★ ${item.rating} <span style="color: var(--text-muted); font-size: 0.75rem;">(${item.reviewsCount})</span>
            </div>
          </div>

          <h3 class="menu-card-name">${item.name}</h3>
          <p class="menu-card-desc">${item.description}</p>

          <div class="menu-card-tags-row">
            ${item.tags.map(tag => `<span class="item-diet-tag">${tag}</span>`).join('')}
          </div>

          <div class="menu-card-footer">
            <div class="menu-card-price-group">
              <span class="menu-card-price">₹${item.price}</span>
              ${item.originalPrice ? `<span class="menu-card-original-price">₹${item.originalPrice}</span>` : ''}
            </div>

            <div class="card-action-container" id="cardAction-${item.id}">
              ${renderCartButtonHTML(item.id, qty)}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderCartButtonHTML(itemId, qty) {
  if (qty > 0) {
    return `
      <div class="qty-control-box">
        <button class="qty-btn" onclick="updateItemQuantity('${itemId}', ${qty - 1})">−</button>
        <span class="qty-number">${qty}</span>
        <button class="qty-btn" onclick="updateItemQuantity('${itemId}', ${qty + 1})">+</button>
      </div>
    `;
  }
  return `
    <button class="add-to-cart-btn" onclick="addToCart('${itemId}')">
      <span>+</span> Add
    </button>
  `;
}

function resetMenuFilters() {
  AppState.searchQuery = '';
  AppState.activeCategory = 'all';
  AppState.activeDietaryFilter = 'all';
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) searchInput.value = '';
  renderCategoryTabs();
  document.querySelectorAll('.dietary-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.diet === 'all');
  });
  renderMenuItems();
}

/* ==========================================================================
   Cart System & Storage
   ========================================================================== */

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('arnx_cart');
    if (saved) {
      AppState.cart = JSON.parse(saved);
    }
  } catch (e) {
    AppState.cart = {};
  }
}

function saveCartToStorage() {
  localStorage.setItem('arnx_cart', JSON.stringify(AppState.cart));
}

function addToCart(itemId) {
  const current = AppState.cart[itemId] || 0;
  AppState.cart[itemId] = current + 1;
  saveCartToStorage();
  updateCartUI();
  updateSingleCardAction(itemId);

  const item = MENU_ITEMS.find(i => i.id === itemId);
  showToast(`Added "${item ? item.name : 'Item'}" to your cart! 🍲`);
}

function updateItemQuantity(itemId, newQty) {
  if (newQty <= 0) {
    delete AppState.cart[itemId];
  } else {
    AppState.cart[itemId] = newQty;
  }
  saveCartToStorage();
  updateCartUI();
  updateSingleCardAction(itemId);
}

function updateSingleCardAction(itemId) {
  const container = document.getElementById(`cardAction-${itemId}`);
  if (container) {
    const qty = AppState.cart[itemId] || 0;
    container.innerHTML = renderCartButtonHTML(itemId, qty);
  }
}

function updateCartUI() {
  // Calculate totals
  let totalItemsCount = 0;
  let subtotal = 0;

  for (const [id, qty] of Object.entries(AppState.cart)) {
    const item = MENU_ITEMS.find(i => i.id === id);
    if (item && qty > 0) {
      totalItemsCount += qty;
      subtotal += item.price * qty;
    }
  }

  // Update Navbar badges
  const navBadge = document.getElementById('navCartCount');
  if (navBadge) {
    navBadge.textContent = totalItemsCount;
    navBadge.style.display = totalItemsCount > 0 ? 'inline-flex' : 'none';
  }

  // Update floating bar
  const floatingBar = document.getElementById('floatingOrderBar');
  const floatingCount = document.getElementById('floatingBarCount');
  const floatingTotal = document.getElementById('floatingBarTotal');
  if (floatingBar && floatingCount && floatingTotal) {
    if (totalItemsCount > 0) {
      floatingBar.classList.add('show');
      floatingCount.textContent = `${totalItemsCount} item${totalItemsCount > 1 ? 's' : ''}`;
      floatingTotal.textContent = `₹${subtotal}`;
    } else {
      floatingBar.classList.remove('show');
    }
  }

  // Update Cart Drawer Items List
  renderCartDrawerItems(subtotal);
}

function renderCartDrawerItems(subtotal) {
  const listContainer = document.getElementById('cartDrawerItemsList');
  const footerContainer = document.getElementById('cartDrawerFooter');
  if (!listContainer || !footerContainer) return;

  const cartEntries = Object.entries(AppState.cart);

  if (cartEntries.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-cart-state">
        <div class="empty-cart-icon">🍲</div>
        <h4>Your Royal Cart is Empty</h4>
        <p>Explore our master chefs' signature curries, tandoor delights, and artisanal mocktails.</p>
        <button class="btn-primary" onclick="closeCartDrawer(); scrollToSection('menuSection')">
          Explore Menu
        </button>
      </div>
    `;
    footerContainer.style.display = 'none';
    return;
  }

  footerContainer.style.display = 'block';

  // Render items
  listContainer.innerHTML = cartEntries.map(([id, qty]) => {
    const item = MENU_ITEMS.find(i => i.id === id);
    if (!item) return '';

    return `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price} × ${qty} = ₹${item.price * qty}</div>
        </div>
        <div class="qty-control-box">
          <button class="qty-btn" onclick="updateItemQuantity('${item.id}', ${qty - 1})">−</button>
          <span class="qty-number">${qty}</span>
          <button class="qty-btn" onclick="updateItemQuantity('${item.id}', ${qty + 1})">+</button>
        </div>
      </div>
    `;
  }).join('');

  // Calculations for billing
  const taxes = Math.round(subtotal * AppState.taxRate);
  let deliveryFee = AppState.orderType === 'delivery' ? (subtotal > 600 ? 0 : AppState.deliveryFee) : 0;

  // Coupon discount calculation
  let discountAmount = 0;
  if (AppState.appliedCoupon && COUPONS[AppState.appliedCoupon]) {
    const cp = COUPONS[AppState.appliedCoupon];
    if (subtotal >= cp.minOrder) {
      if (cp.discountPercent) {
        discountAmount = Math.min(Math.round((subtotal * cp.discountPercent) / 100), cp.maxDiscount);
      } else if (cp.discountFlat) {
        discountAmount = cp.discountFlat;
      }
    } else {
      AppState.appliedCoupon = null;
      showToast(`Coupon removed: Minimum order of ₹${cp.minOrder} required.`, 'warning');
    }
  }

  const grandTotal = Math.max(0, subtotal + taxes + deliveryFee - discountAmount);

  // Update Drawer Summary HTML
  footerContainer.innerHTML = `
    <div class="coupon-box">
      <input type="text" id="couponCodeInput" class="coupon-input" placeholder="Promo code (e.g. ARNXFIRST)" value="${AppState.appliedCoupon || ''}">
      <button class="apply-coupon-btn" onclick="handleApplyCoupon()">Apply</button>
    </div>
    ${AppState.appliedCoupon ? `
      <div style="font-size: 0.78rem; color: var(--emerald-400); margin-bottom: 0.8rem; display: flex; justify-content: space-between;">
        <span>🎉 Applied "${AppState.appliedCoupon}": -₹${discountAmount}</span>
        <button style="color: #ef4444; font-size: 0.75rem; text-decoration: underline;" onclick="removeCoupon()">Remove</button>
      </div>
    ` : ''}

    <div class="cart-summary-line">
      <span>Subtotal</span>
      <span>₹${subtotal}</span>
    </div>
    <div class="cart-summary-line">
      <span>GST (5% Restaurant Tax)</span>
      <span>₹${taxes}</span>
    </div>
    <div class="cart-summary-line">
      <span>Delivery & Packaging</span>
      <span>${deliveryFee === 0 ? '<span style="color: var(--emerald-400);">FREE</span>' : '₹' + deliveryFee}</span>
    </div>
    ${discountAmount > 0 ? `
      <div class="cart-summary-line discount">
        <span>Coupon Discount</span>
        <span>-₹${discountAmount}</span>
      </div>
    ` : ''}

    <div class="cart-total-line">
      <span>Grand Total</span>
      <span class="gold-gradient-text">₹${grandTotal}</span>
    </div>

    <button class="btn-primary checkout-btn" onclick="openCheckoutModal(${grandTotal}, ${subtotal}, ${taxes}, ${deliveryFee}, ${discountAmount})">
      Proceed to Checkout • ₹${grandTotal}
    </button>
  `;
}

function handleApplyCoupon() {
  const input = document.getElementById('couponCodeInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showToast('Please enter a promo code.', 'warning');
    return;
  }

  if (COUPONS[code]) {
    AppState.appliedCoupon = code;
    showToast(`Promo Code "${code}" Applied Successfully! 🎉`);
    updateCartUI();
  } else {
    showToast('Invalid Coupon Code! Try ARNXFIRST or VEGLOVE.', 'error');
  }
}

function removeCoupon() {
  AppState.appliedCoupon = null;
  showToast('Coupon removed.');
  updateCartUI();
}

/* ==========================================================================
   Drawer Open / Close & Order Type
   ========================================================================== */

function initCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  const openButtons = document.querySelectorAll('.open-cart-btn');
  const closeBtn = document.getElementById('closeCartDrawerBtn');

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      openCartDrawer();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCartDrawer);
  }

  if (overlay) {
    overlay.addEventListener('click', closeCartDrawer);
  }

  // Order type selector
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.orderType = btn.dataset.type;
      updateCartUI();
    });
  });
}

function openCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   Quick View Modal
   ========================================================================== */

function openQuickView(itemId) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById('quickViewModal');
  const content = document.getElementById('quickViewContent');
  if (!modal || !content) return;

  const qty = AppState.cart[item.id] || 0;

  content.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="quick-view-img">
    <div class="quick-view-content">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
            <span class="pure-veg-icon"></span>
            <span style="color: var(--emerald-400); font-size: 0.8rem; font-weight: 700;">100% PURE VEG</span>
          </div>
          <h2 style="font-family: var(--font-serif); font-size: 1.6rem; color: #fff;">${item.name}</h2>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--gold-400);">₹${item.price}</div>
          ${item.originalPrice ? `<div style="text-decoration: line-through; color: var(--text-muted); font-size: 0.9rem;">₹${item.originalPrice}</div>` : ''}
        </div>
      </div>

      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">${item.description}</p>
      <p style="font-size: 0.85rem; color: var(--gold-200); background: rgba(245, 158, 11, 0.1); border-left: 3px solid var(--gold-400); padding: 0.6rem 0.8rem; border-radius: 4px; margin-bottom: 1.2rem;">
        <strong>Chef's Note:</strong> ${item.details}
      </p>

      <div class="quick-view-nutrition-grid">
        <div>
          <strong>${item.calories}</strong>
          <span>Energy</span>
        </div>
        <div>
          <strong>${item.protein}</strong>
          <span>Protein</span>
        </div>
        <div>
          <strong>${item.spiceLevel.toUpperCase()}</strong>
          <span>Spice Level</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.8rem;">
        ${item.tags.map(t => `<span class="item-diet-tag" style="padding: 0.3rem 0.7rem; font-size: 0.8rem;">${t}</span>`).join('')}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <button class="btn-primary" style="flex: 1;" onclick="addToCart('${item.id}'); closeQuickView();">
          🛒 Add to Cart • ₹${item.price}
        </button>
        <button class="btn-secondary" onclick="closeQuickView();">Close</button>
      </div>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   Table Reservation Flow
   ========================================================================== */

function initReservationForm() {
  const form = document.getElementById('tableReservationForm');
  if (!form) return;

  // Set min date to today
  const dateInput = document.getElementById('resDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('resName').value.trim();
    const phone = document.getElementById('resPhone').value.trim();
    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value;
    const guests = document.getElementById('resGuests').value;
    const seating = document.getElementById('resSeating').value;
    const occasion = document.getElementById('resOccasion').value;

    if (!name || !phone || !date || !time) {
      showToast('Please fill all required reservation fields.', 'warning');
      return;
    }

    const bookingId = 'ARNX-' + Math.floor(100000 + Math.random() * 900000);

    // Show Confirmation Modal
    showReservationConfirmation({
      bookingId,
      name,
      phone,
      date,
      time,
      guests,
      seating,
      occasion
    });

    form.reset();
  });
}

function showReservationConfirmation(res) {
  const modal = document.getElementById('reservationPassModal');
  const detailsContainer = document.getElementById('reservationPassDetails');
  if (!modal || !detailsContainer) return;

  detailsContainer.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">👑</div>
      <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: #fff;">Table Reserved Successfully!</h3>
      <p style="color: var(--gold-400); font-weight: 700; font-size: 1.1rem; letter-spacing: 1px;">Booking ID: ${res.bookingId}</p>
    </div>

    <div style="background: rgba(12, 38, 27, 0.85); border: 1px solid var(--border-gold); border-radius: var(--radius-md); padding: 1.4rem; margin-bottom: 1.5rem;">
      <div class="cart-summary-line"><span>Guest Name:</span> <strong>${res.name}</strong></div>
      <div class="cart-summary-line"><span>Contact Number:</span> <strong>${res.phone}</strong></div>
      <div class="cart-summary-line"><span>Date &amp; Time:</span> <strong>${res.date} at ${res.time}</strong></div>
      <div class="cart-summary-line"><span>Party Size:</span> <strong>${res.guests} Guests</strong></div>
      <div class="cart-summary-line"><span>Seating Zone:</span> <strong>${res.seating}</strong></div>
      ${res.occasion ? `<div class="cart-summary-line"><span>Occasion:</span> <strong>${res.occasion}</strong></div>` : ''}
    </div>

    <div style="font-size: 0.82rem; color: var(--text-muted); text-align: center; margin-bottom: 1.5rem;">
      ✨ A royal table has been blocked for you. An instant SMS and WhatsApp confirmation will be sent to your phone.
    </div>

    <button class="btn-primary" style="width: 100%;" onclick="closeReservationModal()">
      Done &amp; Return to Home
    </button>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeReservationModal() {
  const modal = document.getElementById('reservationPassModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   Order Checkout & Live Tracking Simulation
   ========================================================================== */

function initCheckoutFlow() {
  const checkoutModal = document.getElementById('checkoutModal');
  if (!checkoutModal) return;
}

function openCheckoutModal(grandTotal, subtotal, taxes, deliveryFee, discount) {
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  const body = document.getElementById('checkoutModalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <h2 style="font-family: var(--font-serif); font-size: 1.6rem; color: #fff; margin-bottom: 0.5rem;">Complete Your Royal Feast</h2>
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.8rem;">Review delivery address &amp; select your preferred payment mode.</p>

    <form id="orderCheckoutForm">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.2rem;">
        <div>
          <label class="form-label">Full Name *</label>
          <input type="text" required class="form-input" id="orderCustName" placeholder="e.g. Arun Gupta">
        </div>
        <div>
          <label class="form-label">Phone Number *</label>
          <input type="tel" required class="form-input" id="orderCustPhone" placeholder="10-digit mobile">
        </div>
      </div>

      <div style="margin-bottom: 1.2rem;">
        <label class="form-label">${AppState.orderType === 'dinein' ? 'Table Number (if seated)' : 'Delivery Address *'}</label>
        <textarea required rows="2" class="form-textarea" id="orderCustAddress" placeholder="${AppState.orderType === 'dinein' ? 'Enter Table number or mark Table Reserved' : 'Flat/House no, Street, Landmark, Pincode'}"></textarea>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label class="form-label">Special Cooking Instructions</label>
        <input type="text" class="form-input" id="orderSpecialNotes" placeholder="e.g. Pure Jain preparation, extra napkins, less green chilies">
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label class="form-label" style="margin-bottom: 0.8rem;">Payment Method</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem;">
          <label style="background: rgba(12, 38, 27, 0.7); border: 1.5px solid var(--border-gold); padding: 0.8rem; border-radius: 8px; cursor: pointer; text-align: center; font-size: 0.85rem; font-weight: 600;">
            <input type="radio" name="paymentMethod" value="upi" checked style="margin-right: 0.4rem;">
            📱 UPI / GPay
          </label>
          <label style="background: rgba(12, 38, 27, 0.7); border: 1.5px solid var(--border-gold); padding: 0.8rem; border-radius: 8px; cursor: pointer; text-align: center; font-size: 0.85rem; font-weight: 600;">
            <input type="radio" name="paymentMethod" value="card" style="margin-right: 0.4rem;">
            💳 Card / Net
          </label>
          <label style="background: rgba(12, 38, 27, 0.7); border: 1.5px solid var(--border-gold); padding: 0.8rem; border-radius: 8px; cursor: pointer; text-align: center; font-size: 0.85rem; font-weight: 600;">
            <input type="radio" name="paymentMethod" value="cod" style="margin-right: 0.4rem;">
            💵 Cash on Delivery
          </label>
        </div>
      </div>

      <div style="background: rgba(7, 25, 17, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.2rem; margin-bottom: 1.8rem;">
        <div class="cart-summary-line"><span>Items Subtotal:</span> <strong>₹${subtotal}</strong></div>
        <div class="cart-summary-line"><span>Taxes &amp; Packaging:</span> <strong>₹${taxes}</strong></div>
        ${discount > 0 ? `<div class="cart-summary-line discount"><span>Coupon Savings:</span> <strong>-₹${discount}</strong></div>` : ''}
        <div class="cart-summary-line"><span>Delivery Fee:</span> <strong>${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</strong></div>
        <div class="cart-total-line" style="margin-bottom: 0;">
          <span>Payable Amount:</span>
          <span class="gold-gradient-text">₹${grandTotal}</span>
        </div>
      </div>

      <button type="submit" class="btn-primary" style="width: 100%; font-size: 1.05rem;">
        🎉 Confirm Order &amp; Place Live
      </button>
    </form>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const checkoutForm = document.getElementById('orderCheckoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const custName = document.getElementById('orderCustName').value.trim();
      const custPhone = document.getElementById('orderCustPhone').value.trim();
      simulateOrderPlacement(custName, custPhone, grandTotal);
    });
  }
}

function simulateOrderPlacement(name, phone, total) {
  const body = document.getElementById('checkoutModalBody');
  if (!body) return;

  const orderId = 'ARNX-' + Math.floor(100000 + Math.random() * 900000);

  // Clear state cart
  AppState.cart = {};
  AppState.appliedCoupon = null;
  saveCartToStorage();
  updateCartUI();

  // Re-render menu cards buttons
  renderMenuItems();

  body.innerHTML = `
    <div style="text-align: center; padding: 1rem 0;">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">🎊</div>
      <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: #fff; margin-bottom: 0.3rem;">Order Placed Successfully!</h2>
      <p style="color: var(--gold-400); font-weight: 700; margin-bottom: 1.5rem;">Order Reference: ${orderId}</p>

      <!-- Live Order Progress Tracker -->
      <div style="background: rgba(12, 38, 27, 0.85); border: 1px solid var(--border-gold); border-radius: var(--radius-lg); padding: 1.6rem; text-align: left; margin-bottom: 1.8rem;">
        <h4 style="font-size: 1rem; color: #fff; margin-bottom: 1rem;">Live Royal Kitchen Tracker:</h4>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.8rem; color: #34d399;">
            <span style="background: #10b981; color: #071710; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800;">✓</span>
            <span style="font-weight: 700;">Order Received by The Arnx</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.8rem; color: var(--gold-400);">
            <span style="background: var(--gold-500); color: #071710; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; animation: pulse 1.5s infinite;">🔥</span>
            <span style="font-weight: 700;">Master Chefs Preparing Your Pure Veg Feasts</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.8rem; color: var(--text-muted);">
            <span style="background: rgba(255, 255, 255, 0.1); color: var(--text-muted); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">3</span>
            <span>Hand-packaged with Golden Thermal Seal</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.8rem; color: var(--text-muted);">
            <span style="background: rgba(255, 255, 255, 0.1); color: var(--text-muted); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">4</span>
            <span>Hot &amp; Fresh Delivery directly to your doorstep</span>
          </div>
        </div>
      </div>

      <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 2rem;">
        Thank you, <strong>${name}</strong>! Your bill of <strong>₹${total}</strong> is confirmed. A live tracking link has been dispatched to <strong>${phone}</strong>.
      </div>

      <button class="btn-primary" style="width: 100%;" onclick="closeCheckoutModal()">
        Return to Restaurant
      </button>
    </div>
  `;
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */

function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : '✨')}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ==========================================================================
   Smooth Scrolling Helper
   ========================================================================== */

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    const navHeight = 80;
    const targetPosition = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}
