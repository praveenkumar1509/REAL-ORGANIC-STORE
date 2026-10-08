/**
 * Real Organics - Main Application Logic
 * Integrates 3D World, 3D Product Turntable, Journey Timeline,
 * Traceability Scanner, Crate Builder, and E-commerce Cart.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Farm World Canvas
  let farmWorld = null;
  if (typeof FarmWorld3D !== 'undefined') {
    farmWorld = new FarmWorld3D('world-3d-canvas-container');
  }

  // 2. Initialize 3D Product Turntable Inspector
  let productViewer = null;
  if (typeof Product3DViewer !== 'undefined') {
    productViewer = new Product3DViewer('product-3d-turntable-container');
  }

  // State Management
  const state = {
    cart: [],
    customCrate: [],
    currentStageIndex: 0,
    activeCategory: 'all',
    activeProductForModal: null,
    isSoundOn: false
  };

  // DOM Elements
  const stagesContainer = document.getElementById('journey-stages-container');
  const stageNavButtons = document.querySelectorAll('.stage-nav-pill');
  const productsGrid = document.getElementById('products-grid');
  const categoryFilters = document.querySelectorAll('.cat-filter-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartToggleBtns = document.querySelectorAll('.cart-toggle-btn');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartTotalEl = document.getElementById('cart-total');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const productModal = document.getElementById('product-3d-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const crateItemsList = document.getElementById('crate-items-list');
  const crateWeightBar = document.getElementById('crate-weight-bar');
  const crateWeightText = document.getElementById('crate-weight-text');
  const cratePriceEl = document.getElementById('crate-price');
  const addCrateToCartBtn = document.getElementById('add-crate-to-cart-btn');

  // Checkout Modal Elements
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  const checkoutCloseBtn = document.getElementById('checkout-close-btn');
  const checkoutForm = document.getElementById('checkout-form');
  const orderSuccessModal = document.getElementById('order-success-modal');
  const orderSuccessCloseBtn = document.getElementById('order-success-close-btn');

  // Traceability Scanner Elements
  const batchInput = document.getElementById('batch-search-input');
  const batchSubmitBtn = document.getElementById('batch-search-btn');
  const sampleBatchChips = document.querySelectorAll('.batch-chip');
  const batchResultCard = document.getElementById('batch-result-display');

  // ==========================================
  // RENDER JOURNEY CHAPTERS
  // ==========================================
  function renderJourneyStages() {
    if (!stagesContainer) return;
    stagesContainer.innerHTML = '';

    FARM_JOURNEY_STAGES.forEach((st, idx) => {
      const section = document.createElement('section');
      section.className = `journey-chapter-card stage-step-${st.step}`;
      section.id = st.id;
      section.dataset.stepIndex = idx;

      section.innerHTML = `
        <div class="chapter-content-grid">
          <div class="chapter-visual-wrapper">
            <div class="chapter-image-frame glass-panel">
              <img src="${st.image}" alt="${st.title}" class="chapter-main-img" loading="lazy" />
              <div class="chapter-badge">
                <span class="step-num">STAGE 0${st.step}</span>
                <span class="step-telugu">${st.telugu}</span>
              </div>
              <div class="nature-overlay-gradient"></div>
            </div>
            ${st.secondaryImage ? `
              <div class="chapter-secondary-floating glass-panel">
                <img src="${st.secondaryImage}" alt="Authentic Farmer" />
                <div class="farmer-tag">
                  <strong>Appala Naidu</strong>
                  <span>Generational Farmer, Pendurthi</span>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="chapter-narrative glass-panel">
            <div class="chapter-tag">
              <span class="location-pin-icon">📍</span> ${st.location}
            </div>
            <h2 class="chapter-title">${st.title}</h2>
            <h3 class="chapter-subtitle">${st.subtitle}</h3>
            
            <blockquote class="chapter-quote">
              "${st.quote}"
            </blockquote>

            <div class="chapter-details-grid">
              ${st.details.map(d => `
                <div class="detail-box">
                  <span class="detail-label">${d.label}</span>
                  <strong class="detail-value">${d.value}</strong>
                </div>
              `).join('')}
            </div>

            <div class="chapter-action-bar">
              <button class="btn btn-secondary jump-to-shop-btn" data-stage="${idx}">
                <span>Explore Stage Produce</span>
                <span class="btn-arrow">→</span>
              </button>
              <div class="purity-verified-stamp">
                <span class="stamp-icon">🛡️</span>
                <span>Visakhapatnam Organic Certified</span>
              </div>
            </div>
          </div>
        </div>
      `;

      stagesContainer.appendChild(section);
    });

    // Attach stage production links
    document.querySelectorAll('.jump-to-shop-btn').forEach(b => {
      b.addEventListener('click', () => {
        const target = document.getElementById('products-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          if (window.natureAudio) window.natureAudio.playWoodClick();
        }
      });
    });

    setupScrollObserver();
  }

  // ==========================================
  // SCROLL OBSERVER & 3D CAMERA SYNC
  // ==========================================
  function setupScrollObserver() {
    const chapters = document.querySelectorAll('.journey-chapter-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepIdx = parseInt(entry.target.dataset.stepIndex, 10);
          updateActiveStage(stepIdx);
        }
      });
    }, { threshold: 0.45 });

    chapters.forEach(ch => observer.observe(ch));

    // Window scroll percentage tracker for smooth continuous 3D camera travel
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

      if (farmWorld) {
        farmWorld.setScrollProgress(progress);
      }
    }, { passive: true });
  }

  function updateActiveStage(stepIdx) {
    state.currentStageIndex = stepIdx;

    // Update nav pills
    stageNavButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === stepIdx);
    });

    // Update 3D camera
    if (farmWorld) {
      farmWorld.setStageIndex(stepIdx);
    }
  }

  // Nav pills click handlers
  stageNavButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const stepIdx = parseInt(btn.dataset.step, 10);
      const targetId = FARM_JOURNEY_STAGES[stepIdx]?.id;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        if (window.natureAudio) window.natureAudio.playWoodClick();
      }
    });
  });

  // ==========================================
  // RENDER PRODUCTS
  // ==========================================
  function renderProducts(category = 'all') {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filtered = category === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.category === category);

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-organic-card glass-panel';
      card.dataset.id = p.id;

      card.innerHTML = `
        <div class="product-top-meta">
          <span class="product-origin-pill">
            <span class="coord-dot"></span> ${p.origin.split(',')[0]}
          </span>
          <span class="product-purity-badge">${p.badge}</span>
        </div>

        <div class="product-preview-3d-box" data-id="${p.id}">
          <div class="turntable-preview-trigger">
            <div class="hologram-ring"></div>
            <span class="inspect-tag">⟲ CLICK TO INSPECT IN 3D</span>
            <div class="interactive-produce-icon">
              ${getProductEmoji(p.modelType)}
            </div>
          </div>
        </div>

        <div class="product-info-block">
          <div class="product-cat-name">${p.categoryLabel}</div>
          <h3 class="product-title">${p.name}</h3>
          <div class="product-telugu">${p.teluguName}</div>
          <p class="product-desc">${p.shortDesc}</p>

          <div class="product-purity-metrics">
            <div class="metric-pill">
              <span class="m-val">0.00%</span>
              <span class="m-lbl">Pesticides</span>
            </div>
            <div class="metric-pill">
              <span class="m-val">NABL</span>
              <span class="m-lbl">Lab Tested</span>
            </div>
            <div class="metric-pill">
              <span class="m-val">₹${p.price}</span>
              <span class="m-lbl">${p.unit}</span>
            </div>
          </div>

          <div class="product-card-actions">
            <button class="btn btn-secondary open-3d-btn" data-id="${p.id}">
              <span>Inspect 3D</span>
            </button>
            <button class="btn btn-primary add-to-cart-btn" data-id="${p.id}">
              <span>Add to Crate</span>
              <span class="btn-icon">+</span>
            </button>
          </div>
        </div>
      `;

      productsGrid.appendChild(card);
    });

    // Attach Product Event Handlers
    document.querySelectorAll('.open-3d-btn, .product-preview-3d-box').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.dataset.id || el.closest('.product-organic-card').dataset.id;
        openProduct3DModal(id);
      });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        addToCart(id);
      });
    });
  }

  function getProductEmoji(modelType) {
    switch (modelType) {
      case 'bottle_oil': return '🫒';
      case 'honey_jar': return '🍯';
      case 'clay_pot_millets': return '🌾';
      case 'heirloom_fruit': return '🥭';
      case 'spice_mortar': return '🌶️';
      case 'botanical_tin': return '🌿';
      default: return '🌱';
    }
  }

  // Filter category buttons
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category;
      renderProducts(state.activeCategory);
      if (window.natureAudio) window.natureAudio.playWoodClick();
    });
  });

  // ==========================================
  // 3D PRODUCT MODAL INSPECTOR
  // ==========================================
  function openProduct3DModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    state.activeProductForModal = product;

    // Populate modal text
    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-telugu').textContent = product.teluguName;
    document.getElementById('modal-product-category').textContent = product.categoryLabel;
    document.getElementById('modal-product-desc').textContent = product.fullDesc;
    document.getElementById('modal-product-price').textContent = `₹${product.price}`;
    document.getElementById('modal-product-unit').textContent = product.unit;
    document.getElementById('modal-product-batch').textContent = product.batchCode;
    document.getElementById('modal-product-farmer').textContent = product.farmer;
    document.getElementById('modal-product-origin').textContent = product.origin;
    document.getElementById('modal-product-coords').textContent = product.coordinates;
    document.getElementById('modal-product-harvest').textContent = product.harvestDate;

    // Purity stats
    document.getElementById('modal-purity-pesticide').textContent = product.purityStats.pesticides;
    document.getElementById('modal-purity-temp').textContent = product.purityStats.coldPressTemp;
    document.getElementById('modal-purity-chemicals').textContent = product.purityStats.chemicals;
    document.getElementById('modal-purity-poly').textContent = product.purityStats.polyphenols;

    // Health benefits list
    const benList = document.getElementById('modal-health-benefits');
    if (benList) {
      benList.innerHTML = product.healthBenefits.map(b => `<li>🌿 ${b}</li>`).join('');
    }

    // Show modal
    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load 3D model into viewer
    setTimeout(() => {
      if (productViewer) {
        productViewer.onResize();
        productViewer.loadProduct(product);
      }
    }, 80);

    if (window.natureAudio) window.natureAudio.playWoodClick();
  }

  function closeProduct3DModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProduct3DModal);
  }

  // Lighting preset buttons in 3D modal
  document.querySelectorAll('.light-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.light-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      if (productViewer) productViewer.setupLighting(preset);
      if (window.natureAudio) window.natureAudio.playWoodClick();
    });
  });

  // Auto rotate toggle
  const autorotateBtn = document.getElementById('modal-autorotate-toggle');
  if (autorotateBtn) {
    autorotateBtn.addEventListener('click', () => {
      if (productViewer) {
        const isRotating = productViewer.toggleAutoRotate();
        autorotateBtn.classList.toggle('active', isRotating);
        autorotateBtn.textContent = isRotating ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF';
      }
    });
  }

  // Modal Add to Cart
  const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');
  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
      if (state.activeProductForModal) {
        addToCart(state.activeProductForModal.id);
        showToast(`🌿 Added ${state.activeProductForModal.name} to your cart`);
      }
    });
  }

  // ==========================================
  // CART SYSTEM
  // ==========================================
  function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        modelType: product.modelType,
        quantity: 1
      });
    }

    updateCartUI();
    showToast(`✓ Added to Crate: ${product.name}`);
    if (window.natureAudio) window.natureAudio.playWoodClick();
  }

  function updateQuantity(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== productId);
    }

    updateCartUI();
    if (window.natureAudio) window.natureAudio.playWoodClick();
  }

  function updateCartUI() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'inline-flex' : 'none';
    });

    if (!cartItemsList) return;

    if (state.cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-state">
          <div class="empty-icon">🧺</div>
          <p>Your Pendurthi farm crate is currently empty.</p>
          <span>Select fresh harvest products to fill your crate.</span>
        </div>
      `;
      if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
      if (cartTotalEl) cartTotalEl.textContent = '₹0';
      return;
    }

    let subtotal = 0;
    cartItemsList.innerHTML = '';

    state.cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item-row';
      itemRow.innerHTML = `
        <div class="cart-item-emoji">${getProductEmoji(item.modelType)}</div>
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span class="unit-tag">${item.unit} • ₹${item.price}</span>
        </div>
        <div class="cart-item-qty-ctrl">
          <button class="qty-btn minus-btn" data-id="${item.id}">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn plus-btn" data-id="${item.id}">+</button>
        </div>
        <div class="cart-item-subtotal">₹${itemTotal}</div>
      `;

      cartItemsList.appendChild(itemRow);
    });

    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal}`;
    if (cartTotalEl) cartTotalEl.textContent = `₹${subtotal}`;

    // Attach qty listeners
    cartItemsList.querySelectorAll('.minus-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1));
    });
    cartItemsList.querySelectorAll('.plus-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
    });
  }

  function openCartDrawer() {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  cartToggleBtns.forEach(b => b.addEventListener('click', openCartDrawer));
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
  const cartCloseBtn = document.getElementById('cart-close-btn');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);

  // ==========================================
  // CUSTOM ECO-CRATE BUILDER
  // ==========================================
  const crateAvailableProduce = [
    { id: "crate-item-1", name: "Heritage Korralu Millets (1kg)", weight: 1.0, price: 135, icon: "🌾" },
    { id: "crate-item-2", name: "Wood-Churned Groundnut Oil (1L)", weight: 0.9, price: 340, icon: "🫒" },
    { id: "crate-item-3", name: "Araku Wild Raw Honey (500g)", weight: 0.5, price: 480, icon: "🍯" },
    { id: "crate-item-4", name: "Organic Hill Mangoes (2kg)", weight: 2.0, price: 220, icon: "🥭" },
    { id: "crate-item-5", name: "Fresh Turmeric & Hill Ginger (1kg)", weight: 1.0, price: 140, icon: "🌿" },
    { id: "crate-item-6", name: "Unpolished Karuppu Kavuni Rice (1kg)", weight: 1.0, price: 210, icon: "🌾" }
  ];

  function renderCrateBuilder() {
    const picker = document.getElementById('crate-item-picker');
    if (!picker) return;

    picker.innerHTML = '';
    crateAvailableProduce.forEach(p => {
      const chip = document.createElement('button');
      chip.className = 'crate-picker-chip glass-panel';
      chip.innerHTML = `
        <span class="chip-icon">${p.icon}</span>
        <span class="chip-title">${p.name}</span>
        <span class="chip-price">+ ₹${p.price}</span>
      `;
      chip.addEventListener('click', () => {
        addItemToCustomCrate(p);
      });
      picker.appendChild(chip);
    });

    updateCustomCrateUI();
  }

  function addItemToCustomCrate(product) {
    const currentWeight = state.customCrate.reduce((w, i) => w + i.weight, 0);
    if (currentWeight + product.weight > 6.5) {
      showToast("⚠️ Maximum crate weight reached (6.5 kg). Ready to harvest!");
      return;
    }

    state.customCrate.push({ ...product, crateUniqueId: Date.now() + Math.random() });
    updateCustomCrateUI();
    showToast(`🌾 Added ${product.name} to custom crate`);
    if (window.natureAudio) window.natureAudio.playWoodClick();
  }

  function removeCrateItem(crateUniqueId) {
    state.customCrate = state.customCrate.filter(i => i.crateUniqueId !== crateUniqueId);
    updateCustomCrateUI();
    if (window.natureAudio) window.natureAudio.playWoodClick();
  }

  function updateCustomCrateUI() {
    if (!crateItemsList) return;

    const totalWeight = state.customCrate.reduce((sum, item) => sum + item.weight, 0);
    const totalPrice = state.customCrate.reduce((sum, item) => sum + item.price, 0);
    const maxCapacity = 6.0;
    const pct = Math.min(100, (totalWeight / maxCapacity) * 100);

    if (crateWeightBar) {
      crateWeightBar.style.width = `${pct}%`;
    }
    if (crateWeightText) {
      crateWeightText.textContent = `${totalWeight.toFixed(1)} kg / 6.0 kg Crate Capacity`;
    }
    if (cratePriceEl) {
      cratePriceEl.textContent = `₹${totalPrice}`;
    }

    if (state.customCrate.length === 0) {
      crateItemsList.innerHTML = `<p class="empty-crate-hint">Click fresh items above to pack your wooden harvest crate.</p>`;
      if (addCrateToCartBtn) addCrateToCartBtn.disabled = true;
      return;
    }

    if (addCrateToCartBtn) addCrateToCartBtn.disabled = false;
    crateItemsList.innerHTML = '';

    state.customCrate.forEach(item => {
      const row = document.createElement('div');
      row.className = 'packed-crate-row glass-panel';
      row.innerHTML = `
        <span class="p-icon">${item.icon}</span>
        <span class="p-name">${item.name}</span>
        <span class="p-price">₹${item.price}</span>
        <button class="remove-crate-item-btn" title="Remove">✕</button>
      `;
      row.querySelector('.remove-crate-item-btn').addEventListener('click', () => {
        removeCrateItem(item.crateUniqueId);
      });
      crateItemsList.appendChild(row);
    });
  }

  if (addCrateToCartBtn) {
    addCrateToCartBtn.addEventListener('click', () => {
      if (state.customCrate.length === 0) return;
      const totalWeight = state.customCrate.reduce((sum, i) => sum + i.weight, 0);
      const totalPrice = state.customCrate.reduce((sum, i) => sum + i.price, 0);

      state.cart.push({
        id: `custom-farm-crate-${Date.now()}`,
        name: `Curated Pendurthi Farm Crate (${totalWeight.toFixed(1)}kg Fresh Harvest)`,
        price: totalPrice,
        unit: `${state.customCrate.length} Items Boxed in Teak Wood Crate`,
        modelType: "clay_pot_millets",
        quantity: 1
      });

      state.customCrate = [];
      updateCustomCrateUI();
      updateCartUI();
      openCartDrawer();
      showToast("🌿 Your custom harvest box is ready in your cart!");
    });
  }

  // ==========================================
  // BATCH TRACEABILITY SCANNER SIMULATOR
  // ==========================================
  function lookupBatch(batchCode) {
    const cleanCode = (batchCode || '').trim().toUpperCase();
    const report = SAMPLE_BATCH_REPORTS[cleanCode];

    if (!batchResultCard) return;

    if (!report) {
      batchResultCard.innerHTML = `
        <div class="batch-not-found glass-panel">
          <span class="warn-icon">🔍</span>
          <h4>Batch Code "${cleanCode}" Not Found in Local Archive</h4>
          <p>Please click one of the verified sample batches above or check the batch stamp on your bottle / jar label.</p>
        </div>
      `;
      return;
    }

    batchResultCard.innerHTML = `
      <div class="batch-report-card glass-panel">
        <div class="batch-card-header">
          <div class="batch-tag-group">
            <span class="batch-status-pill">✓ NABL LAB CERTIFIED</span>
            <span class="batch-num-tag">${cleanCode}</span>
          </div>
          <h3 class="batch-product-name">${report.product}</h3>
        </div>

        <div class="batch-grid-stats">
          <div class="b-stat">
            <span class="b-label">Farmer & Collective</span>
            <strong class="b-value">${report.farmer}</strong>
          </div>
          <div class="b-stat">
            <span class="b-label">Farm Location</span>
            <strong class="b-value">${report.farmLocation}</strong>
          </div>
          <div class="b-stat">
            <span class="b-label">Harvest Date</span>
            <strong class="b-value">${report.harvestDate}</strong>
          </div>
          <div class="b-stat">
            <span class="b-label">Extraction Method</span>
            <strong class="b-value">${report.extractionMethod}</strong>
          </div>
          <div class="b-stat highlight">
            <span class="b-label">Pesticide Residue</span>
            <strong class="b-value text-green">${report.pesticideResidue}</strong>
          </div>
          <div class="b-stat highlight">
            <span class="b-label">Processing Temperature</span>
            <strong class="b-value">${report.extractionTemp}</strong>
          </div>
          <div class="b-stat">
            <span class="b-label">Heavy Metals Screening</span>
            <strong class="b-value">${report.heavyMetals}</strong>
          </div>
          <div class="b-stat">
            <span class="b-label">Nutritional Purity Marker</span>
            <strong class="b-value">${report.vitaminE || report.pollenCount || report.glycemicIndex || '100% Retained'}</strong>
          </div>
        </div>

        <div class="batch-footer-seal">
          <span>🛡️ Verified by Andhra Pradesh Natural Farming & Real Organics Quality Cell</span>
        </div>
      </div>
    `;

    if (window.natureAudio) window.natureAudio.playWoodClick();
  }

  if (batchSubmitBtn) {
    batchSubmitBtn.addEventListener('click', () => {
      lookupBatch(batchInput.value);
    });
  }

  sampleBatchChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const code = chip.dataset.batch;
      if (batchInput) batchInput.value = code;
      lookupBatch(code);
    });
  });

  // ==========================================
  // CHECKOUT MODAL & ORDER CONFIRMATION
  // ==========================================
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast("⚠️ Your cart is empty. Add fresh harvest products first!");
        return;
      }
      closeCartDrawer();
      checkoutModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Summary
      const subtotal = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      document.getElementById('checkout-modal-subtotal').textContent = `₹${subtotal}`;
    });
  }

  if (checkoutCloseBtn) {
    checkoutCloseBtn.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const customerName = document.getElementById('cust-name').value;
      const phone = document.getElementById('cust-phone').value;
      const locality = document.getElementById('cust-locality').value;
      const slot = document.getElementById('cust-slot').value;

      const orderId = `PND-${Math.floor(100000 + Math.random() * 900000)}`;

      // Show success
      checkoutModal.classList.remove('active');
      orderSuccessModal.classList.add('active');

      document.getElementById('success-order-id').textContent = orderId;
      document.getElementById('success-customer-name').textContent = customerName;
      document.getElementById('success-locality').textContent = locality;
      document.getElementById('success-slot').textContent = slot;

      // Clear Cart
      state.cart = [];
      updateCartUI();

      if (window.natureAudio) {
        window.natureAudio.playWoodClick();
        window.natureAudio.playBirdChirp();
      }
    });
  }

  if (orderSuccessCloseBtn) {
    orderSuccessCloseBtn.addEventListener('click', () => {
      orderSuccessModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // ==========================================
  // SOUND TOGGLE
  // ==========================================
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (window.natureAudio) {
        const isSoundOn = window.natureAudio.toggleSound();
        state.isSoundOn = isSoundOn;
        soundToggleBtn.classList.toggle('active', isSoundOn);
        soundToggleBtn.innerHTML = isSoundOn
          ? `<span class="sound-icon">🔊</span> <span>Nature Soundscape: ON</span>`
          : `<span class="sound-icon">🔈</span> <span>Nature Soundscape: OFF</span>`;

        showToast(isSoundOn ? "🌿 Eastern Ghats nature soundscape active" : "Audio muted");
      }
    });
  }

  // ==========================================
  // TOAST NOTIFICATION
  // ==========================================
  function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }

  // ==========================================
  // INITIAL BOOTSTRAP
  // ==========================================
  renderJourneyStages();
  renderProducts('all');
  renderCrateBuilder();
  updateCartUI();

  // Load initial batch in scanner
  lookupBatch('VIZ-PND-OIL-428');
});
