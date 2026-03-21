// /extensions/ColorCarbon.js  （檔名要跟 EcoPanel.js 的 import 一致）

// 分項 → 條件 + 顏色
export const CARBON_CATEGORY_RULES = {
  '主結構碳排': {
    // 名稱包含「結構柱」
    includeAny: ['結構柱'],
    color: new THREE.Vector4(1.0, 0.0, 0.0, 1.0)     
  },
  '一般外牆外裝': {
    // 名稱包含「外牆」
    includeAny: ['外牆'],
    color: new THREE.Vector4(1.0, 0.451, 0.0, 1.0)     
  },
  '外窗與透光帷幕外窗': {
    includeAny: ['窗','帷幕'],
    color: new THREE.Vector4(1.0, 0.843, 0.0, 1.0) 
  },
  '不透光帷幕外牆及一般外牆': {
    includeAny: ['帷幕'],
    color: new THREE.Vector4(0.549, 0.902, 0.0, 1.0)     
  },
  '內隔間': {
    includeAny: ['內牆'],
    color: new THREE.Vector4(0.0, 1.0, 1.0, 1.0) // 黃
  },
  '室內地坪': {
    // 名稱只要有「磨石」就算
    includeAny: ['磨石'],
    color: new THREE.Vector4(0.0, 0.498, 1.0, 1.0) // 藍偏紫
  },
  '戶外地坪': {
    includeAny: ['洗石','平台','木棧道'],
    color: new THREE.Vector4(0.0, 0.0, 1.0, 1.0) // 深藍
  }
};

// 簡單比對：只用 includeAny
function nameMatchesRule(name, rule) {
  const lower = (name || '').toLowerCase();
  const includeAny = rule.includeAny || [];
  if (!includeAny.length) return false;

  return includeAny.some(kw =>
    lower.includes(kw.toLowerCase())
  );
}

// 依 rule 收集符合條件的 leaf dbId
function collectDbIdsByRule(viewer, rule) {
  const it = viewer.model.getData().instanceTree;
  const rootId = it.getRootId();
  const result = [];

  function traverse(nodeId, matchedAncestor) {
    const name = it.getNodeName(nodeId) || '';

    const thisMatch = nameMatchesRule(name, rule);
    const isInMatchedBranch = matchedAncestor || thisMatch;

    const childCount = it.getChildCount(nodeId);
    if (isInMatchedBranch && childCount === 0) {
      result.push(nodeId);
    }

    it.enumNodeChildren(nodeId, childId => {
      traverse(childId, isInMatchedBranch);
    });
  }

  traverse(rootId, false);
  return result;
}

/**
 * 全部分項一起上色（給「全部」用）
 */
export function applyAllCarbonCategories(viewer) {
  viewer.clearThemingColors();

  Object.entries(CARBON_CATEGORY_RULES).forEach(([name, rule]) => {
    const dbIds = collectDbIdsByRule(viewer, rule);
    console.log(`全部著色：分項【${name}】 → ${dbIds.length} 個元件`);
    dbIds.forEach(id => {
      viewer.setThemingColor(id, rule.color, viewer.model, true);
    });
  });
}

/**
 * 主函式：依分項名稱上色
 * EcoPanel.js 會呼叫：
 *   applyCarbonCategoryColor(this.viewer, categoryName)
 * 其中若 categoryName === '全部'，會自動改成全開
 */
export function applyCarbonCategoryColor(viewer, categoryName) {
  const name = String(categoryName).trim();

  // ⭐ 特例：「全部」這一列 → 直接全開上色
  if (name === '全部') {
    applyAllCarbonCategories(viewer);
    return;
  }

  const rule = CARBON_CATEGORY_RULES[name];
  if (!rule) {
    console.warn('沒有為這個分項設定規則：', name);
    return;
  }

  viewer.clearThemingColors();

  const dbIds = collectDbIdsByRule(viewer, rule);
  console.log(`分項【${name}】 套用規則`, rule, `→ 共 ${dbIds.length} 個元件`);

  dbIds.forEach(id => {
    viewer.setThemingColor(id, rule.color, viewer.model, true);
  });
}
