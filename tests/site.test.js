const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');

test('HTML has one primary heading and semantic page regions', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<header[\s>]/);
  assert.match(html, /<main[\s>]/);
  assert.match(html, /<footer[\s>]/);
});

test('SEO metadata points to the production domain', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/lumocraft\.ru\/">/);
  assert.match(html, /property="og:url" content="https:\/\/lumocraft\.ru\/"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /contact@lumocraft\.ru/);
});

test('Both lead forms have required consent and mail delivery logic', () => {
  assert.equal((html.match(/class="lead-form"/g) || []).length, 2);
  assert.equal((html.match(/class="consent"/g) || []).length, 2);
  assert.match(html, /mailto:contact@lumocraft\.ru\?subject=/);
  assert.match(html, /data-form-target="quick-form"/);
  assert.match(html, /data-form-target="brief-form"/);
});

test('Motion is opt-out for reduced-motion users', () => {
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /animation: none !important/);
  assert.match(html, /IntersectionObserver/);
});

test('Case imagery and contact button contrast are present', () => {
  assert.match(html, /sashka350\.github\.io\/pavel-pronin-site\/images\/hero-bg\.jpg/);
  assert.match(html, /sashka350\.github\.io\/pavel-pronin-site\/images\/portrait-2\.jpg/);
  assert.match(html, /\.contact \.button\.ghost[^}]+color: #11140d !important/);
});

test('Analytics integration is opt-in and tracks meaningful actions', () => {
  assert.match(html, /data-metrika-id="113030902"/);
  assert.match(html, /mc\.yandex\.ru\/metrika\/tag\.js/);
  assert.match(html, /lumocraft-analytics-consent/);
  assert.match(html, /Разрешить аналитику/);
  assert.match(html, /Только необходимые/);
  assert.match(html, /lead_form_submit/);
  assert.match(html, /telegram_click/);
  assert.match(html, /email_click/);
});

test('Privacy page covers forms, cookies, withdrawal and operator details', () => {
  assert.match(html, /href="privacy\.html"/);
  assert.match(privacy, /Политика обработки персональных данных и cookies/);
  assert.match(privacy, /113030902/);
  assert.match(privacy, /отозвать согласие/);
  assert.match(privacy, /Оператор/);
});

test('Brand assets and conversion helpers are wired into the page', () => {
  assert.match(html, /href="favicon\.svg"/);
  assert.match(html, /src="logo\.svg"/);
  assert.match(html, /og-image\.svg/);
  assert.match(html, /id="calculator-total"/);
  assert.match(html, /success-screen/);
  assert.match(html, /#about/);
  assert.match(html, /Частые вопросы/);
});

test('Infrastructure files use the production domain', () => {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/lumocraft\.ru\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/lumocraft\.ru\//);
});
