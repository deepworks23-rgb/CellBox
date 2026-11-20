import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessView,
  getDefaultPanelForRole,
  pathToView,
  resolveAuthorizedView,
  viewToPath,
} from './rbac';

test('URL path mapping round-trips public and protected routes accurately', () => {
  assert.deepEqual(pathToView('/'), { type: 'home' });
  assert.deepEqual(pathToView('/sobre'), { type: 'about' });
  assert.deepEqual(pathToView('/contacto'), { type: 'contact' });
  assert.deepEqual(pathToView('/login'), { type: 'auth', mode: 'login' });
  assert.deepEqual(pathToView('/cadastro'), { type: 'auth', mode: 'register' });
  assert.deepEqual(pathToView('/minha-conta'), { type: 'profile', tab: 'orders' });
  assert.deepEqual(pathToView('/minha-conta/desejos'), { type: 'profile', tab: 'wishlist' });
  assert.deepEqual(pathToView('/vendedor'), { type: 'seller_dashboard', tab: 'overview' });
  assert.deepEqual(pathToView('/vendedor/produtos'), { type: 'seller_dashboard', tab: 'products' });
  assert.deepEqual(pathToView('/admin'), { type: 'admin_dashboard', tab: 'overview' });
  assert.deepEqual(pathToView('/admin/vendedores'), { type: 'admin_dashboard', tab: 'sellers' });

  assert.equal(viewToPath({ type: 'about' }), '/sobre');
  assert.equal(viewToPath({ type: 'contact' }), '/contacto');
  assert.equal(viewToPath({ type: 'profile', tab: 'addresses' }), '/minha-conta/enderecos');
  assert.equal(viewToPath({ type: 'seller_dashboard', tab: 'orders' }), '/vendedor/pedidos');
  assert.equal(viewToPath({ type: 'admin_dashboard', tab: 'finance' }), '/admin/financeiro');
});

test('Guest visitors cannot access buyer profile, seller dashboard, or admin dashboard', () => {
  assert.equal(canAccessView({ type: 'home' }, null), true);
  assert.equal(canAccessView({ type: 'about' }, null), true);
  assert.equal(canAccessView({ type: 'contact' }, null), true);
  assert.equal(canAccessView({ type: 'cart' }, null), true);

  for (const restricted of [
    { type: 'profile' as const },
    { type: 'seller_dashboard' as const },
    { type: 'admin_dashboard' as const },
  ]) {
    assert.equal(canAccessView(restricted, null), false);
    const resolved = resolveAuthorizedView(restricted, null);
    assert.equal(resolved.denied, true);
    assert.deepEqual(resolved.view, { type: 'auth', mode: 'login' });
  }
});

test('Buyer is strictly isolated to Buyer Profile and blocked from Seller and Admin routes', () => {
  const buyer = { role: 'buyer' as const };
  assert.equal(canAccessView({ type: 'profile' }, buyer), true);
  assert.equal(canAccessView({ type: 'cart' }, buyer), true);
  assert.equal(canAccessView({ type: 'seller_dashboard' }, buyer), false);
  assert.equal(canAccessView({ type: 'admin_dashboard' }, buyer), false);

  const sellerAttempt = resolveAuthorizedView({ type: 'seller_dashboard' }, buyer);
  assert.equal(sellerAttempt.denied, true);
  assert.deepEqual(sellerAttempt.view, { type: 'profile', tab: 'orders' });

  const adminAttempt = resolveAuthorizedView({ type: 'admin_dashboard' }, buyer);
  assert.equal(adminAttempt.denied, true);
  assert.deepEqual(adminAttempt.view, { type: 'profile', tab: 'orders' });
});

test('Seller is strictly isolated to Seller Dashboard and blocked from Buyer and Admin routes', () => {
  const seller = { role: 'seller' as const };
  assert.equal(canAccessView({ type: 'seller_dashboard' }, seller), true);
  assert.equal(canAccessView({ type: 'profile' }, seller), false);
  assert.equal(canAccessView({ type: 'admin_dashboard' }, seller), false);
  assert.equal(canAccessView({ type: 'cart' }, seller), false);

  const buyerAttempt = resolveAuthorizedView({ type: 'profile' }, seller);
  assert.equal(buyerAttempt.denied, true);
  assert.deepEqual(buyerAttempt.view, { type: 'seller_dashboard', tab: 'overview' });

  const adminAttempt = resolveAuthorizedView({ type: 'admin_dashboard' }, seller);
  assert.equal(adminAttempt.denied, true);
  assert.deepEqual(adminAttempt.view, { type: 'seller_dashboard', tab: 'overview' });
});

test('Admin is strictly isolated to Admin Dashboard and blocked from Buyer and Seller routes', () => {
  const admin = { role: 'admin' as const };
  assert.equal(canAccessView({ type: 'admin_dashboard' }, admin), true);
  assert.equal(canAccessView({ type: 'profile' }, admin), false);
  assert.equal(canAccessView({ type: 'seller_dashboard' }, admin), false);
  assert.equal(canAccessView({ type: 'cart' }, admin), false);

  const buyerAttempt = resolveAuthorizedView({ type: 'profile' }, admin);
  assert.equal(buyerAttempt.denied, true);
  assert.deepEqual(buyerAttempt.view, { type: 'admin_dashboard', tab: 'overview' });

  const sellerAttempt = resolveAuthorizedView({ type: 'seller_dashboard' }, admin);
  assert.equal(sellerAttempt.denied, true);
  assert.deepEqual(sellerAttempt.view, { type: 'admin_dashboard', tab: 'overview' });

  assert.deepEqual(getDefaultPanelForRole('admin'), { type: 'admin_dashboard', tab: 'overview' });
});
