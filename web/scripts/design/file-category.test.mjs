import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFileCategory } from '../../src/utils/fileCategory.ts';

test('named node outputs keep their category when processing a configuration template', () => {
  for (const displayName of ['Stash nodes', 'Clash Verge nodes', '节点文件']) {
    assert.equal(getFileCategory({displayName, type:'file', content:'dns:\n  enable: true\nproxy-groups: []\nrules: []'}), 'nodes');
  }
});

test('explicit categories and configuration types take precedence over inferred names', () => {
  assert.equal(getFileCategory({displayName:'Stash nodes', uiCategory:'other'}), 'other');
  assert.equal(getFileCategory({displayName:'Stash nodes', type:'mihomoConfig'}), 'config');
  assert.equal(getFileCategory({displayName:'Stash configuration', content:'proxies: []'}), 'config');
  assert.equal(getFileCategory({name:'unnamed', content:'proxy-groups: []\nrules: []'}), 'config');
  assert.equal(getFileCategory({name:'unnamed', content:'proxies: []'}), 'nodes');
  assert.equal(getFileCategory({name:'import-urls', content:'https://example.invalid'}), 'other');
});
