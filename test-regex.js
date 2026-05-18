const testLines = [
  "- **Primary:** `#3B82F6` — Token from style foundations.",
  "- **Secondary:** `#8B5CF6` — Token from style foundations.",
  "- **Success:** `#16A34A` — Token from style foundations.",
];

// 当前正则
const reA = /^\s*[-*]\s+\*\*([A-Za-z][A-Za-z0-9 /&()+_-]{1,40}?)\*\*\s*[:：]\s*`?(#[0-9a-fA-F]{3,8})/gm;

console.log("=== 测试正则表达式 ===\n");

for (const line of testLines) {
  console.log(`测试行: ${line}`);
  const matches = [...line.matchAll(reA)];
  if (matches.length > 0) {
    for (const m of matches) {
      console.log(`  ✓ 匹配成功!`);
      console.log(`    完整匹配: [${m[0]}]`);
      console.log(`    名称 [1]: [${m[1]}]`);
      console.log(`    颜色 [2]: [${m[2]}]`);
    }
  } else {
    console.log(`  ✗ 没有匹配`);
  }
  console.log();
}

// 测试用整个文件
import { promises as fs } from 'node:fs';
const raw = await fs.readFile('design-systems/artistic/DESIGN.md', 'utf-8');
const fileMatches = [...raw.matchAll(reA)];
console.log(`\n=== 从整个文件提取 ===`);
console.log(`找到 ${fileMatches.length} 个匹配`);
fileMatches.forEach((m, i) => {
  console.log(`${i + 1}. ${m[1]}: ${m[2]}`);
});
