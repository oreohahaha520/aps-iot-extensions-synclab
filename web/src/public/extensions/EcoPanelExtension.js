// EcoPanel.js
import { applyCarbonCategoryColor } from './ColorCarbon.js';

export const EcoPanelExtensionID = 'EcoPanelExtension';

export class EcoPanelExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.panel = null;
    this.currentTab = null;
    this.scrollArea = null;
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

  //外部按鈕呼叫面板
  async showPanel() {
    if (!this.panel) {
      this.panel = new Autodesk.Viewing.UI.DockingPanel(
        this.viewer.container,
        'eco-panel',
        '建築碳排分析'
      );

      const container = this.panel.container;
      container.classList.add('eco-panel');
      container.classList.add('docking-panel-container-solid-color-a');

      //Panel初始位置與尺寸
      container.style.width = '520px';
      container.style.height = '420px';
      container.style.left = '40px';
      container.style.top = '80px';

      //讓Panel可托拉調整大小
      container.style.resize = 'both';     // both / horizontal / vertical
      container.style.overflow = 'hidden'; // 重要：避免內容影響 resize handle
      container.style.minWidth = '420px';
      container.style.minHeight = '260px';
      container.style.maxWidth = '90vw';
      container.style.maxHeight = '90vh';

      //flex填充
      container.style.display = 'flex';
      container.style.flexDirection = 'column';

      const titleBar = container.querySelector('.docking-panel-title');
      if (titleBar) {
        titleBar.style.fontWeight = '700';
        titleBar.style.letterSpacing = '0.5px';
      }

      //剩下的高度作為可滾動內容區
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('docking-panel-scroll', 'eco-panel-content');
      contentDiv.style.height = 'calc(100% - 50px)'; // 留給 title bar
      contentDiv.style.display = 'flex';
      contentDiv.style.flexDirection = 'column';
      container.appendChild(contentDiv);

      //分頁按鈕列
      const tabsContainer = document.createElement('div');
      tabsContainer.style.display = 'flex';
      tabsContainer.style.gap = '10px';
      tabsContainer.style.marginBottom = '10px';
      contentDiv.appendChild(tabsContainer);

      
      const tabNames = [
        { name: '分項碳排', file: '/data/carbon_distribution.json' },
        { name: '建築基本資訊', file: '/data/BIM.json' },
        { name: '建築生命週期分佈', file: '/data/LCA_distribution.json' },
        { name: '非主結構蘊含材料碳排', file: '/data/carbon_stage.json' },
      ];

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
        btn.style.fontWeight = '700';
        btn.style.fontSize = '10px';
        btn.addEventListener('click', () => this.loadTable(tab.file, tab.name));
        tabsContainer.appendChild(btn);
      });

      // === 表格區：包含「資料視窗」+「底部水平拖拉條」 ===
      const scrollArea = document.createElement('div');
      scrollArea.id = 'eco-table-scroll';
      scrollArea.style.flex = '1';
      scrollArea.style.minHeight = '0';
      scrollArea.style.display = 'flex';
      scrollArea.style.flexDirection = 'column';
      tabsContainer.style.padding = '15px 15px 0 15px';

      // ✅ 上方：資料視窗（可上下滾、可左右滾，但底部我們會做一個永遠可見的 toolbar）
      const dataViewport = document.createElement('div');
      dataViewport.id = 'eco-data-viewport';
      dataViewport.style.flex = '1';
      dataViewport.style.minHeight = '0';
      dataViewport.style.overflow = 'auto';       // 這裡負責上下 + 左右
      dataViewport.style.paddingBottom = '8px';   // 留一點空間避免貼底
      dataViewport.innerHTML = `<p>請選擇上方分頁載入資料</p>`;

      // ✅ 下方：水平拖拉條（永遠可見）
      const hToolbar = document.createElement('div');
      hToolbar.id = 'eco-h-toolbar';
      hToolbar.style.flex = '0 0 14px';
      hToolbar.style.height = '14px';
      hToolbar.style.overflowX = 'auto';
      hToolbar.style.overflowY = 'hidden';
      hToolbar.style.borderTop = '1px solid rgba(255,255,255,0.08)';

      // 這個 inner 用來撐出可拖拉的寬度（之後會設定成 table 的 scrollWidth）
      const hInner = document.createElement('div');
      hInner.id = 'eco-h-inner';
      hInner.style.height = '1px';
      hInner.style.width = '0px';
      hToolbar.appendChild(hInner);

      // ✅ 同步左右捲動：dataViewport <-> hToolbar
      let syncing = false;

      dataViewport.addEventListener('scroll', () => {
        if (syncing) return;
        syncing = true;
        hToolbar.scrollLeft = dataViewport.scrollLeft;
        syncing = false;
      });

      hToolbar.addEventListener('scroll', () => {
        if (syncing) return;
        syncing = true;
        dataViewport.scrollLeft = hToolbar.scrollLeft;
        syncing = false;
      });

      scrollArea.appendChild(dataViewport);
      scrollArea.appendChild(hToolbar);

      contentDiv.appendChild(scrollArea);

      // 讓 loadTable 能找到 viewport
      this.scrollArea = scrollArea;
      this.dataViewport = dataViewport;
      this.hToolbar = hToolbar;
      this.hInner = hInner;

      // 🔒 防止滾輪事件被 Viewer 抓去縮放
      contentDiv.addEventListener(
        'wheel',
        (e) => {
          e.stopPropagation();
        },
        { capture: true, passive: true }
      );
    }

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
        columns = Object.keys(data[0]);
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
          // ✅ index 0 左對齊，其它右對齊
          td.style.textAlign ='left';
          tr.appendChild(td);
        });

        // ★ 如果是「分項碳排」這個分頁 → 點列觸發顏色分級
        if (tabName === '分項碳排' || filePath.includes('carbon_distribution')) {
          const categoryName = row[0]; // 第一欄：分項名稱
          tr.style.cursor = 'pointer';

          tr.addEventListener('click', () => {
            applyCarbonCategoryColor(this.viewer, categoryName);
          });

          tr.addEventListener('mouseenter', () => {
            tr.style.backgroundColor = 'rgba(80,80,80,0.9)';
          });
          tr.addEventListener('mouseleave', () => {
            tr.style.backgroundColor = '';
          });
        }

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
