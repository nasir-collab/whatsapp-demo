// WhatsCart - Frontend Controller linking to Node.js Backend Server API

// 1. App State (mirrored from backend)
const state = {
  activeTab: 'dashboard',
  activeCustomer: 'alex',
  stats: { sales: 0, conversion: 0, sessions: 0, orderCount: 0 },
  products: [],
  orders: [],
  activeCustomerData: null,
  lastLogTimestamp: null
};

// 2. DOM Elements Selection
const elements = {
  tabItems: document.querySelectorAll('.nav-item'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  currentTabTitle: document.getElementById('current-tab-title'),
  currentTabDesc: document.getElementById('current-tab-desc'),
  threadItems: document.querySelectorAll('.thread-item'),
  
  // Dashboard indicators
  dashboardSales: document.getElementById('dashboard-sales'),
  dashboardConversion: document.getElementById('dashboard-conversion'),
  dashboardSessions: document.getElementById('dashboard-sessions'),
  recentOrdersTbody: document.getElementById('recent-orders-tbody'),
  inboxUnreadCount: document.getElementById('inbox-unread-count'),
  
  // Merchant Chat Panels
  chatHeaderAvatar: document.getElementById('chat-header-avatar'),
  chatHeaderName: document.getElementById('chat-header-name'),
  merchantMessagesContainer: document.getElementById('merchant-messages-container'),
  merchantReplyInput: document.getElementById('merchant-reply-input'),
  btnSendMerchantReply: document.getElementById('btn-send-merchant-reply'),
  btnTakeover: document.getElementById('btn-takeover'),
  btnToggleCrm: document.getElementById('btn-toggle-crm'),
  crmDrawer: document.querySelector('.crm-drawer'),
  
  // CRM Panels
  crmAvatar: document.getElementById('crm-avatar'),
  crmName: document.getElementById('crm-name'),
  crmPhone: document.getElementById('crm-phone'),
  crmActiveState: document.getElementById('crm-active-state'),
  crmAddress: document.getElementById('crm-address'),
  crmNotes: document.querySelector('.crm-notes'),
  btnSyncShopify: document.querySelector('.sync-actions-row button'),
  
  // Utilities
  btnTemplatesDropdown: document.getElementById('btn-templates-dropdown'),
  templatesMenu: document.getElementById('templates-menu'),
  btnPushCatalog: document.getElementById('btn-push-catalog'),
  pushProductsMenu: document.getElementById('push-products-menu'),
  
  // WhatsApp Simulator
  waMessagesLog: document.getElementById('wa-messages-log'),
  waUserInput: document.getElementById('wa-user-input'),
  btnSendWaMessage: document.getElementById('btn-send-wa-message'),
  waSendIcon: document.getElementById('wa-send-icon'),
  
  // WhatsApp Catalog/Cart/Payment
  waCatalogModal: document.getElementById('wa-catalog-modal'),
  btnCloseWaCatalog: document.getElementById('btn-close-wa-catalog'),
  btnWaViewCart: document.getElementById('btn-wa-view-cart'),
  waCartBadge: document.getElementById('wa-cart-badge'),
  waCatalogProductsContainer: document.getElementById('wa-catalog-products-container'),
  
  waCartModal: document.getElementById('wa-cart-modal'),
  btnCloseWaCart: document.getElementById('btn-close-wa-cart'),
  waCartItemsContainer: document.getElementById('wa-cart-items-container'),
  waCartTotalVal: document.getElementById('wa-cart-total-val'),
  btnWaConfirmOrder: document.getElementById('btn-wa-confirm-order'),
  
  waPaymentModal: document.getElementById('wa-payment-modal'),
  payModalAmount: document.getElementById('pay-modal-amount'),
  btnPaySubmit: document.getElementById('btn-pay-submit'),
  btnPayCancel: document.getElementById('btn-pay-cancel'),
  
  // Catalog View Panel
  catalogProductsGrid: document.getElementById('catalog-products-grid'),
  btnOpenAddProductModal: document.getElementById('btn-add-product'),
  productModal: document.getElementById('product-modal'),
  btnCloseProductModal: document.getElementById('btn-close-product-modal'),
  productForm: document.getElementById('product-form'),
  
  // Campaigns Panel
  campaignsContainer: document.getElementById('campaigns-container'),
  btnOpenCampaignModal: document.getElementById('btn-schedule-campaign'),
  btnQuickBroadcast: document.getElementById('btn-quick-broadcast'),
  campaignModal: document.getElementById('campaign-modal'),
  btnCloseCampaignModal: document.getElementById('btn-close-campaign-modal'),
  campaignForm: document.getElementById('campaign-form'),

  // Webhook Logs Console
  terminalLogsBody: document.getElementById('terminal-logs-body'),
  btnClearLogs: document.getElementById('btn-clear-logs')
};

// 3. API Communication Layer
const API = {
  async getStats() {
    const res = await fetch('/api/stats');
    return res.json();
  },
  async getProducts() {
    const res = await fetch('/api/products');
    return res.json();
  },
  async getOrders() {
    const res = await fetch('/api/orders');
    return res.json();
  },
  async getCustomer(id) {
    const res = await fetch(`/api/customers/${id}`);
    return res.json();
  },
  async getCustomers() {
    const res = await fetch('/api/customers');
    return res.json();
  },
  async updateCustomer(id, data) {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async addProduct(prod) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    return res.json();
  },
  async sendMerchantMessage(customerId, text) {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, text })
    });
    return res.json();
  },
  async sendWebhook(from, type, text, payload = null) {
    const res = await fetch('/api/webhook/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, type, text, payload })
    });
    return res.json();
  },
  async getLogs() {
    const res = await fetch('/api/logs');
    return res.json();
  },
  async clearLogs() {
    const res = await fetch('/api/logs/clear', { method: 'POST' });
    return res.json();
  }
};

// 4. Tab Routing Logic
elements.tabItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tabName = item.getAttribute('data-tab');
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  state.activeTab = tabName;
  
  elements.tabItems.forEach(item => {
    if(item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  elements.tabPanels.forEach(panel => {
    if(panel.id === `tab-${tabName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
  
  const titles = {
    dashboard: { title: 'Dashboard Overview', desc: 'Real-time conversational sales performance metrics.' },
    inbox: { title: 'Unified WhatsApp Inbox', desc: 'Manage automated chats and take over customer conversations.' },
    catalog: { title: 'eCommerce Catalog Sync', desc: 'Sync inventory, pricing, and push products directly into WhatsApp.' },
    campaigns: { title: 'WhatsApp Marketing Broadcasts', desc: 'Send approved templates, schedule sales blasts, and measure conversion.' },
    settings: { title: 'Console Settings', desc: 'Configure Meta Cloud APIs, API secrets, and store sync variables.' }
  };
  
  elements.currentTabTitle.textContent = titles[tabName].title;
  elements.currentTabDesc.textContent = titles[tabName].desc;
  
  if(tabName === 'dashboard') {
    refreshDashboard();
  } else if(tabName === 'inbox') {
    refreshInbox();
  } else if(tabName === 'catalog') {
    refreshCatalogView();
  }
}

// 5. Dashboard Refresh
async function refreshDashboard() {
  try {
    state.stats = await API.getStats();
    state.orders = await API.getOrders();
    
    // Update metric cards
    elements.dashboardSales.textContent = `$${state.stats.sales.toFixed(2)}`;
    elements.dashboardSessions.textContent = state.stats.sessions;
    elements.dashboardConversion.textContent = `${state.stats.conversion}%`;
    
    // Render orders
    elements.recentOrdersTbody.innerHTML = '';
    state.orders.forEach(ord => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ord.id}</td>
        <td>${ord.customer}</td>
        <td>${ord.products}</td>
        <td><span class="status-badge ${ord.status}">${ord.status.toUpperCase()}</span></td>
        <td>${ord.total}</td>
        <td><i class="fa-solid ${ord.source === 'chatbot' ? 'fa-robot' : 'fa-user-tie'} bot-icon"></i> ${ord.source === 'chatbot' ? 'Chatbot' : 'Agent'}</td>
      `;
      elements.recentOrdersTbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error refreshing dashboard UI', err);
  }
}

// 6. Catalog Rendering
async function refreshCatalogView() {
  try {
    state.products = await API.getProducts();
    
    elements.catalogProductsGrid.innerHTML = '';
    elements.pushProductsMenu.innerHTML = '';
    elements.waCatalogProductsContainer.innerHTML = '';
    
    state.products.forEach(p => {
      // 1. Dashboard Catalog Grid
      const card = document.createElement('div');
      card.className = 'catalog-card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <div class="catalog-card-body">
          <div class="catalog-card-meta">
            <h4>${p.name}</h4>
            <p>${p.desc}</p>
          </div>
          <div class="catalog-card-footer">
            <span class="prod-price-badge">$${p.price.toFixed(2)}</span>
            <span class="catalog-sku">${p.sku}</span>
          </div>
        </div>
      `;
      elements.catalogProductsGrid.appendChild(card);
      
      // 2. Chat view Catalog Pusher Links
      const pushLink = document.createElement('a');
      pushLink.href = '#';
      pushLink.innerHTML = `📦 ${p.name} <span style="font-weight:700;">$${p.price.toFixed(2)}</span>`;
      pushLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.pushProductsMenu.classList.remove('show');
        pushProductCard(p.id);
      });
      elements.pushProductsMenu.appendChild(pushLink);
      
      // 3. Customer-facing WhatsApp in-app Catalog
      const waItem = document.createElement('div');
      waItem.className = 'wa-catalog-item';
      waItem.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <div class="wa-catalog-item-info">
          <span class="wa-catalog-item-name">${p.name}</span>
          <span class="wa-catalog-item-price">$${p.price.toFixed(2)}</span>
          <div class="wa-catalog-item-actions">
            <button class="btn-wa-add-cart" data-id="${p.id}"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
            <button class="btn-wa-buy-now" data-id="${p.id}"><i class="fa-solid fa-bolt"></i> Buy Now</button>
          </div>
        </div>
      `;
      elements.waCatalogProductsContainer.appendChild(waItem);
    });
    
  } catch (err) {
    console.error('Error loading products list', err);
  }
}

// Update navigation unread badge dynamically based on customer states
function updateSidebarUnreadCount(customers) {
  if (!elements.inboxUnreadCount) return;
  const count = Object.values(customers).filter(c => c.state === 'STATE_WAITING_AGENT').length;
  if (count > 0) {
    elements.inboxUnreadCount.style.display = 'inline-block';
    elements.inboxUnreadCount.textContent = count;
  } else {
    elements.inboxUnreadCount.style.display = 'none';
  }
}

// Render left sidebar threads dynamically from backend database
async function refreshThreadList() {
  try {
    const customers = await API.getCustomers();
    updateSidebarUnreadCount(customers);
    
    const threadsContainer = document.querySelector('.threads-container');
    if (!threadsContainer) return;
    
    threadsContainer.innerHTML = '';
    
    Object.values(customers).forEach(cust => {
      const isActive = cust.id === state.activeCustomer;
      const lastMsg = cust.chatHistory[cust.chatHistory.length - 1] || { text: 'No messages yet', time: '' };
      
      let previewText = lastMsg.text;
      if(previewText.length > 35) {
        previewText = previewText.substring(0, 35) + '...';
      }
      
      const isWaiting = cust.state === 'STATE_WAITING_AGENT';
      
      const threadItem = document.createElement('div');
      threadItem.className = `thread-item ${isActive ? 'active' : ''}`;
      threadItem.setAttribute('data-customer-id', cust.id);
      
      threadItem.innerHTML = `
        <img src="${cust.avatar}" alt="${cust.name}" class="avatar">
        <div class="thread-details">
          <div class="thread-meta">
            <h4 class="customer-name">${cust.name}</h4>
            <span class="message-time">${lastMsg.time || ''}</span>
          </div>
          <div class="thread-preview">
            <p id="thread-preview-${cust.id}">${previewText}</p>
            ${isWaiting ? `<span class="unread-badge">1</span>` : ''}
          </div>
        </div>
      `;
      
      threadItem.addEventListener('click', () => {
        state.activeCustomer = cust.id;
        refreshInbox();
      });
      
      threadsContainer.appendChild(threadItem);
    });
  } catch (err) {
    console.error('Error refreshing thread list', err);
  }
}

// 7. Inbox & Shared Chat logic
async function refreshInbox() {
  try {
    state.activeCustomerData = await API.getCustomer(state.activeCustomer);
    const customer = state.activeCustomerData;
    
    await refreshThreadList();
    
    // Update header details
    elements.chatHeaderAvatar.src = customer.avatar;
    elements.chatHeaderName.textContent = customer.name;
    
    // Update CRM Drawer
    elements.crmAvatar.src = customer.avatar;
    elements.crmName.textContent = customer.name;
    elements.crmPhone.textContent = customer.phone;
    elements.crmActiveState.textContent = customer.state;
    elements.crmAddress.textContent = customer.address || 'Not Provided';
    if(elements.crmNotes) {
      elements.crmNotes.value = customer.notes || '';
    }
    
    // Render Dashboard Chats (Merchant perspective)
    elements.merchantMessagesContainer.innerHTML = '';
    customer.chatHistory.forEach(msg => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.sender === 'customer' ? 'received' : 'sent'}`;
      
      let bubbleContent = '';
      if(msg.isTemplate) {
        bubbleContent = `
          <div class="merchant-bubble merchant-template-bubble">
            <span class="template-header-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> Template: ${msg.templateType}</span>
            <p>${msg.text}</p>
            <div class="bubble-meta">
              <span class="bubble-sender-tag">BOT (Auto)</span>
              <span>${msg.time}</span>
            </div>
          </div>
        `;
      } else if (msg.isProductCard) {
        const prod = state.products.find(p => p.id === msg.productId) || { name: 'Product', price: 0, image: '' };
        bubbleContent = `
          <div class="merchant-bubble">
            <p style="margin-bottom: 8px;"><em>Sent interactive product card:</em></p>
            <div class="wa-product-card" style="width: 100%; border:none;">
              <img src="${prod.image}" style="height: 80px; width:100%; object-fit:cover;">
              <div class="wa-product-info">
                <span class="wa-product-title">${prod.name}</span>
                <span class="wa-product-price">$${prod.price.toFixed(2)}</span>
              </div>
            </div>
            <div class="bubble-meta">
              <span class="bubble-sender-tag">${msg.sender === 'bot' ? 'BOT' : 'YOU'}</span>
              <span>${msg.time}</span>
            </div>
          </div>
        `;
      } else {
        bubbleContent = `
          <div class="merchant-bubble">
            <p>${msg.text}</p>
            <div class="bubble-meta">
              <span class="bubble-sender-tag">${msg.sender === 'customer' ? 'CUSTOMER' : (msg.sender === 'bot' ? 'BOT' : 'YOU')}</span>
              <span>${msg.time}</span>
            </div>
          </div>
        `;
      }
      row.innerHTML = bubbleContent;
      elements.merchantMessagesContainer.appendChild(row);
    });
    
    elements.merchantMessagesContainer.scrollTop = elements.merchantMessagesContainer.scrollHeight;
    
    // Sync to iPhone
    renderiPhoneSimulator();
    
  } catch (err) {
    console.error('Error refreshing active thread', err);
  }
}

// 8. Render Phone simulator UI
function renderiPhoneSimulator() {
  const customer = state.activeCustomerData;
  if(!customer) return;
  
  elements.waMessagesLog.innerHTML = '';
  
  customer.chatHistory.forEach(msg => {
    const wrapper = document.createElement('div');
    wrapper.className = `wa-msg-wrapper ${msg.sender === 'customer' ? 'outgoing' : 'incoming'}`;
    
    let bubbleContent = '';
    if(msg.isTemplate) {
      let buttonsHtml = '';
      if(msg.templateType === 'welcome') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-open-catalog" id="btn-wa-open-catalog"><i class="fa-solid fa-store"></i> View Catalog</button>
            <button class="wa-action-btn btn-wa-agent-talk" id="btn-wa-agent-talk"><i class="fa-solid fa-user-tie"></i> Talk to Agent</button>
          </div>
        `;
      } else if (msg.templateType === 'flash_sale') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-open-catalog" id="btn-wa-open-catalog">🔥 Shop Sale</button>
          </div>
        `;
      } else if (msg.templateType === 'campaign_packages') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-pkg" data-pkg-name="Glow Starter Kit" data-pkg-price="29.00" data-pkg-sku="GLOW-START-01" data-pkg-image="images/glow_serum.png">Glow Starter Kit ($29.00)</button>
            <button class="wa-action-btn btn-wa-pkg" data-pkg-name="Hydration Deluxe" data-pkg-price="45.00" data-pkg-sku="HYDRO-DELUX-02" data-pkg-image="images/glow_serum.png">Hydration Deluxe ($45.00)</button>
            <button class="wa-action-btn btn-wa-pkg" data-pkg-name="Silk Luxury Bundle" data-pkg-price="60.00" data-pkg-sku="SILK-LUX-03" data-pkg-image="images/silk_mask.png">Silk Luxury Bundle ($60.00)</button>
          </div>
        `;
      } else if (msg.templateType === 'payment_reminder') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-pay"><i class="fa-solid fa-credit-card"></i> Pay Now</button>
          </div>
        `;
      }
      bubbleContent = `
        <div class="wa-bubble">
          <p>${msg.text}</p>
          ${buttonsHtml}
          <div class="wa-msg-time">${msg.time}</div>
        </div>
      `;
    } else if (msg.isProductCard) {
      const prod = state.products.find(p => p.id === msg.productId) || { name: 'Product', price: 0, image: '' };
      bubbleContent = `
        <div class="wa-bubble" style="padding:0; overflow:hidden;">
          <div class="wa-product-card">
            <img src="${prod.image}">
            <div class="wa-product-info">
              <div class="wa-product-title">${prod.name}</div>
              <div class="wa-product-price">$${prod.price.toFixed(2)}</div>
            </div>
          </div>
          <div class="wa-interactive-buttons" style="border:none; margin:0; padding:4px;">
            <button class="wa-action-btn btn-wa-quick-add" data-id="${prod.id}">Add to Cart</button>
          </div>
          <div class="wa-msg-time" style="padding: 0 8px 4px 0;">${msg.time}</div>
        </div>
      `;
    } else {
      bubbleContent = `
        <div class="wa-bubble">
          <p>${msg.text}</p>
          <div class="wa-msg-time">
            ${msg.time}
            ${msg.sender === 'customer' ? '<i class="fa-solid fa-check-double"></i>' : ''}
          </div>
        </div>
      `;
    }
    
    wrapper.innerHTML = bubbleContent;
    elements.waMessagesLog.appendChild(wrapper);
  });
  
  elements.waMessagesLog.scrollTop = elements.waMessagesLog.scrollHeight;
  elements.waCartBadge.textContent = customer.cart.length;
}

// Thread selection is now handled dynamically in refreshThreadList()

// Merchant sends reply text
async function sendMerchantReply() {
  const text = elements.merchantReplyInput.value.trim();
  if(!text) return;
  
  await API.sendMerchantMessage(state.activeCustomer, text);
  elements.merchantReplyInput.value = '';
  refreshInbox();
  
  // update preview text
  const preview = document.getElementById(`thread-preview-${state.activeCustomer}`);
  if(preview) preview.textContent = text;
}

elements.btnSendMerchantReply.addEventListener('click', sendMerchantReply);
elements.merchantReplyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMerchantReply();
  }
});

// Push templates
elements.btnTemplatesDropdown.addEventListener('click', () => {
  elements.templatesMenu.classList.toggle('show');
});

document.querySelectorAll('#templates-menu a').forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const type = link.getAttribute('data-template');
    elements.templatesMenu.classList.remove('show');
    
    let text = '';
    if (type === 'welcome') text = '👋 Welcome to WhatsCart Shop! Tap the button below to browse our latest skincare catalog.';
    if (type === 'flash_sale') text = '🔥 Summer FLASH SALE! Get 20% off all Hydrating Glow Serums for the next 2 hours only. Tap below to buy!';
    if (type === 'payment_reminder') text = '💳 WhatsCart Reminder: Your order cart checkout is incomplete. Tap pay now to complete your purchase.';
    
    // Simulate push via API logs
    await API.sendWebhook(state.activeCustomer, 'text', `[Template Push] ${type}`);
    // Manually force backend append
    refreshInbox();
  });
});

// Push product card
elements.btnPushCatalog.addEventListener('click', () => {
  elements.pushProductsMenu.classList.toggle('show');
});

async function pushProductCard(productId) {
  const prod = state.products.find(p => p.id === productId);
  await API.sendWebhook(state.activeCustomer, 'text', `[Product Push] ${prod.name}`);
  refreshInbox();
}

// Inbound Customer Actions (iPhone simulator)
elements.btnCloseWaCatalog.addEventListener('click', () => {
  elements.waCatalogModal.classList.remove('show');
});

elements.btnWaViewCart.addEventListener('click', () => {
  elements.waCatalogModal.classList.remove('show');
  elements.waCartModal.classList.add('show');
  renderCustomerCartHTML();
});

elements.btnCloseWaCart.addEventListener('click', () => {
  elements.waCartModal.classList.remove('show');
  elements.waCatalogModal.classList.add('show');
});

// Listen for clicks inside the Catalog products overlay (Event Delegation)
elements.waCatalogProductsContainer.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.btn-wa-add-cart');
  if (addBtn) {
    const id = addBtn.getAttribute('data-id');
    addProductToSimCart(id);
    return;
  }
  
  const buyBtn = e.target.closest('.btn-wa-buy-now');
  if (buyBtn) {
    const id = buyBtn.getAttribute('data-id');
    elements.waCatalogModal.classList.remove('show');
    window.open(`/payment.html?customerId=${state.activeCustomer}&buyNowProduct=${id}`, '_blank');
  }
});

// Show an elegant toast inside the phone simulator
function showSimToast(message) {
  const screen = document.querySelector('.iphone-screen');
  if (!screen) return;
  
  const oldToast = screen.querySelector('.wa-toast');
  if (oldToast) oldToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'wa-toast';
  toast.style.position = 'absolute';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(23, 32, 43, 0.95)';
  toast.style.color = '#F1F5F9';
  toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '1000';
  toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  toast.style.whiteSpace = 'nowrap';
  toast.style.opacity = '0';
  toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--primary-color);"></i> ${message}`;
  
  screen.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-5px)';
  }, 10);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(5px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function addProductToSimCart(productId) {
  const customer = state.activeCustomerData;
  const prod = state.products.find(p => p.id === productId);
  
  customer.cart.push(prod);
  elements.waCartBadge.textContent = customer.cart.length;
  showSimToast(`${prod.name} added to cart!`);
}

function renderCustomerCartHTML() {
  const customer = state.activeCustomerData;
  elements.waCartItemsContainer.innerHTML = '';
  
  let total = 0;
  customer.cart.forEach(item => {
    total += item.price;
    const row = document.createElement('div');
    row.className = 'wa-cart-item-row';
    row.innerHTML = `
      <div class="wa-cart-item-details">
        <span>${item.name}</span>
        <em>SKU: ${item.sku}</em>
      </div>
      <span class="wa-cart-item-price">$${item.price.toFixed(2)}</span>
    `;
    elements.waCartItemsContainer.appendChild(row);
  });
  elements.waCartTotalVal.textContent = `$${total.toFixed(2)}`;
}

// Customer sends cart checkout webhook
elements.btnWaConfirmOrder.addEventListener('click', async () => {
  const customer = state.activeCustomerData;
  if(customer.cart.length === 0) return;
  
  await API.sendWebhook(state.activeCustomer, 'cart_submission', '', customer.cart);
  elements.waCartModal.classList.remove('show');
  
  // Refresh active details
  refreshInbox();
});

// Customer sends standard text input
async function sendWaText() {
  const text = elements.waUserInput.value.trim();
  if(!text) return;
  
  await API.sendWebhook(state.activeCustomer, 'text', text);
  elements.waUserInput.value = '';
  
  refreshInbox();
}

elements.btnSendWaMessage.addEventListener('click', sendWaText);
elements.waUserInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendWaText();
});

// Listen for clicks inside the WhatsApp Simulator chat history (Event Delegation)
elements.waMessagesLog.addEventListener('click', async (e) => {
  // 1. Open Catalog Button
  const catalogBtn = e.target.closest('.btn-wa-open-catalog');
  if (catalogBtn) {
    elements.waCatalogModal.classList.add('show');
    return;
  }
  
  // 2. Talk to Agent Button
  const agentBtn = e.target.closest('.btn-wa-agent-talk');
  if (agentBtn) {
    await API.sendWebhook(state.activeCustomer, 'button_click', 'Talk to Agent');
    setTimeout(refreshInbox, 500);
    return;
  }
  
  // 3. Quick Add Product Button
  const quickAddBtn = e.target.closest('.btn-wa-quick-add');
  if (quickAddBtn) {
    const id = quickAddBtn.getAttribute('data-id');
    addProductToSimCart(id);
    return;
  }
  
  // 4. Select Campaign Package Button
  const pkgBtn = e.target.closest('.btn-wa-pkg');
  if (pkgBtn) {
    const name = pkgBtn.getAttribute('data-pkg-name');
    const price = parseFloat(pkgBtn.getAttribute('data-pkg-price'));
    const sku = pkgBtn.getAttribute('data-pkg-sku');
    const image = pkgBtn.getAttribute('data-pkg-image');
    
    await API.sendWebhook(state.activeCustomer, 'campaign_package_select', '', { name, price, sku, image });
    refreshInbox();
    return;
  }
  
  // 5. Pay Now Button
  const payBtn = e.target.closest('.btn-wa-pay') || (e.target.closest('.wa-action-btn') && e.target.textContent.toLowerCase().includes('pay now'));
  if (payBtn) {
    openCheckoutGateway();
    return;
  }
});

function openCheckoutGateway() {
  window.open(`/payment.html?customerId=${state.activeCustomer}`, '_blank');
}

elements.btnPayCancel.addEventListener('click', () => {
  elements.waPaymentModal.classList.remove('show');
});

elements.btnPaySubmit.addEventListener('click', async () => {
  const customer = state.activeCustomerData;
  const total = customer.cart.reduce((sum, p) => sum + p.price, 0);
  
  elements.btnPaySubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
  
  await API.sendWebhook(state.activeCustomer, 'payment', '', { amount: total });
  
  setTimeout(() => {
    elements.btnPaySubmit.textContent = `Pay Securely`;
    elements.waPaymentModal.classList.remove('show');
    refreshInbox();
    refreshDashboard();
    alert(`🎉 Client Presentation: Order checkout completed on backend server!`);
  }, 1200);
});

// Catalog Add Form handler
elements.productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('prod-name').value.trim();
  const price = parseFloat(document.getElementById('prod-price').value);
  const sku = document.getElementById('prod-sku').value.trim();
  const image = document.getElementById('prod-image').value.trim();
  const desc = document.getElementById('prod-desc').value.trim();
  
  await API.addProduct({ name, price, sku, image, desc });
  
  elements.productForm.reset();
  elements.productModal.classList.remove('show');
  
  refreshCatalogView();
});

elements.btnOpenAddProductModal.addEventListener('click', () => {
  elements.productModal.classList.add('show');
});

elements.btnCloseProductModal.addEventListener('click', () => {
  elements.productModal.classList.remove('show');
});

// Broadcast schedule simulation
elements.btnOpenCampaignModal.addEventListener('click', () => elements.campaignModal.classList.add('show'));
elements.btnQuickBroadcast.addEventListener('click', () => elements.campaignModal.classList.add('show'));
elements.btnCloseCampaignModal.addEventListener('click', () => elements.campaignModal.classList.remove('show'));

elements.campaignForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('camp-name').value.trim();
  const template = document.getElementById('camp-template').value;
  
  elements.campaignModal.classList.remove('show');
  
  // Submit mock event to webhook stream
  await API.sendWebhook(state.activeCustomer, 'text', `[Campaign Broadcast Schedule] Title: "${title}", Template: ${template}`);
  
  const row = document.createElement('div');
  row.className = 'campaign-row';
  row.innerHTML = `
    <div class="campaign-info">
      <h4>🔥 ${title} (Approved Template)</h4>
      <p>Sent to: <strong>All active subscribers (412 users)</strong> • Just now</p>
    </div>
    <div class="campaign-performance">
      <div class="perf-metric"><span class="num">Sending...</span><span class="lbl">Sent</span></div>
      <div class="perf-metric"><span class="num text-green">-</span><span class="lbl">Read</span></div>
      <div class="perf-metric"><span class="num text-blue">-</span><span class="lbl">Replied</span></div>
    </div>
    <div class="campaign-status-col"><span class="status-badge pending">Sending</span></div>
  `;
  elements.campaignsContainer.prepend(row);
  elements.campaignForm.reset();
  
  setTimeout(() => {
    row.querySelector('.num').textContent = '412';
    row.querySelector('.text-green').textContent = '96%';
    row.querySelector('.text-blue').textContent = '42%';
    row.querySelector('.campaign-status-col').innerHTML = `<span class="status-badge paid">Completed</span>`;
    refreshInbox();
  }, 2000);
});

// =========================================================================
// TERMINAL VISUALIZER POLLING (REAL-TIME CONSOLE TRAFFIC)
// =========================================================================
async function pollWebhookLogs() {
  try {
    const logs = await API.getLogs();
    
    // Check if new webhook log activity occurred and sync in real-time
    if (logs.length > 0) {
      const latestTimestamp = logs[0].timestamp;
      if (state.lastLogTimestamp && latestTimestamp !== state.lastLogTimestamp) {
        // A new webhook event occurred, refresh active UI components
        refreshInbox();
        if (state.activeTab === 'dashboard') {
          refreshDashboard();
        }
      }
      state.lastLogTimestamp = latestTimestamp;
    }
    
    elements.terminalLogsBody.innerHTML = '';
    
    if(logs.length === 0) {
      elements.terminalLogsBody.innerHTML = `<span style="color:var(--text-dark);">// No active API traffic. Interact with the dashboard or simulator to generate traffic.</span>`;
      return;
    }
    
    logs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `
        <div class="log-meta">
          <span class="log-time">[${log.timestamp}]</span>
          <span class="log-method ${log.log_method || log.method}">${log.method}</span>
          <span class="log-endpoint">${log.endpoint}</span>
        </div>
        <pre class="log-json">${JSON.stringify(log.payload, null, 2)}</pre>
      `;
      elements.terminalLogsBody.appendChild(entry);
    });
  } catch (err) {
    console.error('Error fetching server logs', err);
  }
}

elements.btnClearLogs.addEventListener('click', async () => {
  await API.clearLogs();
  pollWebhookLogs();
});

// Close modals clicking outside
window.addEventListener('click', (e) => {
  if (elements.productModal.contains(e.target) && e.target === elements.productModal) elements.productModal.classList.remove('show');
  if (elements.campaignModal.contains(e.target) && e.target === elements.campaignModal) elements.campaignModal.classList.remove('show');
});

// Bootstrapping page load
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Session check & redirect
  const userJson = localStorage.getItem('whatscart_user');
  if (!userJson) {
    window.location.href = '/login.html';
    return;
  }
  
  const user = JSON.parse(userJson);

  // 2. Populate sidebar profile
  const sidebarAvatar = document.querySelector('.user-profile img.avatar');
  const sidebarName = document.querySelector('.user-profile .user-name');
  const sidebarRole = document.querySelector('.user-profile .user-role');
  
  if (sidebarAvatar) sidebarAvatar.src = user.avatar;
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarRole) sidebarRole.textContent = user.role === 'owner' ? 'Shop Owner' : 'Support Agent';

  // 3. Role-based feature restriction
  if (user.role === 'agent') {
    const catalogTabLink = document.querySelector('.nav-menu a[data-tab="catalog"]');
    const campaignsTabLink = document.querySelector('.nav-menu a[data-tab="campaigns"]');
    if (catalogTabLink) catalogTabLink.style.display = 'none';
    if (campaignsTabLink) campaignsTabLink.style.display = 'none';
    
    // Hide quick template broadcasts or campaign buttons
    const quickBroadcastBtn = document.getElementById('btn-quick-broadcast');
    if (quickBroadcastBtn) quickBroadcastBtn.style.display = 'none';
    
    // Hide settings Shopify storefront sync row completely
    const shopifySyncCard = document.querySelector('.settings-card:nth-child(2)');
    if (shopifySyncCard) shopifySyncCard.style.display = 'none';
  }

  // 4. Bind logout action
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('whatscart_user');
      window.location.href = '/login.html';
    });
  }

  // Bind toggle CRM drawer
  if (elements.btnToggleCrm && elements.crmDrawer) {
    elements.btnToggleCrm.addEventListener('click', () => {
      elements.crmDrawer.classList.toggle('collapsed');
    });
  }

  // Bind takeover button
  if (elements.btnTakeover) {
    elements.btnTakeover.addEventListener('click', async () => {
      await API.sendWebhook(state.activeCustomer, 'text', '[Agent Takeover Request]');
      refreshInbox();
      alert('🤖 Support session manual agent takeover triggered.');
    });
  }

  // Bind CRM notes save
  if (elements.crmNotes) {
    elements.crmNotes.addEventListener('change', async () => {
      await API.updateCustomer(state.activeCustomer, { notes: elements.crmNotes.value });
    });
  }

  // Bind Shopify storefront sync
  if (elements.btnSyncShopify) {
    elements.btnSyncShopify.addEventListener('click', async () => {
      const originalContent = elements.btnSyncShopify.innerHTML;
      elements.btnSyncShopify.disabled = true;
      elements.btnSyncShopify.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> Syncing catalog...`;
      
      try {
        const res = await fetch('/api/shopify/sync', { method: 'POST' });
        const data = await res.json();
        
        setTimeout(() => {
          elements.btnSyncShopify.innerHTML = `<i class="fa-solid fa-check" style="color:var(--primary-color);"></i> Synced!`;
          
          setTimeout(() => {
            elements.btnSyncShopify.disabled = false;
            elements.btnSyncShopify.innerHTML = originalContent;
          }, 2000);
        }, 1500);
      } catch (err) {
        console.error('Error syncing Shopify storefront', err);
        elements.btnSyncShopify.disabled = false;
        elements.btnSyncShopify.innerHTML = originalContent;
      }
    });
  }

  await refreshDashboard();
  await refreshCatalogView();
  await refreshInbox();
  
  // Poll webhook logs every 1.5 seconds
  setInterval(pollWebhookLogs, 1500);
  pollWebhookLogs(); // direct call on load
  
  // Detect campaign referral query string
  const params = new URLSearchParams(window.location.search);
  if (params.get('source') === 'paid_campaign') {
    // Switch to Inbox view
    switchTab('inbox');
    
    // Simulate customer sending pre-filled message
    setTimeout(async () => {
      // Clear url parameter from address bar
      window.history.pushState({}, document.title, window.location.pathname);
      
      // Trigger webhook to mock customer inbound referral message
      await API.sendWebhook(state.activeCustomer, 'text', '[Campaign Referral] Summer Skincare Glow Promo');
      refreshInbox();
    }, 1000);
  }
});
