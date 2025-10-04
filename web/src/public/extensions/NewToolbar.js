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
    addBtn('people-button', '人流',
      'https://img.icons8.com/ios-filled/50/FFFFFF/crowd.png',
      (event) => {
        const displayViewer = document.getElementsByClassName('adsk-viewing-viewer')[0];
        const rect = event.target.getBoundingClientRect();

        if (!this.peopleDOM) {
          const events = ['People Detection', 'People Heatmap'];
          const wrapper = document.createElement('div');

          // --- top layer ---
          const title = document.createElement('span');
          wrapper.className = 'wrapper';
          title.className = 'title';
          title.innerText = 'CCTV Detection';
          wrapper.appendChild(title);
          // --- top layer ---

          // --- second layer ---
          const dropDownArea = document.createElement('div');
          const counter = document.createElement('span');
          dropDownArea.className = 'drop_down_area';
          counter.className = 'counter';
          counter.innerText = 'Number: 174';

          dropDownArea.appendChild(counter);
          // --- second layer ---
          const eventWrapper = document.createElement('div');
          eventWrapper.className = 'event_wrapper';
          for (let index in events) {
            const currentEvent = events[index];
            const eventDOM = document.createElement('div');
            const nameDOM = document.createElement('span');
            const displayDOM = document.createElement('div');
            const IMG = document.createElement('img');

            eventDOM.className = currentEvent;
            displayDOM.className = 'display_img';
            nameDOM.innerText = currentEvent;

            eventDOM.appendChild(nameDOM);
            displayDOM.appendChild(IMG);
            eventDOM.appendChild(displayDOM);
            eventWrapper.appendChild(eventDOM);
          }

          wrapper.appendChild(dropDownArea);
          wrapper.appendChild(eventWrapper);
  
          this.peopleDOM = wrapper;
        }

        this.peopleDOM.style.left = `${rect.left - 100}px`;
        this.peopleDOM.style.top = `${rect.top - 490}px`; // 離按鈕一點距離

        if (this.openPeopleButton) {
          this.openPeopleButton = false;
          displayViewer.removeChild(this.peopleDOM);
        } else {
          this.openPeopleButton = true;
          displayViewer.appendChild(this.peopleDOM);
        }
      });
    addBtn('cctv-button', 'CCTV',
      'https://img.icons8.com/ios-filled/50/FFFFFF/private-wall-mount-camera--v2.png',
      () => console.log('[CCTV] clicked'));

    toolbar.addControl(group);
    this.subToolbar = group;
  }
}
