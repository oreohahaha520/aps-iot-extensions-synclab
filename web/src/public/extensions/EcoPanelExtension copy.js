export const EcoPanelExtensionID = 'EcoPanelExtension';

export class EcoPanelExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.panel = null;
    this.currentTab = null;
  }

  load() {
    console.log(`${EcoPanelExtensionID} loaded`);
    return true;
  }

  unload() {
    if (this.panel) {
      this.panel.setVisible(false);
      this.panel = null;
    }
    console.log(`${EcoPanelExtensionID} unloaded`);
    return true;
  }

  /** 👉 外部按鈕呼叫面板 */
  async showPanel() {
    if (!this.panel) {
      this.panel = new Autodesk.Viewing.UI.DockingPanel(
        this.viewer.container,
        'eco-panel',
        '建築碳排分析'
      );

      const container = this.panel.container;
      container.classList.add('eco-panel');

      const titleBar = this.panel.container.querySelector('.docking-panel-title');
      if (titleBar) {
        titleBar.style.fontWeight = '700';
        titleBar.style.letterSpacing = '0.5px';
}

      // === 面板樣式 ===
      container.style.width = '520px';
      container.style.height = '420px';
      container.style.left = '40px';
      container.style.top = '80px';
      container.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
      container.style.color = '#fff';
      container.style.fontFamily = 'Segoe UI, sans-serif';
      container.style.borderRadius = '10px';
      container.style.padding = '10px';
      container.style.overflow = 'hidden';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';

      // === 分頁按鈕列 ===
      const tabsContainer = document.createElement('div');
      tabsContainer.style.display = 'flex';
      tabsContainer.style.gap = '10px';
      tabsContainer.style.marginBottom = '10px';

      // 📂 你要顯示的不同 JSON 資料分頁
      const tabNames = [
        { name: '分項碳排', file: '/data/carbon_distribution.json' },
        { name: '建築基本資訊', file: '/data/BIM.json' },
        { name: '建築生命週期分佈', file: '/data/LCA_distribution.json' },
        { name: '非主結構蘊含材料碳排', file: '/data/carbon_stage.json' },
      ];

      // 生成分頁按鈕
      tabNames.forEach((tab) => {
        const btn = document.createElement('button');
        btn.innerText = tab.name;
        btn.style.flex = '1';
        btn.style.padding = '6px';
        btn.style.background = 'rgba(60,60,60,0.9)';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #666';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '10px';
        btn.style.fontWeight = '700';
        btn.addEventListener('click', () => this.loadTable(tab.file, tab.name));
        tabsContainer.appendChild(btn);
      });
      container.appendChild(tabsContainer);

      // === 滾動區域（表格顯示區） ===
      const scrollArea = document.createElement('div');
      scrollArea.id = 'eco-table-scroll';
      scrollArea.style.flex = '1';
      scrollArea.style.overflowY = 'auto';
      scrollArea.style.paddingRight = '5px';
      scrollArea.innerHTML = `<p>請選擇上方分頁載入資料</p>`;
      scrollArea.addEventListener(
        'wheel',
        (e) => {
          // 讓預設的「滾動這個 div」繼續，但阻止事件往外傳到 viewer
          e.stopPropagation();
        },
        { capture: true, passive: true }
      );

      container.appendChild(scrollArea);
      // 存起容器方便後面使用
      this.scrollArea = scrollArea;
    }

    // 顯示/隱藏切換
    const visible = this.panel.isVisible();
    this.panel.setVisible(!visible);
  }

  /** 🧩 動態載入 JSON 表格 */
async loadTable(filePath, tabName) {
  const scrollArea = this.scrollArea;
  scrollArea.innerHTML = `<p style="color:#aaa;">正在載入 ${tabName} 資料...</p>`;

  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // 🧠 自動偵測主 key
    const mainKey = Array.isArray(json) ? null : Object.keys(json)[0];
    const data = mainKey ? json[mainKey] : json;

    let columns = [];
    let rows = [];

    // === 🧩 結構判斷 ===
    if (data && Array.isArray(data.rows) && Array.isArray(data.columns)) {
      // ✅ 格式 1: {"key": {"columns": [...], "rows": [...]}}
      columns = data.columns;
      rows = data.rows;

    } else if (typeof data === 'object' && !Array.isArray(data)) {
      // ✅ 格式 2: {"key": { "名稱": "ABC", "樓層": 12 }}
      columns = ['項目', '內容'];
      rows = Object.entries(data);

    } else if (Array.isArray(data) && data.length && typeof data[0] === 'object') {
      // ✅ 格式 3: [{"項目": "名稱", "數值": 123}, {...}]
      columns = Object.keys(data[0]); // 例如 ["項目", "數值"]
      rows = data.map(obj => Object.values(obj));

    } else {
      throw new Error('不支援的 JSON 結構');
    }

    // === 生成表格 ===
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'left';
    table.style.fontSize = '14px';

    // 標題列
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    columns.forEach((col) => {
      const th = document.createElement('th');
      th.innerText = col;
      th.style.borderBottom = '1px solid #888';
      th.style.padding = '6px';
      th.style.color = '#00E676';
      th.style.position = 'sticky';
      th.style.top = '0';
      th.style.backgroundColor = 'rgba(30,30,30,0.9)';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    // 內容列
    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      row.forEach((cell, index) => {
        const td = document.createElement('td');
        td.innerText = cell;
        td.style.padding = '6px 8px';
        td.style.borderBottom = '1px solid #555';
        td.style.textAlign = index === 'left' ;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // 插入表格
    scrollArea.innerHTML = '';
    scrollArea.appendChild(table);
  } catch (err) {
    console.error('❌ 無法載入資料：', err);
    scrollArea.innerHTML = `<p style="color:#f66;">載入 ${tabName} 失敗：${err.message}</p>`;
  }
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  EcoPanelExtensionID,
  EcoPanelExtension
);
