/* Google Analytics 4 + consent banner — loopstrategy.ai
 *
 * Loaded from every page with a single line in <head>:
 *     <script src="/ga.js" defer></script>
 *
 * One file rather than a snippet pasted into 15 pages: the measurement ID and the
 * banner wording then have exactly one home. Blog posts live at /blog/<slug>/, so
 * the src is absolute.
 *
 * Consent: nothing is measured until the visitor says yes. Consent Mode v2 defaults
 * are set before gtag.js loads — set them late and they do not apply. The choice is
 * stored in localStorage, so a visitor is asked once.
 */
(function () {
  var GA_ID = 'G-RCBTXXTMKW'
  var STORAGE_KEY = 'ls-consent'

  window.dataLayer = window.dataLayer || []
  function gtag() { dataLayer.push(arguments) }
  window.gtag = gtag

  // Denied by default. ad_* stay denied permanently — this site runs no advertising.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  })

  // Google is not contacted at all until consent is given. Loading gtag.js up front
  // and relying on denied defaults still fires a cookieless ping — legally arguable,
  // but it is not what the banner promises the visitor. So the script is injected
  // only once Accept is clicked, or on later visits once the choice is stored.
  var loaded = false
  function loadGA() {
    if (loaded) return
    loaded = true
    gtag('consent', 'update', { analytics_storage: 'granted' })
    var s = document.createElement('script')
    s.async = true
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID
    document.head.appendChild(s)
    gtag('js', new Date())
    gtag('config', GA_ID)
  }

  var stored = null
  try { stored = localStorage.getItem(STORAGE_KEY) } catch (e) { /* private mode */ }

  if (stored === 'granted') { loadGA(); return }
  if (stored === 'denied') return

  // No decision yet — ask.
  function decide(value) {
    try { localStorage.setItem(STORAGE_KEY, value) } catch (e) {}
    if (value === 'granted') loadGA()
    var el = document.getElementById('ls-consent-bar')
    if (el) el.remove()
  }

  function render() {
    if (document.getElementById('ls-consent-bar')) return

    var css = document.createElement('style')
    css.textContent = [
      '#ls-consent-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
      'background:#28190e;color:#F5EFE6;border-top:1px solid rgba(255,255,255,.12);',
      "font-family:'Outfit',system-ui,sans-serif;font-size:.9rem;line-height:1.5;",
      'padding:18px 24px;display:flex;gap:20px;align-items:center;justify-content:center;',
      'flex-wrap:wrap;box-shadow:0 -8px 30px rgba(0,0,0,.25)}',
      '#ls-consent-bar p{margin:0;max-width:640px;color:rgba(245,239,230,.82)}',
      '#ls-consent-bar .ls-actions{display:flex;gap:10px;flex-shrink:0}',
      '#ls-consent-bar button{font:inherit;cursor:pointer;border-radius:999px;',
      'padding:10px 22px;border:1px solid rgba(255,255,255,.25);background:transparent;',
      'color:#F5EFE6;transition:.2s ease}',
      '#ls-consent-bar button:hover{border-color:rgba(255,255,255,.55)}',
      '#ls-consent-bar button.ls-accept{background:#7db88e;border-color:#7db88e;color:#12240f;font-weight:500}',
      '#ls-consent-bar button.ls-accept:hover{background:#68a87a;border-color:#68a87a}',
      '@media(max-width:640px){#ls-consent-bar{flex-direction:column;align-items:stretch;text-align:left}',
      '#ls-consent-bar .ls-actions{justify-content:stretch}#ls-consent-bar button{flex:1}}',
    ].join('')
    document.head.appendChild(css)

    var bar = document.createElement('div')
    bar.id = 'ls-consent-bar'
    bar.setAttribute('role', 'dialog')
    bar.setAttribute('aria-label', 'Cookie consent')
    bar.innerHTML =
      '<p>This site uses Google Analytics to understand which pages are useful. ' +
      'Nothing is measured unless you agree, and no advertising cookies are used.</p>' +
      '<div class="ls-actions">' +
      '<button type="button" class="ls-decline">Decline</button>' +
      '<button type="button" class="ls-accept">Accept</button>' +
      '</div>'
    document.body.appendChild(bar)

    bar.querySelector('.ls-accept').addEventListener('click', function () { decide('granted') })
    bar.querySelector('.ls-decline').addEventListener('click', function () { decide('denied') })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render)
  } else {
    render()
  }
})()
