import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { ADMIN_NAV_ITEMS, isActiveAdminPath } from '../src/lib/admin/nav';

describe('admin nav', () => {
  it('includes required admin destinations', () => {
    const hrefs = ADMIN_NAV_ITEMS.map((i) => i.href);
    assert.ok(hrefs.includes('/account/admin/library'));
    assert.ok(hrefs.includes('/account/admin/settings'));
    assert.ok(hrefs.includes('/account/admin/analytics'));
  });

  it('marks active items on exact or prefix path match', () => {
    const lib = ADMIN_NAV_ITEMS.find((i) => i.href === '/account/admin/library');
    assert.ok(lib);
    assert.equal(isActiveAdminPath('/account/admin/library', lib!), true);
    assert.equal(isActiveAdminPath('/account/admin/library/item-123', lib!), true);
    assert.equal(isActiveAdminPath('/account/admin/settings', lib!), false);
  });
});
