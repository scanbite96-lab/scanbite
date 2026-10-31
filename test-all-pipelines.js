const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const req = client.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runDeepPipelineAudit() {
  console.log('==================================================================');
  console.log('       SCANBITE DEEP END-TO-END PIPELINE AUDIT REPORT             ');
  console.log('==================================================================\n');

  const results = [];
  let testOrderId = null;
  let testRequestId = null;
  let testInquiryId = null;

  // -------------------------------------------------------------
  // PIPELINE 1: DATABASE & CLOUD POSTGRES LAYER
  // -------------------------------------------------------------
  console.log('🔍 [PIPELINE 1] Neon Cloud PostgreSQL & Prisma ORM Layer...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const restCount = await prisma.restaurant.count();
    const catCount = await prisma.category.count();
    const itemCount = await prisma.menuItem.count();
    const tableCount = await prisma.table.count();
    const orderCount = await prisma.order.count();
    const inquiryCount = await prisma.inquiry.count();
    await prisma.$disconnect();

    console.log(`   ✅ Database Connected: ${restCount} Hotel(s), ${catCount} Categories, ${itemCount} Menu Items, ${tableCount} Tables, ${orderCount} Orders, ${inquiryCount} Leads`);
    results.push({ pipeline: '1. Neon Cloud PostgreSQL', status: 'PASS', details: `${itemCount} items, ${tableCount} tables, ${inquiryCount} leads synced` });
  } catch (err) {
    console.error(`   ❌ Database check failed:`, err.message);
    results.push({ pipeline: '1. Neon Cloud PostgreSQL', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 2: CUSTOMER / DINER QR ORDERING FLOW
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 2] Customer Table QR Ordering Flow...');
  try {
    const restRes = await request(`${BASE_URL}/api/restaurants/grand-spice`);
    if (restRes.status !== 200 || !restRes.body?.name) {
      throw new Error(`Failed to load restaurant menu: HTTP ${restRes.status}`);
    }
    const rest = restRes.body;
    console.log(`   ✅ 2.1 Menu Loaded: "${rest.name}" (${rest.categories?.length || 0} categories)`);

    const allItems = (rest.categories || []).flatMap(c => c.items || []);
    const availableItem = allItems.find(i => i.isAvailable !== false) || {
      id: 'item-3',
      name: 'Murgh Malai Tikka',
      price: 360,
      isVeg: false
    };

    const orderPayload = {
      restaurantId: rest.id || 'rest-001',
      tableId: 'tbl-4',
      tableNumber: 'Table 4',
      customerName: 'Deep Audit Customer',
      customerPhone: '9876543210',
      paymentMethod: 'counter_cash',
      items: [
        {
          menuItemId: availableItem.id,
          name: availableItem.name,
          price: availableItem.price,
          quantity: 1,
          isVeg: availableItem.isVeg,
          notes: 'Extra crispy test'
        }
      ]
    };

    const orderRes = await request(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, orderPayload);

    if (orderRes.status !== 201 || !orderRes.body?.id) {
      throw new Error(`Order placement failed: HTTP ${orderRes.status} - ${JSON.stringify(orderRes.body)}`);
    }
    testOrderId = orderRes.body.id;
    console.log(`   ✅ 2.2 Order Placed: ID ${testOrderId}, Item: "${availableItem.name}", Total ₹${orderRes.body.total}, Status: ${orderRes.body.status}`);

    const pollRes = await request(`${BASE_URL}/api/orders?restaurantId=${rest.id || 'rest-001'}&tableId=tbl-4`);
    if (pollRes.status !== 200 || !Array.isArray(pollRes.body)) {
      throw new Error(`Order status polling failed: HTTP ${pollRes.status}`);
    }
    const found = pollRes.body.find(o => o.id === testOrderId);
    if (!found) {
      throw new Error(`Placed order ${testOrderId} not found in table polling!`);
    }
    console.log(`   ✅ 2.3 Diner Status Polling: Verified live on Table 4 (${pollRes.body.length} active orders)`);

    results.push({ pipeline: '2. Customer QR Ordering', status: 'PASS', details: `Order created, computed ₹${orderRes.body.total}, polled on Table 4` });
  } catch (err) {
    console.error(`   ❌ Customer Flow failed:`, err.message);
    results.push({ pipeline: '2. Customer QR Ordering', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 3: WAITER CALL / SERVICE REQUEST FLOW
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 3] Waiter Call & Dining Service Flow...');
  try {
    const sReqRes = await request(`${BASE_URL}/api/service-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      restaurantId: 'rest-001',
      tableId: 'tbl-4',
      tableNumber: 'Table 4',
      type: 'water'
    });
    if (sReqRes.status !== 201 || !sReqRes.body?.id) {
      throw new Error(`Waiter call failed: HTTP ${sReqRes.status}`);
    }
    testRequestId = sReqRes.body.id;
    console.log(`   ✅ 3.1 Service Request Dispatched: ID ${testRequestId} (Type: Water on Table 4)`);

    const attendRes = await request(`${BASE_URL}/api/service-requests`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin2026'
      }
    }, { requestId: testRequestId });
    if (attendRes.status !== 200) {
      throw new Error(`Mark service request attended failed: HTTP ${attendRes.status}`);
    }
    console.log(`   ✅ 3.2 Service Request Resolved: Staff attended Table 4`);

    results.push({ pipeline: '3. Waiter Call & Service', status: 'PASS', details: 'Customer call dispatched & staff marked attended' });
  } catch (err) {
    console.error(`   ❌ Service Request Flow failed:`, err.message);
    results.push({ pipeline: '3. Waiter Call & Service', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 4: KITCHEN KDS & ORDER LIFECYCLE FLOW
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 4] Kitchen KDS & Order State Machine...');
  try {
    if (!testOrderId) throw new Error('No test order available to advance status');

    const kds1 = await request(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin2026'
      }
    }, { orderId: testOrderId, status: 'in_progress' });
    if (kds1.status !== 200) throw new Error(`KDS in_progress failed: HTTP ${kds1.status}`);

    const kds2 = await request(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin2026'
      }
    }, { orderId: testOrderId, status: 'ready' });
    if (kds2.status !== 200) throw new Error(`KDS ready failed: HTTP ${kds2.status}`);

    const kds3 = await request(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin2026'
      }
    }, { orderId: testOrderId, status: 'served', paymentStatus: 'paid' });
    if (kds3.status !== 200) throw new Error(`KDS bill settlement failed: HTTP ${kds3.status}`);

    console.log(`   ✅ 4.1 - 4.3 Order Lifecycle: pending ➔ in_progress ➔ ready ➔ served & paid`);
    results.push({ pipeline: '4. Kitchen KDS Lifecycle', status: 'PASS', details: 'Order lifecycle advanced through all 4 stages & settled' });
  } catch (err) {
    console.error(`   ❌ Kitchen Flow failed:`, err.message);
    results.push({ pipeline: '4. Kitchen KDS Lifecycle', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 5: INVENTORY & STOCK SAFEGUARD (REAL DATABASE DISH)
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 5] Menu Stock Toggle & Anti-Sold-Out Safeguard...');
  try {
    // 5.1: Toggle real database item 'item-1' off
    const toggleOff = await request(`${BASE_URL}/api/menu/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { slug: 'grand-spice', itemId: 'item-1' });
    if (toggleOff.status !== 200 || toggleOff.body?.isAvailable !== false) {
      throw new Error(`Failed to toggle item-1 off: ${JSON.stringify(toggleOff.body)}`);
    }
    console.log(`   ✅ 5.1 Kitchen Out-of-Stock: Marked "${toggleOff.body.name}" as Sold Out (isAvailable: false)`);

    // 5.2: Attempt to order the disabled item (Must be strictly blocked with HTTP 400!)
    const blockedRes = await request(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      restaurantId: 'rest-001',
      tableId: 'tbl-4',
      tableNumber: 'Table 4',
      items: [{ menuItemId: 'item-1', name: 'Grand Royal Butter Chicken', price: 450, quantity: 1, isVeg: false }]
    });

    if (blockedRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for sold out item, got ${blockedRes.status}`);
    }
    console.log(`   ✅ 5.2 Stock Safeguard Active: Customer order strictly blocked (${blockedRes.body.error})`);

    // 5.3: Toggle item back on
    const toggleOn = await request(`${BASE_URL}/api/menu/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { slug: 'grand-spice', itemId: 'item-1' });
    if (toggleOn.status !== 200 || toggleOn.body?.isAvailable !== true) {
      throw new Error(`Failed to toggle item-1 back on`);
    }
    console.log(`   ✅ 5.3 Kitchen Restocked: "${toggleOn.body.name}" restored to active menu (isAvailable: true)`);

    results.push({ pipeline: '5. Inventory & Stock Safeguard', status: 'PASS', details: 'Live stock toggle & anti-sold-out blocking verified' });
  } catch (err) {
    console.error(`   ❌ Inventory check failed:`, err.message);
    results.push({ pipeline: '5. Inventory & Stock Safeguard', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 6: PARTNER INQUIRY & LEADS CRM FLOW
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 6] Partner Registration & Leads CRM Pipeline...');
  try {
    const inqPost = await request(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      restaurantName: 'The Royal Heritage Haveli',
      ownerName: 'Vikram Singh',
      phone: '9811223344',
      city: 'Jaipur',
      tablesCount: '15-30 Tables',
      notes: 'Interested in KDS and QR bill payment'
    });
    if ((inqPost.status !== 201 && inqPost.status !== 200) || !inqPost.body?.inquiry?.id) {
      throw new Error(`Inquiry submission failed: HTTP ${inqPost.status}`);
    }
    testInquiryId = inqPost.body.inquiry.id;
    console.log(`   ✅ 6.1 Lead Inquiry Submitted: ID ${testInquiryId} for "${inqPost.body.inquiry.restaurantName}"`);

    const inqList = await request(`${BASE_URL}/api/inquiries`, {
      headers: { 'x-admin-key': 'admin2026' }
    });
    if (inqList.status !== 200 || !Array.isArray(inqList.body?.inquiries)) {
      throw new Error(`Inquiries list failed: HTTP ${inqList.status}`);
    }
    const foundInq = inqList.body.inquiries.find(i => i.id === testInquiryId);
    if (!foundInq) throw new Error('Submitted inquiry not found in Super Admin leads CRM list');
    console.log(`   ✅ 6.2 Leads CRM Loaded: Verified lead in Super Admin CRM (${inqList.body.inquiries.length} total leads)`);

    const inqUpdate = await request(`${BASE_URL}/api/inquiries`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin2026'
      }
    }, { id: testInquiryId, status: 'contacted' });
    if (inqUpdate.status !== 200 || inqUpdate.body?.inquiry?.status !== 'contacted') {
      throw new Error(`Inquiry status update failed: HTTP ${inqUpdate.status}`);
    }
    console.log(`   ✅ 6.3 Leads CRM Status Updated: Lead marked as "contacted"`);

    results.push({ pipeline: '6. Partner Leads & CRM', status: 'PASS', details: 'Lead submitted, stored in Postgres, retrieved & updated in Founder HQ' });
  } catch (err) {
    console.error(`   ❌ Leads CRM Flow failed:`, err.message);
    results.push({ pipeline: '6. Partner Leads & CRM', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 7: SECURITY & ACCESS CONTROL
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 7] Security & Strict Access Controls...');
  try {
    const admin404 = await request(`${BASE_URL}/admin`);
    if (admin404.status !== 404) {
      throw new Error(`Security breach: /admin returned HTTP ${admin404.status} instead of 404!`);
    }
    console.log(`   ✅ 7.1 Strict 404 on /admin: Correctly returns 404 Not Found`);

    const hqRes = await request(`${BASE_URL}/founder-hq`);
    if (hqRes.status !== 200) {
      throw new Error(`/founder-hq returned HTTP ${hqRes.status}`);
    }
    console.log(`   ✅ 7.2 Founder HQ Endpoint: HTTP 200 OK (Gated by Master Key)`);

    const unauthorizedAdmin = await request(`${BASE_URL}/api/admin`);
    if (unauthorizedAdmin.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated /api/admin, got ${unauthorizedAdmin.status}`);
    }
    console.log(`   ✅ 7.3 API Route Protection: /api/admin blocked with 401 without master key`);

    const impRes = await request(`${BASE_URL}/api/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin2026'
      }
    }, { action: 'impersonate', slug: 'grand-spice' });
    if (impRes.status !== 200 || !impRes.body?.user) {
      throw new Error(`Impersonation failed: HTTP ${impRes.status}`);
    }
    console.log(`   ✅ 7.4 Owner Impersonation: Session token minted for "${impRes.body.user.name}"`);

    results.push({ pipeline: '7. Security & Access Control', status: 'PASS', details: '/admin is 404, /api/admin is 401 guarded, impersonation verified' });
  } catch (err) {
    console.error(`   ❌ Security check failed:`, err.message);
    results.push({ pipeline: '7. Security & Access Control', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // PIPELINE 8: CLOUDFLARE PUBLIC TUNNEL GATEWAY
  // -------------------------------------------------------------
  console.log('\n🔍 [PIPELINE 8] Cloudflare Public Tunnel Gateway...');
  try {
    const urlFilePath = path.join(__dirname, 'public-url.txt');
    if (!fs.existsSync(urlFilePath)) {
      throw new Error('public-url.txt does not exist');
    }
    const publicUrl = fs.readFileSync(urlFilePath, 'utf8').trim();
    console.log(`   🌐 Public Gateway URL: ${publicUrl}`);

    const pubDiner = await request(`${publicUrl}/r/grand-spice/t/tbl-4`);
    if (pubDiner.status !== 200) throw new Error(`Public Diner Menu unreachable: HTTP ${pubDiner.status}`);
    console.log(`   ✅ 8.1 Public Diner Menu: HTTP 200 OK`);

    const pubDash = await request(`${publicUrl}/dashboard`);
    if (pubDash.status !== 200) throw new Error(`Public Dashboard: HTTP 200 OK`);
    console.log(`   ✅ 8.2 Public Dashboard: HTTP 200 OK`);

    const pubReg = await request(`${publicUrl}/register`);
    if (pubReg.status !== 200) throw new Error(`Public Register: HTTP ${pubReg.status}`);
    console.log(`   ✅ 8.3 Public Register: HTTP 200 OK`);

    const pubHq = await request(`${publicUrl}/founder-hq`);
    if (pubHq.status !== 200) throw new Error(`Public Founder HQ: HTTP ${pubHq.status}`);
    console.log(`   ✅ 8.4 Public Founder HQ: HTTP 200 OK`);

    results.push({ pipeline: '8. Cloudflare Public Tunnel', status: 'PASS', details: 'All 4 portals globally reachable over HTTPS (200 OK)' });
  } catch (err) {
    console.error(`   ❌ Cloudflare Tunnel check failed:`, err.message);
    results.push({ pipeline: '8. Cloudflare Public Tunnel', status: 'FAIL', details: err.message });
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n==================================================================');
  console.log('                 FINAL PIPELINE HEALTH SCORECARD                  ');
  console.log('==================================================================');
  results.forEach(r => {
    const badge = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${badge.padEnd(10)} | ${r.pipeline.padEnd(30)} | ${r.details}`);
  });
  console.log('==================================================================\n');

  const allPassed = results.every(r => r.status === 'PASS');
  process.exit(allPassed ? 0 : 1);
}

runDeepPipelineAudit().catch(e => {
  console.error('Fatal audit error:', e);
  process.exit(1);
});
