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

test('Both lead forms have required consent and server delivery logic', () => {
  assert.equal((html.match(/class="lead-form"/g) || []).length, 2);
  assert.equal((html.match(/class="consent"/g) || []).length, 2);
  assert.match(html, /fetch\('submit\.php'/);
  assert.match(html, /data-form-target="quick-form"/);
  assert.match(html, /data-form-target="brief-form"/);
  assert.match(html, /className = 'contact-method'/);
  assert.match(html, /data-method="Telegram"/);
  assert.match(html, /contactOptions/);
  assert.doesNotMatch(privacy, /mailto:contact@lumocraft\.ru/);
});

test('Motion is opt-out for reduced-motion users', () => {
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /animation: none !important/);
  assert.match(html, /IntersectionObserver/);
});

test('Case imagery, direct contact block and mobile nav are present', () => {
  assert.match(html, /url\("case-hero\.jpg"\)/);
  assert.match(html, /href="https:\/\/sashka350\.github\.io\/pavel-pronin-site1\/" target="_blank"/);
  assert.doesNotMatch(html, /portrait-[1235]|portrait-bw/);
  assert.match(html, /id="direct"/);
  assert.match(html, /Написать в Telegram/);
  assert.match(html, /direct-email/);
  assert.match(html, /class="mobile-nav"/);
  assert.doesNotMatch(html, /\.contact-actions|\.button\.ghost.*11140d !important/);
});

test('Analytics integration is opt-in and tracks meaningful actions', () => {
  assert.match(html, /data-metrika-id="113030902"/);
  assert.match(html, /mc\.yandex\.ru\/metrika\/tag\.js/);
  assert.match(html, /lumocraft-analytics-consent/);
  assert.match(html, /Разрешить аналитику/);
  assert.match(html, /Только необходимые/);
  assert.match(html, /lead_form_submit/);
  assert.match(html, /telegram_click/);
});

test('Privacy page covers forms, cookies, withdrawal and operator details', () => {
  assert.match(html, /href="privacy\.html"/);
  assert.match(privacy, /Политика обработки персональных данных и cookies/);
  assert.match(privacy, /113030902/);
  assert.match(privacy, /отозвать согласие/);
  assert.match(privacy, /Оператор/);
});

test('Brand assets and conversion helpers are wired into the page', () => {
  assert.match(html, /href="lumocraft-mark\.png"/);
  assert.doesNotMatch(html, /src="logo\.svg"/);
  assert.match(html, /og-image\.png/);
  assert.doesNotMatch(html, /id="calculator-total"/);
  assert.match(html, /success-screen/);
  assert.match(html, /#about/);
  assert.match(html, /Частые вопросы/);
  assert.match(html, /Lumocraft%20logo\.mp4/);
  assert.match(html, /Lumocraft%20logo\.png/);
});

test('Navigation, marquee, portfolio and FAQ match the current structure', () => {
  const visible = html.match(/<body>[\s\S]*?<script>/)?.[0] || '';
  assert.match(html, />Работа<\/a>/);
  assert.match(html, />Услуги<\/a>/);
  assert.match(html, />Контакты<\/a>/);
  assert.equal((html.match(/<div class="marquee"/g) || []).length, 5);
  assert.match(html, /marqueeItems\[3\]\.remove\(\)/);
  assert.match(html, /document\.querySelector\('#services'\)\.after\(marqueeItems\[4\]\)/);
  assert.doesNotMatch(visible, /Собери свой комплект|calculator-total|Сайт растёт вместе с задачей|class="extra-list"/);
  assert.equal((html.match(/<summary>/g) || []).length, 6);
  assert.match(html, /font-family: "Space Grotesk"/);
  assert.match(html, /class="brand-dot"/);
  assert.doesNotMatch(html, /class="brand-logo"/);
  assert.doesNotMatch(html.match(/<div class="marquee"[\s\S]*?<\/div>/)?.[0] || '', /Александр|ALEXANDER/);
});

test('Inline browser script has valid JavaScript syntax', () => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script));
});

test('Copy is rewritten: no first person, clear package names, working marquee', () => {
  assert.doesNotMatch(html, /Я сам предложу|Я превращаю|Выбрать Start|Выбрать Signal|Обсудить Full|Сайт-витрина до 5 экранов|setup-note|\.extras\b/);
  assert.match(html, />Лендинг</);
  assert.match(html, />Сайт-витрина</);
  assert.match(html, />Многостраничный сайт</);
  assert.match(html, /Ознакомиться с работами/);
  assert.match(html, /translate3d\(-50%, 0, 0\)/);
  assert.doesNotMatch(html, /applyTeamVoice|const teamVoice =/);
  assert.match(html, /See our work/);
});

test('Infrastructure files use the production domain', () => {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/lumocraft\.ru\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/lumocraft\.ru\//);
});

test('Lead endpoint keeps bot credentials outside the public site directory', () => {
  const endpoint = fs.readFileSync(path.join(root, 'submit.php'), 'utf8');
  assert.match(endpoint, /dirname\(__DIR__, 2\).*lumocraft-config\.php/);
  assert.match(endpoint, /api\.telegram\.org\/bot/);
  assert.doesNotMatch(endpoint, /\d{8,}:[A-Za-z0-9_-]{20,}/);
});
