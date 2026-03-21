// ElecPanel.js
import { applyCarbonCategoryColor } from './ColorCarbon.js';

export const ElecPanelExtensionID = 'ElecPanelExtension';

export class ElecPanelExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.panel = null;
    this.currentTab = null;
    this.scrollArea = null;
  }

  load() {
    console.log(`${ElecPanelExtensionID} loaded`);
    return true;
  }

  unload() {
    if (this.panel) {
      this.panel.setVisible(false);
      this.panel = null;
    }
    console.log(`${ElecPanelExtensionID} unloaded`);
    return true;
  }

  //外部按鈕呼叫面板
  async showPanel() {
    if (!this.panel) {
      this.panel = new Autodesk.Viewing.UI.DockingPanel(
        this.viewer.container,
        'elec-panel',
        '智慧電表'
      );

      const container = this.panel.container;
      container.classList.add('elec-panel');
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
      // contentDiv.classList.add('docking-panel-scroll', 'elec-panel-content');
      contentDiv.style.height = 'calc(100% - 50px)'; // 留給 title bar
      contentDiv.style.display = 'flex';
      contentDiv.style.flexDirection = 'column';
      contentDiv.style.overflow = 'hidden'; // 確保外層容器不捲動，只讓內部的表格區捲動
      container.appendChild(contentDiv);

      //分頁按鈕列
      const tabsContainer = document.createElement('div');
      tabsContainer.style.display = 'flex';
      tabsContainer.style.gap = '10px';
      tabsContainer.style.marginBottom = '10px';
      contentDiv.appendChild(tabsContainer);

      
      const tabNames = [
        { name: '冷氣用電', file: '/data/eco_aircondition.json' },
        { name: '電腦教室插座用電', file: '/data/BIM.json' },
        { name: '電腦教室照明用電', file: '/data/LCA_distribution.json' },
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
      scrollArea.id = 'elec-table-scroll';
      scrollArea.style.flex = '1';
      scrollArea.style.minHeight = '0';
      scrollArea.style.display = 'flex';
      scrollArea.style.flexDirection = 'column';
      tabsContainer.style.padding = '15px 15px 0 15px';

      // 上方：資料視窗（可上下滾、可左右滾，但底部我們會做一個永遠可見的 toolbar）
      const dataViewport = document.createElement('div');
      dataViewport.id = 'elec-data-viewport';
      dataViewport.style.flex = '1';
      dataViewport.style.minHeight = '0';
      dataViewport.style.overflow = 'auto';       // 這裡負責上下 + 左右
      dataViewport.style.paddingBottom = '8px';   // 留一點空間避免貼底
      dataViewport.style.overflow = 'auto'; // 只有這裡會產生捲軸
      dataViewport.innerHTML = `<p style='padding-left: 15px; color: #aaa; font-weight: 700">請選擇上方分頁載入資料</p>`;

      // 下方：水平拖拉條（永遠可見）
      // 捲軸的運作原理是：「外層容器（hToolbar）」比「內層元件（hInner）」小
      const hToolbar = document.createElement('div');
      hToolbar.id = 'elec-h-toolbar';
      hToolbar.style.flex = '0 0 14px';
      hToolbar.style.height = '14px';
      hToolbar.style.overflowX = 'auto';
      hToolbar.style.overflowY = 'hidden';
      hToolbar.style.borderTop = '1px solid rgba(255,255,255,0.08)';

      // 這個 inner 用來撐出可拖拉的寬度（之後會設定成 table 的 offsetllWidth）
      const hInner = document.createElement('div');
      hInner.id = 'elec-h-inner';
      hInner.style.height = '1px';
      hInner.style.width = '0px';
      hToolbar.appendChild(hInner);

      // 同步左右捲動：dataViewport <-> hToolbar
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

  //JSON表格
  async loadTable(filePath, tabName) {
    // const scrollArea = this.scrollArea;
    // 🔍 找到 viewport 容器，而不是直接清空整個 scrollArea
    const viewport = document.getElementById('elec-data-viewport');
    
    if (viewport) {
      viewport.innerHTML = `<p style='padding-left: 15px; color: #aaa; font-weight: 700'>正在載入 ${tabName} 資料...</p>`;
    }

    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // 🧠 自動偵測主 key
      const mainKey = Array.isArray(json) ? null : Object.keys(json)[0];
      const data = mainKey ? json[mainKey] : json;

      let columns = [];
      let rows = [];

      //結構判斷
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

      //生成表格
      const table = document.createElement('table');
      table.style.width = 'auto';
      table.style.minWidth = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.textAlign = 'left';
      table.style.fontSize = '14px';
      table.style.tableLayout = 'auto';

      // 標題列
      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');
      // === 修改標題列循環 (thead) ===
      columns.forEach((col) => {
        const th = document.createElement('th');
        th.innerText = col;
        
        // 設定每一欄的寬度
        // th.style.width = '100px';           // 你可以根據需要調整數值，100px~150px 通常很合適
        // th.style.minWidth = '100px';
        
        th.innerText = col;
        th.style.borderBottom = '1px solid #888';
        th.style.padding = '8px';           // 稍微增加一點內邊距，看起來更舒服
        th.style.color = '#00E676';
        th.style.whiteSpace = 'nowrap';
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
      const viewport = document.getElementById('elec-data-viewport');
			if (viewport) {
			    viewport.innerHTML = ''; // 只清空文字
			    viewport.appendChild(table); // 把新表格放進去

          // 如果你有同步捲軸的功能，記得在這裡更新 hInner 的寬度
          if (this.hInner) {
              this.hInner.style.width = table.offsetWidth + 'px';
          }
			}
    
    } catch (err) {
      console.error('❌ 無法載入資料：', err);
      const viewport = document.getElementById('elec-data-viewport');
    if (viewport) {
        viewport.innerHTML = `<p style='padding-left: 15px; color: #f66; font-weight: 700'>載入 ${tabName} 失敗：${err.message}</p>`;
    }
    }
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  ElecPanelExtensionID,
  ElecPanelExtension
);
