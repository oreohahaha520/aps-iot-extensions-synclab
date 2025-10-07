export const EcoPanelExtensionID = 'EcoPanelExtension';

export class EcoPanelExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.panel = null;
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

  /** 👉 提供外部呼叫的方法 */
  async showPanel() {
    if (!this.panel) {
      this.panel = new Autodesk.Viewing.UI.DockingPanel(
        this.viewer.container,
        'eco-panel',
        '建築碳排分析' // 標題
      );

      const container = this.panel.container;
      container.classList.add('eco-panel');
      container.style.width = '500px';
      container.style.height = '400px';
      container.style.left = '40px';
      container.style.top = '80px';
      container.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
      container.style.color = '#fff';
      container.style.fontFamily = 'Segoe UI, sans-serif';
      container.style.borderRadius = '10px';
      container.style.padding = '10px';

    //   // 📦 Panel內容
    //   const content = document.createElement('div');
    //   content.innerHTML = `
    //     <h3 style="margin-bottom:8px;">建築碳排分析</h3>
    //     <p>這個面板由 <b>EcoPanelExtension</b> 建立，</p>
    //     <p>目前是靜態文字，之後可改成載入 JSON、Chart.js 等。</p>
    //   `;
    //   container.appendChild(content);
    // }
              // === 滾動區域 ===
      const scrollArea = document.createElement('div');
      scrollArea.id = 'eco-table-scroll';
      scrollArea.style.height = '320px';
      scrollArea.style.overflowY = 'auto';
      scrollArea.style.paddingRight = '5px';
      scrollArea.innerHTML = `<p>資料載入中...</p>`;
      container.appendChild(scrollArea);

      // === 載入 JSON ===
      try {
        const res = await fetch('/data/carbon_distribution.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const data = json['碳排清單'];
        if (!data || !Array.isArray(data.rows)) throw new Error('JSON 結構不符');

        const columns = data.columns;
        const rows = data.rows;

        // === 生成表格 ===
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.textAlign = 'left';
        table.style.fontSize = '14px';

        // 標題列
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        columns.forEach(col => {
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
        rows.forEach(row => {
          const tr = document.createElement('tr');
          row.forEach((cell, index) => {
            const td = document.createElement('td');
            td.innerText = cell;
            td.style.padding = '6px 8px';
            td.style.borderBottom = '1px solid #555';
            td.style.textAlign = index === 0 ? 'left' : 'right';
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // 更新內容
        scrollArea.innerHTML = '';
        scrollArea.appendChild(table);
      } catch (err) {
        console.error('❌ 無法載入碳排資料：', err);
        scrollArea.innerHTML = `<p style="color:#f66;">載入資料失敗：${err.message}</p>`;
      }
    }

    // === 顯示/隱藏切換 ===
    const visible = this.panel.isVisible();
    this.panel.setVisible(!visible);
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  EcoPanelExtensionID,
  EcoPanelExtension
);