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
  assert.match(html, /property="og:image:width" content="851"/);
  assert.match(html, /property="og:image:height" content="315"/);
  assert.match(html, /name="robots" content="max-image-preview:large"/);
  assert.match(html, /"@type": "ProfessionalService"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /"priceCurrency": "RUB"/);
  assert.match(html, /max-image-preview:large/);
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

test('Direct contact block and mobile nav are present, portfolio is gone', () => {
  assert.doesNotMatch(html, /id="work"/);
  assert.doesNotMatch(html, /href="#work"/);
  assert.doesNotMatch(html, /class="case-preview"|case-hero\.jpg|\.case \{/);
  assert.doesNotMatch(html, /portrait-[1235]|portrait-bw/);
  assert.match(html, /id="direct"/);
  assert.match(html, /Написать в Telegram/);
  assert.match(html, /direct-email/);
  assert.match(html, /class="mobile-nav"/);
  assert.match(html, /grid-template-columns: repeat\(2, 1fr\); gap: 0; border-top: 1px solid var\(--line\); background: rgba\(16,17,16/);
  assert.doesNotMatch(html, /\.contact-actions|\.button\.ghost.*11140d !important/);
});

test('Header CTA, pulsing brand dot and square checkboxes are wired', () => {
  const body = html.match(/<body>[\s\S]*?<script>/)?.[0] || '';
  assert.match(html, /<a class="nav-cta" href="#contact">Оставить заявку<\/a>/);
  assert.doesNotMatch(body, />Работа<\/a>/);
  assert.match(html, /@keyframes brand-pulse/);
  assert.match(html, /\.brand-dot \{[^}]*animation: brand-pulse/);
  assert.match(html, /input\[type="checkbox"\] \{ -webkit-appearance: none; appearance: none;/);
  assert.match(html, /input\[type="checkbox"\]:checked::after/);
  assert.equal((body.match(/Посмотреть пример/g) || []).length, 3);
  assert.equal((body.match(/href="404\.html"/g) || []).length, 3);
  assert.doesNotMatch(body, /sashka350\.github\.io\/example-/);
});

test('Error page matches the site style and is not indexed', () => {
  const notFound = fs.readFileSync(path.join(root, '404.html'), 'utf8');
  assert.match(notFound, /<meta name="robots" content="noindex, follow">/);
  assert.match(notFound, /<b>404<\/b>/);
  assert.match(notFound, /class="brand-dot"/);
  assert.match(notFound, /@keyframes brand-pulse/);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /https:\/\/t\.me\/sassha_at/);
  assert.match(notFound, /href="privacy\.html"/);
  assert.match(notFound, /--lime: #c8e86b/);
  assert.match(notFound, /--coral: #ff765d/);
  assert.match(notFound, /prefers-reduced-motion/);
  assert.doesNotMatch(notFound, /mailto:/);
  assert.doesNotMatch(notFound, /mc\.yandex\.ru/);
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

test('Navigation, marquee and FAQ match the current structure', () => {
  const visible = html.match(/<body>[\s\S]*?<script>/)?.[0] || '';
  assert.match(html, />Услуги<\/a>/);
  assert.match(html, />Контакты<\/a>/);
  assert.equal((html.match(/<div class="marquee"/g) || []).length, 2);
  assert.equal((visible.match(/от идеи до запуска/g) || []).length, 2);
  assert.equal((visible.match(/без сюрпризов/g) || []).length, 2);
  assert.doesNotMatch(html, /DESIGN WITH A PURPOSE/);
  assert.doesNotMatch(html, /marqueeItems|\.device|\.orbit|\.stamp/);
  assert.doesNotMatch(visible, /Собери свой комплект|calculator-total|Сайт растёт вместе с задачей|class="extra-list"/);
  assert.equal((html.match(/<summary>/g) || []).length, 6);
  assert.match(html, /font-family: "Space Grotesk"/);
  assert.match(html, /class="brand-dot"/);
  assert.doesNotMatch(html, /class="brand-logo"/);
  assert.doesNotMatch(html.match(/<div class="marquee"[\s\S]*?<\/div>/)?.[0] || '', /Александр|ALEXANDER/);
});

test('New UI: preloader, grain, scrollspy, back-to-top, copy email, lang prompt, autocomplete', () => {
  assert.match(html, /id="preloader"/);
  assert.match(html, /preloader-video/);
  assert.match(html, /class="grain"/);
  assert.match(html, /class="to-top"/);
  assert.match(html, /is-active/);
  assert.match(html, /data-copy-email/);
  assert.match(html, /id="lang-prompt"/);
  assert.match(html, /data-lang-go="en"/);
  assert.match(html, /autocomplete="name"/);
  assert.match(html, /autocomplete="tel"/);
  assert.match(html, /@keyframes shake/);
  assert.match(html, /perspective\(900px\)/);
  assert.match(html, /hero-video-wrap/);
  assert.doesNotMatch(html, /hero-art:hover \.device|screen-title|stamp strong/);
});

test('Inline browser script has valid JavaScript syntax', () => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script));
});

test('Copy is rewritten: no first person, clear package names, working marquee', () => {
  const visible = html.match(/<body>[\s\S]*?<script>/)?.[0] || '';
  assert.doesNotMatch(html, /Я сам предложу|Я превращаю|Выбрать Start|Выбрать Signal|Обсудить Full|Сайт-витрина до 5 экранов|setup-note|\.extras\b/);
  assert.match(html, />Одностраничный сайт</);
  assert.match(html, />Сайт-витрина</);
  assert.match(html, />Многостраничный сайт</);
  assert.doesNotMatch(visible, /Ознакомиться с работами/);
  assert.doesNotMatch(visible, /Красивый сайт — это не декор|Сначала доверие\. Потом разговор\.|Сначала смысл\.|Без тёмного леса из согласований\.|Без сюрпризов<br>|case-preview/);
  assert.match(html, /marquee-shift/);
  assert.match(html, /data-marquee/);
  assert.match(html, /marquee-group/);
  assert.match(html, /buildMarquee/);
  assert.equal((html.match(/<span class="marquee-group">/g) || []).length, 2);
  assert.doesNotMatch(html, /applyTeamVoice|const teamVoice =/);
  assert.match(html, /See an example/);
});

test('Pricing matches the approved 40/90/170 ladder and promises no deadlines', () => {
  assert.match(html, /"priceRange": "40 000 ₽ — 170 000 ₽"/);
  assert.match(html, /"price": "40000"/);
  assert.match(html, /"price": "90000"/);
  assert.match(html, /"price": "170000"/);
  assert.doesNotMatch(html, /<div class="price">10 000|<div class="price">25 000|<div class="price">от 50 000|"price": "10000"|"price": "25000"|"price": "50000"/);
  assert.doesNotMatch(html, />Лендинг</);
  assert.doesNotMatch(html, /Запуск за 2–3 дня|Запуск за 7 дней|2–3 недели на сборку|Неделя на правки|3 дня на правки|Поддержка после запуска/);
  assert.equal((html.match(/<div class="price">/g) || []).length, 3);
  assert.equal((html.match(/class="card-actions"/g) || []).length, 3);
});

test('Infrastructure files use the production domain', () => {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/lumocraft\.ru\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/lumocraft\.ru\/</);
  assert.doesNotMatch(sitemap, /404\.html/);
});

test('FAQ structured data matches the visible question count', () => {
  assert.equal((html.match(/"@type": "Question"/g) || []).length, 6);
  assert.equal((html.match(/<summary>/g) || []).length, 6);
  assert.doesNotMatch(html, /"name": "Домен и хостинг входят в цену\?"/);
});

test('Lead endpoint keeps bot credentials outside the public site directory', () => {
  const endpoint = fs.readFileSync(path.join(root, 'submit.php'), 'utf8');
  assert.match(endpoint, /dirname\(__DIR__, 2\).*lumocraft-config\.php/);
  assert.match(endpoint, /api\.telegram\.org\/bot/);
  assert.doesNotMatch(endpoint, /\d{8,}:[A-Za-z0-9_-]{20,}/);
});

test('Shared image assets are valid and reasonably sized', () => {
  for (const file of ['og-image.png', 'og-image-en.png', 'Lumocraft logo.png', 'lumocraft-mark.png']) {
    const buf = fs.readFileSync(path.join(root, file));
    assert.equal(buf.slice(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} must be a clean PNG`);
  }
  const poster = fs.readFileSync(path.join(root, 'Lumocraft logo.png'));
  assert.ok(poster.length < 400 * 1024, 'poster should be optimised under 400 KB');
  const mark = fs.readFileSync(path.join(root, 'lumocraft-mark.png'));
  assert.ok(mark.length < 100 * 1024, 'favicon mark should be under 100 KB');
});
