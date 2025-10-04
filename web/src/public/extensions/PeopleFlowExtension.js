// /public/extensions/PeoplePanelExtension.js
class PeoplePanelExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.panel = null;
    this._onToolbarReady = this._onToolbarReady.bind(this);

    // 圖片資料（可被 loadExtension 時的 options 覆寫）
    this.cameras = options?.cameras || [
      { number: 174, img1: '/img/people/174/detect.jpg', img2: '/img/people/174/heatmap.png' },
    ];
    this.initial = options?.initial; // 可為 undefined，下面會做 fallback
  }

  load() {
    // 載入專屬 CSS（只加一次）
    if (!document.getElementById('people-flow-css')) {
      const link = document.createElement('link');
      link.id = 'people-flow-css';
      link.rel = 'stylesheet';
      link.href = '/extensions/PeopleFlowExtension.css'; // ← 靜態根目錄是 /public
      document.head.appendChild(link);
    }

    // initial fallback
    const numbers = this.cameras.map(c => Number(c.number));
    const fallback = numbers.length ? numbers[0] : null;
    const initial = (this.initial != null && numbers.includes(Number(this.initial)))
      ? Number(this.initial)
      : fallback;

    this.panel = new PeoplePanel(this.viewer, 'people-panel', 'People Detection', {
      cameras: this.cameras,
      initial
    });

    // 如果有需要放到 viewer toolbar，這裡順手處理（可留可拿掉）
    this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this._onToolbarReady);
    if (this.viewer.getToolbar()) this._onToolbarReady();

    return true;
  }

  unload() {
    this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this._onToolbarReady);
    if (this.panel) {
      this.panel.setVisible(false);
      this.panel = null;
    }
    return true;
  }

  _onToolbarReady() {

  }


//   toggle() { if (this.panel) this.panel.setVisible(!this.panel.isVisible()); }
//   open()   { this.panel?.setVisible(true); }
//   close()  { this.panel?.setVisible(false); }
// }

/** 面板（只含標題、Number 下拉、兩張圖片） **/
class PeoplePanel extends Autodesk.Viewing.UI.DockingPanel {
  constructor(viewer, id, title, opts) {
    super(viewer.container, id, title, { addCloseButton: true, localizeTitle: false });
    this.viewer = viewer;
    this.opts = opts || {};
    this.container.classList.add('docking-panel-container-solid-color-a');

    // 內容容器
    this.content = document.createElement('div');
    this.content.className = 'docking-panel-scroll';

    // Header
    const header = document.createElement('div');
    header.className = 'pp-header';
    header.textContent = 'CCTV Detection';

    // Subbar（Number 選擇）
    const subbar = document.createElement('div');
    subbar.className = 'pp-subbar';
    subbar.innerHTML = `
      <span>Number : </span>
      <select id="pp-number"></select>
    `;

    // People Detection
    const secTitle1 = document.createElement('div');
    secTitle1.className = 'pp-section-title';
    secTitle1.textContent = 'People Detection';

    const secBody1 = document.createElement('div');
    secBody1.className = 'pp-section-body';
    secBody1.innerHTML = `
      <div class="pp-frame"><img id="pp-img1" src="" alt="People Detection"></div>
    `;

    // People Heatmap
    const secTitle2 = document.createElement('div');
    secTitle2.className = 'pp-section-title';
    secTitle2.textContent = 'People Heatmap';

    const secBody2 = document.createElement('div');
    secBody2.className = 'pp-section-body';
    secBody2.innerHTML = `
      <div class="pp-frame"><img id="pp-img2" src="" alt="People Heatmap"></div>
    `;

    // 組裝
    this.content.appendChild(header);
    this.content.appendChild(subbar);
    this.content.appendChild(secTitle1);
    this.content.appendChild(secBody1);
    this.content.appendChild(secTitle2);
    this.content.appendChild(secBody2);
    this.container.appendChild(this.content);

    // refs
    this.$select = this.content.querySelector('#pp-number');
    this.$img1 = this.content.querySelector('#pp-img1');
    this.$img2 = this.content.querySelector('#pp-img2');

    // 填選單
    const cams = Array.isArray(this.opts.cameras) ? this.opts.cameras : [];
    cams.forEach(c => {
      const opt = document.createElement('option');
      opt.value = String(c.number);
      opt.textContent = String(c.number);
      this.$select.appendChild(opt);
    });

    // 切換
    this.$select.addEventListener('change', () => this._applySelection());

    // 初值
    const init = this.opts.initial != null ? String(this.opts.initial) : (cams[0] ? String(cams[0].number) : '');
    if (init) this.$select.value = init;
    this._applySelection();

    // 圖片保護
    [this.$img1, this.$img2].forEach(img => {
      img.addEventListener('error', () => { img.alt = 'Image not available'; });
      img.style.maxWidth = '100%';
      img.style.display = 'block';
    });

    this.setVisible(false);
  }

  _applySelection() {
    const val = Number(this.$select.value);
    const cam = (this.opts.cameras || []).find(c => Number(c.number) === val);
    if (cam) {
      this.$img1.src = cam.img1 || '';
      this.$img2.src = cam.img2 || '';
    } else {
      this.$img1.removeAttribute('src');
      this.$img2.removeAttribute('src');
    }
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('PeoplePanelExtension', PeoplePanelExtension);
