const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Serve frontend static assets from this directory
app.use(express.static(path.join(__dirname)));

const DB_PATH = path.join(__dirname, 'db.json');
let webhookLogs = []; // Store webhook traffic in memory to display on frontend console

// Helper functions to read/write db.json
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning empty structure', err);
    return { stats: { sales: 0, conversion: 0, sessions: 0, orderCount: 0 }, products: [], customers: {}, orders: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json', err);
  }
}

// Log incoming API/Webhook request to display in frontend terminal
function logWebhookTraffic(method, endpoint, payload) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  webhookLogs.unshift({
    timestamp,
    method,
    endpoint,
    payload: JSON.parse(JSON.stringify(payload))
  });
  // Cap at 20 logs
  if(webhookLogs.length > 20) webhookLogs.pop();
}

const https = require('https');

// Send message to WhatsApp Cloud API if environment variables are set, fallback to simulator logging
function sendWhatsAppMessage(to, payload) {
  // Always log to the terminal visualizer
  logWebhookTraffic('POST', '/v20.0/messages', payload);

  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log('WhatsCart running in Simulator Mode (META_ACCESS_TOKEN / PHONE_NUMBER_ID not set).');
    return;
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');
  const metaPayload = { ...payload, to: cleanPhone };
  const data = JSON.stringify(metaPayload);

  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v20.0/${phoneId}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`Live WhatsApp message status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(body);
        logWebhookTraffic('SYSTEM', 'LIVE_API_DELIVERY', { status: res.statusCode, response: parsed });
      } catch (err) {
        logWebhookTraffic('SYSTEM', 'LIVE_API_DELIVERY', { status: res.statusCode, rawResponse: body });
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Live WhatsApp API delivery failed: ${e.message}`);
    logWebhookTraffic('SYSTEM', 'LIVE_API_ERROR', { error: e.message });
  });

  req.write(data);
  req.end();
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

// Get webhook traffic logs for terminal visualizer
app.get('/api/logs', (req, res) => {
  res.json(webhookLogs);
});

// Clear webhook traffic logs
app.post('/api/logs/clear', (req, res) => {
  webhookLogs = [];
  res.json({ success: true });
});

// Role-Based User Login Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'sarah' && password === 'admin') {
    return res.json({
      success: true,
      user: {
        name: 'Sarah Jenkins',
        username: 'sarah',
        role: 'owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
      }
    });
  } else if (username === 'john' && password === 'agent') {
    return res.json({
      success: true,
      user: {
        name: 'John Support',
        username: 'john',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
      }
    });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

// Get Dashboard KPI Metrics
app.get('/api/stats', (req, res) => {
  const db = readDB();
  res.json(db.stats);
});

// Catalog Management - Get Products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Catalog Management - Add Product
app.post('/api/products', (req, res) => {
  const db = readDB();
  const { name, price, sku, image, desc } = req.body;
  
  if(!name || !price || !sku) {
    return res.status(400).json({ error: 'Missing product fields' });
  }
  
  const newProduct = {
    id: 'prod' + (db.products.length + 1),
    name,
    price: parseFloat(price),
    sku,
    image: image || 'https://images.unsplash.com/photo-1590483736622-39da8af75bba?w=400&auto=format&fit=crop&q=80',
    desc: desc || ''
  };
  
  db.products.push(newProduct);
  writeDB(db);
  
  logWebhookTraffic('POST', '/api/products', { event: 'CATALOG_SYNC_WABA', productId: newProduct.id, sku: newProduct.sku });
  res.json(newProduct);
});

// Order Management - Get Orders list
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// CRM Customer Detail
app.get('/api/customers/:id', (req, res) => {
  const db = readDB();
  const customer = db.customers[req.params.id];
  if(!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// Get all customer summary metadata
app.get('/api/customers', (req, res) => {
  const db = readDB();
  res.json(db.customers);
});

// Update CRM Customer details (e.g., notes, address)
app.put('/api/customers/:id', (req, res) => {
  const db = readDB();
  const customer = db.customers[req.params.id];
  if(!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const { notes, address } = req.body;
  if(notes !== undefined) customer.notes = notes;
  if(address !== undefined) customer.address = address;
  
  writeDB(db);
  
  logWebhookTraffic('PUT', `/api/customers/${req.params.id}`, { event: 'CRM_UPDATE', customerId: req.params.id, notes, address });
  res.json(customer);
});

// Mock Shopify sync endpoint
app.post('/api/shopify/sync', (req, res) => {
  logWebhookTraffic('POST', '/api/shopify/sync', {
    event: 'SHOPIFY_SYNC_TRIGGER',
    store: 'beauty-glow-shop.myshopify.com',
    status: 'SUCCESS',
    syncedProductsCount: 4,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true });
});

// Merchant sends manual chat reply message
app.post('/api/messages', (req, res) => {
  const db = readDB();
  const { customerId, text } = req.body;
  
  const customer = db.customers[customerId];
  if(!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const time = getFormattedTime();
  const newMsg = {
    sender: 'agent',
    text,
    time
  };
  
  // Transition customer status from BOT to waiting agent since human took over
  if(customer.state === 'STATE_SHOPPING') {
    customer.state = 'STATE_WAITING_AGENT';
  }
  
  customer.chatHistory.push(newMsg);
  writeDB(db);
  
  // Log simulated API call to Meta send message endpoint
  sendWhatsAppMessage(customer.phone, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: customer.phone,
    type: 'text',
    text: { body: text }
  });
  
  res.json(customer);
});

// =========================================================================
// MOCK WHATSAPP META WEBHOOK (INBOUND MESSAGES FLOW / STATE MACHINE)
// =========================================================================
app.post('/api/webhook/whatsapp', (req, res) => {
  const db = readDB();
  const { from, type, text, payload } = req.body; // direct webhook simulator inputs
  
  const customer = db.customers[from];
  if(!customer) {
    return res.status(404).json({ error: 'Customer session not found' });
  }
  
  const time = getFormattedTime();
  
  // Create simulation logging data to mimic official Meta Inbound Webhook payload JSON
  const simulatedMetaPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_ID_982312093',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '+919007378887', phone_number_id: 'phone_id_982312480928340' },
          contacts: [{ profile: { name: customer.name }, wa_id: customer.phone.replace(/[^0-9]/g, '') }],
          messages: [{
            from: customer.phone.replace(/[^0-9]/g, ''),
            id: 'wamid.HBgLOTE5MDA3Mzc4ODg3FQIAERg4QzM3Q...',
            timestamp: Math.floor(Date.now() / 1000),
            type: type === 'payment' ? 'interactive' : (type === 'cart_submission' ? 'interactive' : 'text')
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  // Append fields based on type for full visual high fidelity
  const changeValueMsg = simulatedMetaPayload.entry[0].changes[0].value.messages[0];
  if (type === 'text') {
    changeValueMsg.text = { body: text };
  } else if (type === 'cart_submission') {
    changeValueMsg.interactive = {
      type: 'nfm_reply',
      nfm_reply: { response_json: JSON.stringify({ flow: 'checkout', items: payload }) }
    };
  } else if (type === 'payment') {
    changeValueMsg.interactive = {
      type: 'payment_confirm',
      payment: { status: 'success', amount: payload.amount, transaction_id: 'TXN-' + Math.floor(Math.random() * 1000000) }
    };
  }
  
  logWebhookTraffic('POST', '/api/webhook/whatsapp', simulatedMetaPayload);
  
  // 1. Process customer message
  if(type === 'text') {
    // Intercept special developer/console control commands
    if (text === '[Agent Takeover Request]') {
      customer.state = 'STATE_WAITING_AGENT';
      customer.chatHistory.push({
        sender: 'bot',
        text: `🔌 *Sarah Jenkins* has taken over the chat. Automated assistant is paused.`,
        time
      });
      writeDB(db);
      logWebhookTraffic('SYSTEM', '/api/webhook/takeover', { customerId: from, action: 'AGENTS_TAKEOVER' });
      return res.json({ success: true });
    }
    
    if (text.startsWith('[Campaign Broadcast Schedule]')) {
      const template = text.split('Template: ')[1] || 'welcome';
      let templateText = '';
      if (template === 'welcome') templateText = '👋 Welcome to WhatsCart Shop! Tap the button below to browse our latest skincare catalog.';
      else if (template === 'flash_sale') templateText = '🔥 Summer FLASH SALE! Get 20% off all Hydrating Glow Serums for the next 2 hours only. Tap below to buy!';
      else if (template === 'payment_reminder') {
        const total = customer.cart.reduce((sum, p) => sum + p.price, 0) || 29.00;
        templateText = `💳 Secure Payment Invoice\nTotal: *$${total.toFixed(2)}*`;
      }
      
      if (template === 'flash_sale') {
        customer.state = 'STATE_SHOPPING';
      }
      
      customer.chatHistory.push({
        sender: 'bot',
        text: templateText,
        time,
        isTemplate: true,
        templateType: template
      });
      writeDB(db);
      sendWhatsAppMessage(customer.phone, {
        messaging_product: 'whatsapp',
        to: customer.phone,
        type: 'template',
        template: { name: template, language: { code: 'en_US' } }
      });
      return res.json({ success: true });
    }
    
    if (text.startsWith('[Template Push]')) {
      const template = text.split('[Template Push] ')[1];
      let templateText = '';
      if (template === 'welcome') templateText = '👋 Welcome to WhatsCart Shop! Tap the button below to browse our latest skincare catalog.';
      else if (template === 'flash_sale') templateText = '🔥 Summer FLASH SALE! Get 20% off all Hydrating Glow Serums for the next 2 hours only. Tap below to buy!';
      else if (template === 'payment_reminder') {
        const total = customer.cart.reduce((sum, p) => sum + p.price, 0) || 29.00;
        templateText = `💳 Secure Payment Invoice\nTotal: *$${total.toFixed(2)}*`;
      }
      
      customer.chatHistory.push({
        sender: 'bot',
        text: templateText,
        time,
        isTemplate: true,
        templateType: template
      });
      writeDB(db);
      sendWhatsAppMessage(customer.phone, {
        messaging_product: 'whatsapp',
        to: customer.phone,
        type: 'template',
        template: { name: template, language: { code: 'en_US' } }
      });
      return res.json({ success: true });
    }
    
    if (text.startsWith('[Product Push]')) {
      const productName = text.split('[Product Push] ')[1];
      const prod = db.products.find(p => p.name === productName);
      if (prod) {
        customer.chatHistory.push({
          sender: 'bot',
          text: `Sure! Here is our current bestseller:`,
          time,
          isProductCard: true,
          productId: prod.id
        });
        writeDB(db);
        sendWhatsAppMessage(customer.phone, {
          messaging_product: 'whatsapp',
          to: customer.phone,
          type: 'interactive',
          interactive: {
            type: 'product',
            body: { text: 'Bestseller' },
            action: { catalog_id: 'WABA_CATALOG_ID', product_retailer_id: prod.sku }
          }
        });
      }
      return res.json({ success: true });
    }

    customer.chatHistory.push({
      sender: 'customer',
      text: text,
      time
    });
    
    // Evaluate Campaign Referral Trigger
    if (text.includes("Summer Skincare Glow Promo") || text.includes("paid_campaign")) {
      customer.state = 'STATE_CAMPAIGN_FLOW';
      writeDB(db);
      
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        curCust.chatHistory.push({
          sender: 'bot',
          text: `👋 Thank you for claiming our Summer Skincare Promo! Please choose one of our exclusive packages below to continue:`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'campaign_packages'
        });
        writeDB(currentDb);
        
        // Log WABA outbound message
        sendWhatsAppMessage(curCust.phone, {
          messaging_product: 'whatsapp',
          to: curCust.phone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: 'Summer Skincare Promo Packages' },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'pkg_starter', title: 'Glow Starter Kit ($29)' } },
                { type: 'reply', reply: { id: 'pkg_deluxe', title: 'Hydration Deluxe ($45)' } },
                { type: 'reply', reply: { id: 'pkg_luxury', title: 'Silk Luxury ($60)' } }
              ]
            }
          }
        });
      }, 1000);
      return res.json({ success: true });
    }
    
    // Evaluate Bot State Machine
    if(customer.state === 'STATE_AWAITING_ADDRESS') {
      customer.address = text;
      customer.state = 'STATE_AWAITING_PAYMENT';
      writeDB(db);
      
      // Auto-reply with confirm and invoice
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        
        curCust.chatHistory.push({
          sender: 'bot',
          text: `🤖 Shipping address verified: *${text}*\n\nYour invoice is ready. Click below to pay:`,
          time: getFormattedTime()
        });
        
        const total = curCust.cart.reduce((sum, p) => sum + p.price, 0);
        curCust.chatHistory.push({
          sender: 'bot',
          text: `💳 Secure Payment Invoice\nTotal: *$${total.toFixed(2)}*`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'payment_reminder'
        });
        
        writeDB(currentDb);
        
        // Log bot replies going back out to WhatsApp Cloud API
        sendWhatsAppMessage(curCust.phone, {
          messaging_product: 'whatsapp',
          to: curCust.phone,
          type: 'interactive',
          interactive: { type: 'button', body: { text: `💳 Invoice for $${total.toFixed(2)}` } }
        });
      }, 1000);
      
    } else if(customer.state === 'STATE_SHOPPING') {
      // General reply
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        curCust.chatHistory.push({
          sender: 'bot',
          text: `🤖 Hi! Thank you for messaging. I'm the WhatsCart automated assistant. You can browse products by clicking "View Catalog" or type 'help' to connect to Sarah.`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'welcome'
        });
        writeDB(currentDb);
      }, 1200);
    }
    
  } else if (type === 'button_click') {
    customer.chatHistory.push({
      sender: 'customer',
      text: text,
      time
    });
    if (text === 'Talk to Agent') {
      customer.state = 'STATE_WAITING_AGENT';
      writeDB(db);
      
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        curCust.chatHistory.push({
          sender: 'bot',
          text: `🤖 Connecting you to Sarah Jenkins (Shop Owner). They will reply shortly!`,
          time: getFormattedTime()
        });
        writeDB(currentDb);
      }, 1000);
    } else {
      writeDB(db);
    }
  } else if (type === 'campaign_package_select') {
    // Add product to customer's cart
    const pkg = payload;
    customer.cart = [{
      id: 'campaign_pkg',
      name: pkg.name,
      price: pkg.price,
      sku: pkg.sku,
      image: pkg.image || 'images/glow_serum.png',
      desc: 'Special promotional campaign bundle kit.'
    }];
    
    customer.state = 'STATE_AWAITING_PAYMENT';
    customer.chatHistory.push({
      sender: 'customer',
      text: `Selected Package: ${pkg.name} ($${pkg.price.toFixed(2)})`,
      time
    });
    
    writeDB(db);
    
    // Reply automatically with invoice payment link!
    setTimeout(() => {
      const currentDb = readDB();
      const curCust = currentDb.customers[from];
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `🤖 Excellent choice! Your invoice for the *${pkg.name}* is ready. Click below to proceed to the payment gateway:`,
        time: getFormattedTime()
      });
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `💳 Secure Payment Invoice\nTotal: *$${pkg.price.toFixed(2)}*`,
        time: getFormattedTime(),
        isTemplate: true,
        templateType: 'payment_reminder'
      });
      
      writeDB(currentDb);
      
      sendWhatsAppMessage(curCust.phone, {
        messaging_product: 'whatsapp',
        to: curCust.phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: `Pay now for ${pkg.name}` }
        }
      });
    }, 1000);
    
  } else if (type === 'cart_submission') {
    // Save items to customer cart database
    customer.cart = payload;
    customer.state = 'STATE_AWAITING_PAYMENT';
    const total = payload.reduce((sum, p) => sum + p.price, 0);
    const summary = payload.map(p => p.name).join(', ');
    
    customer.chatHistory.push({
      sender: 'customer',
      text: `🛒 Checkout Request: Sent Cart [${summary}] totaling $${total.toFixed(2)}`,
      time
    });
    
    writeDB(db);
    
    // Auto-reply directly with checkout invoice & Pay Now button!
    setTimeout(() => {
      const currentDb = readDB();
      const curCust = currentDb.customers[from];
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `🤖 Order received for *${summary}*! Your checkout invoice is ready. Click below to proceed:`,
        time: getFormattedTime()
      });
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `💳 Secure Payment Invoice\nTotal: *$${total.toFixed(2)}*`,
        time: getFormattedTime(),
        isTemplate: true,
        templateType: 'payment_reminder'
      });
      
      writeDB(currentDb);
      
      sendWhatsAppMessage(curCust.phone, {
        messaging_product: 'whatsapp',
        to: curCust.phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: `Pay now for order ($${total.toFixed(2)})` }
        }
      });
    }, 1000);
    
  } else if (type === 'payment') {
    let total = payload.amount || 0;
    let itemsSummary = '';
    
    if (payload.buyNowProduct) {
      const prod = db.products.find(p => p.id === payload.buyNowProduct);
      if (prod) {
        total = prod.price;
        itemsSummary = prod.name;
      } else {
        itemsSummary = 'Ethnic Garment Item';
      }
    } else {
      total = customer.cart.reduce((sum, p) => sum + p.price, 0) || total;
      itemsSummary = customer.cart.map(p => p.name).join(', ');
      customer.cart = []; // clear cart
    }
    
    const orderId = '#W-' + Math.floor(1000 + Math.random() * 9000);
    
    customer.state = 'STATE_COMPLETED';
    customer.chatHistory.push({
      sender: 'bot',
      text: `✅ Payment Successful!\n\nThank you, *${customer.name}*. Your order *${orderId}* for *${itemsSummary}* has been confirmed.\nWe will notify you here when it ships.`,
      time
    });
    
    // Increment CRM / Order summaries
    db.stats.sales += total;
    db.stats.sessions = Math.max(0, db.stats.sessions - 1);
    db.stats.orderCount += 1;
    
    db.orders.unshift({
      id: orderId,
      customer: customer.name,
      products: itemsSummary,
      status: 'paid',
      total: `$${total.toFixed(2)}`,
      source: 'chatbot'
    });
    
    writeDB(db);
  }
  
  res.json({ success: true });
});

// Helper: Formatted Time
function getFormattedTime() {
  const d = new Date();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

// Start Server listener
app.listen(PORT, () => {
  console.log(`WhatsCart Backend Running on http://localhost:${PORT}`);
  console.log(`Database seeded at ${DB_PATH}`);
  // Add a boot log in the webhook logs
  logWebhookTraffic('SYSTEM', 'BOOT_INITIALIZE', { system: 'WhatsCart', state: 'READY', WABA_NUMBER: '+919007378887' });
});
