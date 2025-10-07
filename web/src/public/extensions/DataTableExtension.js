import { SensorListExtensionID, SensorSpritesExtensionID, SensorDetailExtensionID, SensorHeatmapsExtensionID, NewToolbarExtensionID } from "../viewer";
import {
    DataTableExtensionID
} from './viewer.js';

export class DataTableExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.panel = null;
  }

  lload() {
  console.log('✅ [DataTableExtension] loaded');
  document.addEventListener('eco:toggle', () => this.togglePanel());
  return true;
}

  togglePanel() {
    if (!this.panel) {
      this.panel = new EcoPanel(this.viewer.container, [
        { key: 'tab1', title: '分項工程碳排分布', src: 'data/分項工程碳排分布.json' },
        { key: 'tab2', title: '建材碳排分析', src: 'data/建築生命週期分布.json' }
      ]);
    }

    const visible = this.panel.isVisible();
    this.panel.setVisible(!visible);
    if (!visible) this.panel.ensureInit();
  }

  unload() {
    if (this.panel) {
      this.panel.setVisible(false);
      this.panel = null;
    }
    return true;
  }
}

// ---------------- EcoPanel ----------------
class EcoPanel extends Autodesk.Viewing.UI.DockingPanel {
  constructor(parent, tabs) {
    super(parent, 'eco-panel', '碳排資訊');
    Object.assign(this.container.style, {
      width: '680px',
      height: '420px',
      left: '40px',
      top: '80px',
      resize: 'none',
      overflow: 'hidden'
    });
    this.tabs = tabs;
    this.currentKey = tabs[0]?.key;
    this.dataTable = null;
    this._initialized = false;
  }

  initialize() {
    const title = this.createTitleBar(this.titleLabel || '碳排資訊');
    this.container.appendChild(title);

    // 分頁列
    this.tabBar = document.createElement('div');
    Object.assign(this.tabBar.style, {
      display: 'flex',
      gap: '8px',
      padding: '8px'
    });
    this.container.appendChild(this.tabBar);

    // 內容區
    this.body = document.createElement('div');
    Object.assign(this.body.style, {
      height: 'calc(100% - 90px)',
      overflow: 'auto',
      padding: '8px'
    });
    this.container.appendChild(this.body);

    this._renderTabs();
    this._initialized = true;
  }

  ensureInit() {
    if (!this._initialized) this.initialize();
    if (!this.dataTable) this._loadCurrentTab();
  }

  _renderTabs() {
    this.tabBar.innerHTML = '';
    this.tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.textContent = tab.title;
      Object.assign(btn.style, {
        padding: '4px 8px',
        borderRadius: '4px',
        background: tab.key === this.currentKey ? '#007b5e' : '#444',
        color: 'white',
        border: 'none',
        cursor: 'pointer'
      });
      btn.onclick = () => this.selectTab(tab.key);
      this.tabBar.appendChild(btn);
    });
  }

  selectTab(key) {
    if (this.currentKey === key) return;
    this.currentKey = key;
    this._renderTabs();
    this._loadCurrentTab();
  }

  async _loadCurrentTab() {
    const tab = this.tabs.find(t => t.key === this.currentKey);
    if (!tab?.src) return;

    const nf = new Intl.NumberFormat();
    const res = await fetch(tab.src);
    const list = await res.json();

    const columns = [
      { name: '分項' },
      { name: '碳排量 (kgCO2)' },
      { name: '占比(%)' }
    ];
    const total = list.reduce((s, it) => s + Number(it['碳排量 (kgCO2)'] || 0), 0);
    const rows = list.map(it => {
      const name = it['分項'] ?? it['項目'] ?? '';
      const val  = Number(it['碳排量 (kgCO2)'] || 0);
      const pct  = total > 0 ? (val / total * 100) : 0;
      return [name, nf.format(val), pct.toFixed(1)];
    });

    // --- Viewer DataTable 或 fallback ---
    if (Autodesk?.Viewing?.UI?.DataTable) {
      if (!this.dataTable)
        this.dataTable = new Autodesk.Viewing.UI.DataTable(this);
      this.dataTable.setData(rows, columns);
    } else {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.innerHTML = `
        <thead>
          <tr>${columns.map(c => `<th style="border-bottom:1px solid #ccc;padding:4px;">${c.name}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>${r.map(c => `<td style="padding:4px;">${c}</td>`).join('')}</tr>`).join('')}
        </tbody>
      `;
      this.body.innerHTML = '';
      this.body.appendChild(table);
    }
  }

  onClose() {
    if (this.dataTable?.destroyTable) this.dataTable.destroyTable();
    this.dataTable = null;
    super.onClose();
  }
}


