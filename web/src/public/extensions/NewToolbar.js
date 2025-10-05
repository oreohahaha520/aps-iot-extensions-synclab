import { UIBaseExtension } from './BaseExtension.js';

export const NewToolbarExtensionID = 'NewToolbar';

export class NewToolbar extends UIBaseExtension {
  constructor(viewer, options) {
    super(viewer, options);
    this.subToolbar = null;
    this.openPeopleButton = false;
    this.peopleDOM = null;
  }

  async load() {
    await super.load();
    console.log(`${NewToolbarExtensionID} loaded`);
    return true;
  }

  unload() {
    super.unload();
    if (this.subToolbar && this.viewer?.toolbar) {
      this.viewer.toolbar.removeControl(this.subToolbar);
    }
    this.subToolbar = null;
    console.log(`${NewToolbarExtensionID} unloaded`);
    return true;
  }

  activate() { super.activate(); return true; }
  deactivate() { super.deactivate(); return true; }

  onToolbarCreated(toolbar) {                     // ← 接參數
    console.log('NewToolbar onToolbarCreated');   // ← 偵錯log
    if (!toolbar) return;

    const group = new Autodesk.Viewing.UI.ControlGroup('new-toolbar-group');

    const addBtn = (id, tip, iconUrl, onClick) => {
      const btn = new Autodesk.Viewing.UI.Button(id);
      btn.setToolTip(tip);
      btn.addClass('new-toolbar-icon');
      btn.container.style.backgroundImage = `url("${iconUrl}")`;
      btn.container.style.backgroundRepeat = 'no-repeat';     // ← 新增
      btn.container.style.backgroundPosition = 'center';      // ← 新增
      btn.container.style.backgroundSize = '24px';            // ← 新增
      btn.onClick = onClick;
      group.addControl(btn);
      return btn;
    };

    addBtn('eco-button', 'Eco',
      'https://img.icons8.com/external-jumpicon-line-ayub-irawan/32/FFFFFF/external-eco-ecology-jumpicon-line-jumpicon-line-ayub-irawan-4.png',
      () => console.log('[Eco] clicked'));
addBtn(
  'people-button',
  '人流',
  'https://img.icons8.com/ios-filled/50/FFFFFF/crowd.png',
  (event) => {
    const displayViewer = document.getElementsByClassName('adsk-viewing-viewer')[0];
    const btnRect = (event.currentTarget || event.target).getBoundingClientRect();
    const viewerRect = displayViewer.getBoundingClientRect();

    // 只注入一次基本樣式
    if (!document.getElementById('people-drag-style')) {
      const style = document.createElement('style');
      style.id = 'people-drag-style';
      style.textContent = `
        .wrapper { position:absolute; z-index:9999;}
        .title { display:inline-block; padding:6px 10px; cursor:move; user-select:none; -webkit-user-drag:none;
                //  background:#1119; 
                color:#fff; border-radius:8px;
                font-weight: bold; }
      `;
      document.head.appendChild(style);
    }

    // viewer 當作拖曳邊界容器
    if (!displayViewer.style.position) displayViewer.style.position = 'relative';

    // 拖曳工具：以 boundaryEl 邊界限制
    function makeDraggable(box, grip, boundaryEl){
      let sx=0, sy=0, sl=0, st=0;
      const onDown = (e) => {
        e.preventDefault();
        sx = e.clientX; sy = e.clientY;
        sl = parseFloat(box.style.left)||0;
        st = parseFloat(box.style.top)||0;
        grip.setPointerCapture?.(e.pointerId);
        grip.addEventListener('pointermove', onMove);
        grip.addEventListener('pointerup', onUp);
        grip.addEventListener('pointercancel', onUp);
      };
      const onMove = (e) => {
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        let nl = sl + dx, nt = st + dy;

        const bw = boundaryEl.clientWidth,  bh = boundaryEl.clientHeight;
        const ww = box.offsetWidth,         wh = box.offsetHeight;

        // 邊界限制
        nl = Math.min(Math.max(0, nl), Math.max(0, bw - ww));
        nt = Math.min(Math.max(0, nt), Math.max(0, bh - wh));

        box.style.left = nl + 'px';
        box.style.top  = nt + 'px';
      };
      const onUp = (e) => {
        grip.releasePointerCapture?.(e.pointerId);
        grip.removeEventListener('pointermove', onMove);
        grip.removeEventListener('pointerup', onUp);
        grip.removeEventListener('pointercancel', onUp);
      };
      grip.addEventListener('pointerdown', onDown);
    }

    // 生成 DOM（只建一次）
    if (!this.peopleDOM) {
      const events = ['People Detection', 'People Heatmap'];

      const wrapper = document.createElement('div');
      wrapper.className = 'wrapper';

      // top layer
      const title = document.createElement('span');
      title.className = 'title';
      title.innerText = 'CCTV Detection';
      wrapper.appendChild(title);

      // second layer
      const dropDownArea = document.createElement('div');
      const counter = document.createElement('span');
      dropDownArea.className = 'drop_down_area';
      counter.className = 'counter';
      counter.innerText = ' Number: 174 ';
      dropDownArea.appendChild(counter);

      // events
      const eventWrapper = document.createElement('div');
      eventWrapper.className = 'event_wrapper';
      for (const currentEvent of events) {
        const eventDOM = document.createElement('div');
        const nameDOM = document.createElement('span');
        const displayDOM = document.createElement('div');
        const IMG = document.createElement('img');

        eventDOM.className = currentEvent;
        nameDOM.innerText = currentEvent;
        displayDOM.className = 'display_img';

        displayDOM.appendChild(IMG);
        eventDOM.appendChild(nameDOM);
        eventDOM.appendChild(displayDOM);
        eventWrapper.appendChild(eventDOM);
      }

      wrapper.appendChild(dropDownArea);
      wrapper.appendChild(eventWrapper);

      // 初始座標：把按鈕的視窗座標換成 viewer 內部座標
      const initLeft = (btnRect.left - viewerRect.left) - 100;
      const initTop  = (btnRect.top  - viewerRect.top ) - 490;
      wrapper.style.left = Math.max(0, initLeft) + 'px';
      wrapper.style.top  = Math.max(0, initTop ) + 'px';

      // 啟用拖曳：title 當把手、viewer 為邊界
      makeDraggable(wrapper, title, displayViewer);

      this.peopleDOM = wrapper;
    } else {
      // 若已建立，點按鈕時可選擇重新定位到按鈕附近（需要就保留，不需要可刪）
      const newLeft = (btnRect.left - viewerRect.left) - 100;
      const newTop  = (btnRect.top  - viewerRect.top ) - 490;
      this.peopleDOM.style.left = Math.max(0, newLeft) + 'px';
      this.peopleDOM.style.top  = Math.max(0, newTop ) + 'px';
    }

    // 顯示/隱藏
    if (displayViewer.contains(this.peopleDOM)) {
      displayViewer.removeChild(this.peopleDOM);
      this.openPeopleButton = false;
    } else {
      displayViewer.appendChild(this.peopleDOM);
      this.openPeopleButton = true;
    }
  }
);
    addBtn('cctv-button', 'CCTV',
      'https://img.icons8.com/ios-filled/50/FFFFFF/private-wall-mount-camera--v2.png',
      () => console.log('[CCTV] clicked'));

    toolbar.addControl(group);
    this.subToolbar = group;
  }
}
