/**
 * Filtros del listado (portados de main.js del sitio anterior). Filtran en el
 * navegador las tarjetas ya renderizadas, según sus data-*, y dejan el estado en la URL
 * para poder compartir la búsqueda.
 */
export function initFilters() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const countEl = document.querySelector('.filter-count');
  if (!buttons.length) return;

  const params = new URLSearchParams(location.search);
  const toInt = (value: string | null) => {
    const n = Number.parseInt(value ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const toNumber = (value: string | null) => {
    const n = Number.parseFloat(value ?? '');
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const rawCurrency = params.get('moneda');

  const state = {
    op: params.get('op') || 'todos',
    tipo: params.get('tipo') || 'todos',
    zona: params.get('zona') || '',
    moneda: rawCurrency === 'USD' || rawCurrency === 'ARS' ? rawCurrency : '',
    ambientes: toInt(params.get('amb')),
    banios: toInt(params.get('ban')),
    cochera: params.get('cochera') === '1',
    credito: params.get('credito') === '1',
    priceMin: toNumber(params.get('pmin')),
    priceMax: toNumber(params.get('pmax')),
  };

  // El rango de precio solo tiene sentido dentro de una moneda.
  if (!state.moneda) {
    state.priceMin = 0;
    state.priceMax = 0;
  }

  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  const zona = $<HTMLSelectElement>('filter-zona');
  const moneda = $<HTMLSelectElement>('filter-moneda');
  const ambientes = $<HTMLSelectElement>('filter-ambientes');
  const banios = $<HTMLSelectElement>('filter-banios');
  const cochera = $<HTMLButtonElement>('filter-cochera');
  const credito = $<HTMLButtonElement>('filter-credito');
  const priceMin = $<HTMLInputElement>('filter-precio-min');
  const priceMax = $<HTMLInputElement>('filter-precio-max');
  const emptyEl = document.querySelector<HTMLElement>('[data-filter-empty]');
  const clearBtn = document.querySelector<HTMLButtonElement>('[data-filter-clear]');

  // Estado inicial desde la URL.
  buttons.forEach((btn) => {
    const { filterGroup: group, filter: value } = btn.dataset;
    btn.classList.toggle(
      'is-active',
      (group === 'op' && value === state.op) || (group === 'tipo' && value === state.tipo),
    );
  });
  if (zona) zona.value = state.zona;
  if (moneda) moneda.value = state.moneda;
  if (ambientes) ambientes.value = String(state.ambientes);
  if (banios) banios.value = String(state.banios);
  const setToggle = (btn: HTMLButtonElement | null, on: boolean) => {
    btn?.classList.toggle('is-active', on);
    btn?.setAttribute('aria-pressed', String(on));
  };
  setToggle(cochera, state.cochera);
  setToggle(credito, state.credito);
  if (priceMin && state.priceMin) priceMin.value = String(state.priceMin);
  if (priceMax && state.priceMax) priceMax.value = String(state.priceMax);

  function syncPriceInputs() {
    const enabled = Boolean(state.moneda);
    if (priceMin) priceMin.disabled = !enabled;
    if (priceMax) priceMax.disabled = !enabled;
  }
  syncPriceInputs();

  function updateURL() {
    const p = new URLSearchParams();
    if (state.op !== 'todos') p.set('op', state.op);
    if (state.tipo !== 'todos') p.set('tipo', state.tipo);
    if (state.zona) p.set('zona', state.zona);
    if (state.moneda) p.set('moneda', state.moneda);
    if (state.ambientes) p.set('amb', String(state.ambientes));
    if (state.banios) p.set('ban', String(state.banios));
    if (state.cochera) p.set('cochera', '1');
    if (state.credito) p.set('credito', '1');
    if (state.priceMin) p.set('pmin', String(state.priceMin));
    if (state.priceMax) p.set('pmax', String(state.priceMax));
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function update() {
    let visible = 0;
    const cards = document.querySelectorAll<HTMLElement>('[data-prop-card]');
    cards.forEach((card) => {
      const d = card.dataset;
      const amb = parseInt(d.ambientes || '0', 10);
      const ban = parseInt(d.banios || '0', 10);
      const valor = parseFloat(d.valor || '0');
      const show =
        (state.op === 'todos' || d.op === state.op) &&
        (state.tipo === 'todos' || d.tipo === state.tipo) &&
        (!state.zona || d.zona === state.zona) &&
        (!state.moneda || d.moneda === state.moneda) &&
        (state.ambientes === 0 || (state.ambientes >= 5 ? amb >= 5 : amb === state.ambientes)) &&
        (state.banios === 0 || (state.banios >= 3 ? ban >= 3 : ban === state.banios)) &&
        (!state.cochera || d.cochera === '1') &&
        (!state.credito || d.credito === '1') &&
        (state.priceMin === 0 || valor >= state.priceMin) &&
        (state.priceMax === 0 || valor <= state.priceMax);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (countEl) countEl.textContent = `${visible} propiedad${visible !== 1 ? 'es' : ''}`;
    if (emptyEl) emptyEl.hidden = !(visible === 0 && cards.length > 0);
    updateURL();
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const { filterGroup: group, filter: value = 'todos' } = btn.dataset;
      document
        .querySelectorAll(`[data-filter-group='${group}']`)
        .forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      if (group === 'op') state.op = value;
      if (group === 'tipo') state.tipo = value;
      update();
    });
  });
  zona?.addEventListener('change', () => {
    state.zona = zona.value;
    update();
  });
  moneda?.addEventListener('change', () => {
    state.moneda = moneda.value;
    state.priceMin = 0;
    state.priceMax = 0;
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';
    syncPriceInputs();
    update();
  });
  ambientes?.addEventListener('change', () => {
    state.ambientes = parseInt(ambientes.value, 10);
    update();
  });
  banios?.addEventListener('change', () => {
    state.banios = parseInt(banios.value, 10);
    update();
  });
  cochera?.addEventListener('click', () => {
    state.cochera = !state.cochera;
    setToggle(cochera, state.cochera);
    update();
  });
  credito?.addEventListener('click', () => {
    state.credito = !state.credito;
    setToggle(credito, state.credito);
    update();
  });
  priceMin?.addEventListener('input', () => {
    state.priceMin = parseFloat(priceMin.value) || 0;
    update();
  });
  priceMax?.addEventListener('input', () => {
    state.priceMax = parseFloat(priceMax.value) || 0;
    update();
  });
  clearBtn?.addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    location.reload();
  });

  update();
}
