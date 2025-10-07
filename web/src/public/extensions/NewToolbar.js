import { UIBaseExtension } from './BaseExtension.js';
import { EcoPanelExtensionID } from './EcoPanelExtension.js';

export const NewToolbarExtensionID = 'NewToolbar';

export class NewToolbar extends UIBaseExtension {
  constructor(viewer, options) {
    super(viewer, options);
    this.subToolbar = null;
    this.openPeopleButton = false;
    this.peopleDOM = null;
    this.cctvDOM = null;
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

  onToolbarCreated(toolbar) {
    console.log('NewToolbar onToolbarCreated');
    if (!toolbar) return;

    // === 建立群組 ===
    const group = new Autodesk.Viewing.UI.ControlGroup('new-toolbar-group');
    this.viewer.toolbar.addControl(group); // 🔹加到 toolbar
    this.subToolbar = group;

    // === 共用按鈕建立函式 ===
    const addBtn = (id, tip, iconUrl, onClick) => {
      const btn = new Autodesk.Viewing.UI.Button(id);
      btn.setToolTip(tip);
      btn.addClass('new-toolbar-icon');
      btn.container.style.backgroundImage = `url("${iconUrl}")`;
      btn.container.style.backgroundRepeat = 'no-repeat';
      btn.container.style.backgroundPosition = 'center';
      btn.container.style.backgroundSize = '24px';
      btn.onClick = onClick;
      group.addControl(btn);
      return btn;
    };

    // === 1️⃣ Eco 按鈕：開啟 EcoPanelExtension ===
    addBtn(
      'eco-button',
      'Eco',
      'https://img.icons8.com/external-jumpicon-line-ayub-irawan/32/FFFFFF/external-eco-ecology-jumpicon-line-jumpicon-line-ayub-irawan-4.png',
      async () => {
        try {
          console.log('🟢 Eco button clicked');
          let ecoExt = this.viewer.getExtension(EcoPanelExtensionID);
          if (!ecoExt) {
            console.log('🟠 載入 EcoPanelExtension 中...');
            await this.viewer.loadExtension(EcoPanelExtensionID);
            ecoExt = this.viewer.getExtension(EcoPanelExtensionID);
          }
          ecoExt.showPanel();
        } catch (err) {
          console.error('❌ EcoPanelExtension 載入失敗：', err);
        }
      }
    );

    // === 2️⃣ People 按鈕 ===
    addBtn(
      'people-button',
      '人流',
      'https://img.icons8.com/ios-filled/50/FFFFFF/crowd.png',
      (event) => {
        const displayViewer = document.getElementsByClassName('adsk-viewing-viewer')[0];
        const btnRect = (event.currentTarget || event.target).getBoundingClientRect();
        const viewerRect = displayViewer.getBoundingClientRect();

        if (!document.getElementById('people-drag-style')) {
          const style = document.createElement('style');
          style.id = 'people-drag-style';
          style.textContent = `
            .wrapper { position:absolute; z-index:9999;}
            .title { display:inline-block; padding:6px 10px; cursor:move; user-select:none;
                     color:#fff; border-radius:8px; font-weight: bold; }
          `;
          document.head.appendChild(style);
        }

        if (!displayViewer.style.position) displayViewer.style.position = 'relative';

        // 拖曳工具
        function makeDraggable(box, grip, boundaryEl) {
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
            const bw = boundaryEl.clientWidth, bh = boundaryEl.clientHeight;
            const ww = box.offsetWidth, wh = box.offsetHeight;
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

        // 建立 DOM
        if (!this.peopleDOM) {
          const events = ['People Detection', 'People Heatmap'];
          const wrapper = document.createElement('div');
          wrapper.className = 'wrapper';

          const title = document.createElement('span');
          title.className = 'title';
          title.innerText = 'CCTV Detection';
          wrapper.appendChild(title);

          const dropDownArea = document.createElement('div');
          const counter = document.createElement('span');
          dropDownArea.className = 'drop_down_area';
          counter.className = 'counter';
          counter.innerText = ' Number: 174 ';
          dropDownArea.appendChild(counter);

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

          const initLeft = (btnRect.left - viewerRect.left) - 100;
          const initTop  = (btnRect.top  - viewerRect.top ) - 490;
          wrapper.style.left = Math.max(0, initLeft) + 'px';
          wrapper.style.top  = Math.max(0, initTop ) + 'px';

          makeDraggable(wrapper, title, displayViewer);
          this.peopleDOM = wrapper;
        } else {
          const newLeft = (btnRect.left - viewerRect.left) - 100;
          const newTop  = (btnRect.top  - viewerRect.top ) - 490;
          this.peopleDOM.style.left = Math.max(0, newLeft) + 'px';
          this.peopleDOM.style.top  = Math.max(0, newTop ) + 'px';
        }

        if (displayViewer.contains(this.peopleDOM)) {
          displayViewer.removeChild(this.peopleDOM);
          this.openPeopleButton = false;
        } else {
          displayViewer.appendChild(this.peopleDOM);
          this.openPeopleButton = true;
        }
      }
    );

    // === 3️⃣ CCTV 按鈕 ===
    addBtn(
      'cctv-button',
      'CCTV',
      'https://img.icons8.com/ios-filled/50/FFFFFF/private-wall-mount-camera--v2.png',
      (event) => {
        const displayViewer = document.getElementsByClassName('adsk-viewing-viewer')[0];
        const btnRect = (event.currentTarget || event.target).getBoundingClientRect();
        const viewerRect = displayViewer.getBoundingClientRect();

        if (!document.getElementById('cctv-video-style')) {
          const style = document.createElement('style');
          style.id = 'cctv-video-style';
          style.textContent = `
            .cctv-wrapper {
              position:absolute; z-index:9999;
              width: 360px;
              background:rgba(0,0,0,0.8);
              border:1px solid rgba(255,255,255,0.2);
              border-radius:12px; overflow:hidden;
              color:#fff; font-family:system-ui,Segoe UI,Roboto;
              box-shadow:0 6px 18px rgba(0,0,0,0.4);
            }
            .cctv-title {
              padding:8px 12px;
              font-weight:700;
              background:rgba(30,30,30,0.85);
              cursor:move; user-select:none;
            }
            .cctv-body { padding:8px; }
            .cctv-body video {
              width:100%; height:auto; display:block; background:#111; border-radius:8px;
            }
          `;
          document.head.appendChild(style);
        }

        if (!displayViewer.style.position) displayViewer.style.position = 'relative';

        function makeDraggable(box, grip, boundaryEl) {
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
            const bw = boundaryEl.clientWidth, bh = boundaryEl.clientHeight;
            const ww = box.offsetWidth, wh = box.offsetHeight;
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

        if (!this.cctvDOM) {
          const wrapper = document.createElement('div');
          wrapper.className = 'cctv-wrapper';

          const title = document.createElement('div');
          title.className = 'cctv-title';
          title.textContent = 'CCTV Video';
          wrapper.appendChild(title);

          const body = document.createElement('div');
          body.className = 'cctv-body';

          const video = document.createElement('video');
          video.src = 'video/CCTVvideo.mp4';
          video.controls = true;
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          body.appendChild(video);

          wrapper.appendChild(body);

          const initLeft = (btnRect.left - viewerRect.left) - 80;
          const initTop  = (btnRect.top  - viewerRect.top ) - 260;
          wrapper.style.left = Math.max(0, initLeft) + 'px';
          wrapper.style.top  = Math.max(0, initTop ) + 'px';

          makeDraggable(wrapper, title, displayViewer);
          this.cctvDOM = wrapper;
          this.cctvVideoEl = video;
        }

        if (displayViewer.contains(this.cctvDOM)) {
          try { this.cctvVideoEl?.pause(); } catch(e){}
          displayViewer.removeChild(this.cctvDOM);
          this.openCCTVButton = false;
        } else {
          displayViewer.appendChild(this.cctvDOM);
          this.openCCTVButton = true;
          const newLeft = (btnRect.left - viewerRect.left) - 80;
          const newTop  = (btnRect.top  - viewerRect.top ) - 260;
          this.cctvDOM.style.left = Math.max(0, newLeft) + 'px';
          this.cctvDOM.style.top  = Math.max(0, newTop ) + 'px';
        }
      }
    );
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(NewToolbarExtensionID, NewToolbar);
