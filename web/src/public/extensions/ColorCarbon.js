// /extensions/ColorCarbon.js  (或 carbonColoring.js，但要跟 import 名稱一致)

// 分項 → 條件 + 顏色
export const CARBON_CATEGORY_RULES = {
  '主結構碳排': {
    // 單一關鍵字
    includeAny: ['結構柱'],
    color: new THREE.Vector4(1.0, 0.0, 0.0, 1.0)
  },
  '一般外牆外裝': {
    // 名稱包含「外牆」即可
    includeAny: ['外牆'],
    color: new THREE.Vector4(1, 1, 1, 1.0)
  },
  '外窗與透光帷幕外窗': {
    includeAny: ['窗'],
    color: new THREE.Vector4(0.128, 0.128, 0.872, 1.0)
  },
  '不透光帷幕外牆及一般外牆': {
    includeAny: ['帷幕外牆'],
    color: new THREE.Vector4(0.0, 0.0, 1.0, 1.0)
  },
  '內隔間': {
    includeAny: ['內牆'],
    color: new THREE.Vector4(0.919, 0.919, 0.081, 1.0)
  },
  '室內地坪': {
    // 名稱只要有「磨石」或「洗石子」其一都算
    includeAny: ['磨石'],
    color: new THREE.Vector4(0.236, 0.236, 0.764, 1.0)
  },
  '戶外地坪': {
    includeAny: ['洗石'],
    color: new THREE.Vector4(0.043, 0.043, 0.957, 1.0)
  }
};

/**
 * 判斷「名稱」是否符合這個 rule（布林邏輯）
 * 支援：
 *  - keyword: 單一關鍵字（等同 includeAny: ['xxx']）
 *  - includeAny: 任一個關鍵字有包含就算（OR）
 *  - includeAll: 所有關鍵字都要包含（AND）
 *  - exclude: 有包含任何一個排除關鍵字就淘汰（NOT）
 */
function nameMatchesRule(name, rule) {
  const lower = (name || '').toLowerCase();

  // 把 keyword 也當成 includeAny 來用（方便你寫）
  const includeAny = [
    ...(rule.includeAny || []),
    ...(rule.keyword ? [rule.keyword] : [])
  ];
  const includeAll = rule.includeAll || [];
  const exclude = rule.exclude || [];

  // OR：includeAny 裡只要有一個包含就算
  if (includeAny.length > 0) {
    const okAny = includeAny.some(kw =>
      lower.includes(kw.toLowerCase())
    );
    if (!okAny) return false;
  }

  // AND：includeAll 裡每一個都要包含
  if (includeAll.length > 0) {
    const okAll = includeAll.every(kw =>
      lower.includes(kw.toLowerCase())
    );
    if (!okAll) return false;
  }

  // NOT：有在 exclude 裡的就直接被踢掉
  if (exclude.length > 0) {
    const hasExcluded = exclude.some(kw =>
      lower.includes(kw.toLowerCase())
    );
    if (hasExcluded) return false;
  }

  return true;
}

/**
 * 依「rule」收集符合條件的 dbId（會看整棵樹）
 * 只收集 leaf 節點（真正幾何）
 */
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
 * 主函式：依分項名稱上色
 * EcoPanel.js 會呼叫：
 *   applyCarbonCategoryColor(this.viewer, categoryName)
 */
export function applyCarbonCategoryColor(viewer, categoryName) {
  const rule = CARBON_CATEGORY_RULES[categoryName];
  if (!rule) {
    console.warn('沒有為這個分項設定規則：', categoryName);
    return;
  }

  viewer.clearThemingColors();

  const dbIds = collectDbIdsByRule(viewer, rule);
  console.log(`分項【${categoryName}】 套用規則`, rule, `→ 共 ${dbIds.length} 個元件`);

  dbIds.forEach(id => {
    viewer.setThemingColor(id, rule.color, viewer.model, true);
  });
}
