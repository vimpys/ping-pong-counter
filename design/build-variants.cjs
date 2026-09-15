const fs = require("fs");
const must = (s, o) => { if (!s.includes(o)) throw new Error("missing: " + o.slice(0, 60)); return s; };
const rep = (s, o, n) => must(s, o).replace(o, n);
const between = (s, a, b, n) => { const i = must(s, a).indexOf(a) + a.length, j = must(s, b).indexOf(b); return s.slice(0, i) + n + s.slice(j); };

const gripSvg = (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="${c}"><circle cx="7" cy="5" r="1.5"/><circle cx="13" cy="5" r="1.5"/><circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/><circle cx="7" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/></svg>`;

// ---- Main: grip handles on player rows (idempotent)
{
  let s = fs.readFileSync("Main.dc.html", "utf8");
  const row = `<div style="display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 4px 0 16px;">\n        `;
  const n = s.split(row).length - 1;
  if (n === 6) {
    const grip = `<div style="width: 28px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: -4px;">${gripSvg("#6b717b")}</div>\n        `;
    s = s.split(row).join(`<div style="display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 4px 0 6px;">\n        ` + grip);
    fs.writeFileSync("Main.dc.html", s);
  } else if (n !== 0) throw new Error("rows " + n);
}

const base = fs.readFileSync("Match.dc.html", "utf8");
const ph = `        <div style="height: 34px;"></div>\n        <div style="height: 44px; width: 100%;"></div>\n`;

// ---- Deuce
{
  let s = base;
  const a = s.indexOf(`        <div style="height: 34px; border-radius: 17px;`);
  const endMark = `ย้อนแต้ม</div>\n        </div>\n`; const b = s.indexOf(endMark, a) + endMark.length;
  const filled = s.slice(a, b).replace("เสิร์ฟ · ลูก 1/2", "เสิร์ฟ · สลับทุกลูก");
  s = s.slice(0, a) + ph + s.slice(b);
  const p = s.indexOf(ph, a + ph.length); if (p < 0) throw new Error("ph");
  s = s.slice(0, p) + filled + s.slice(p + ph.length);
  s = rep(s, `letter-spacing: -0.03em;">7</div>`, `letter-spacing: -0.03em;">10</div>`);
  s = rep(s, `letter-spacing: -0.03em;">5</div>`, `letter-spacing: -0.03em;">10</div>`);
  s = rep(s, `<div style="height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; color: #6b717b;">แตะฝั่งที่ได้แต้มเพื่อนับคะแนน</div>`,
`<div style="height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
    <div style="height: 28px; border-radius: 14px; background: #f2b544; color: #121417; display: flex; align-items: center; gap: 8px; padding: 0 14px;">
      <div style="font-family: 'Chakra Petch', 'Anuphan', sans-serif; font-size: 15px; font-weight: 700;">ดิว</div>
      <div style="font-size: 13px; font-weight: 600;">ต้องนำ 2 แต้มถึงชนะ</div>
    </div>
  </div>`);
  fs.writeFileSync("MatchDeuce.dc.html", s);
}

const qrow = (rank, name, w, l, { next = false, style = "", rankColor = "#6b717b", gripColor = "#6b717b" } = {}) => `
      <div style="display: flex; align-items: center; gap: 12px; height: 50px;${style}">
        <div style="width: 20px; font-family: 'Chakra Petch', sans-serif; font-size: 15px; font-weight: 700; color: ${next ? "#f2b544" : rankColor}; text-align: center;">${rank}</div>
        <div style="flex-grow: 1; display: flex; align-items: center; gap: 8px;">
          <div style="font-size: 16px; font-weight: ${next ? 600 : 500};">${name}</div>${next ? `
          <div style="font-size: 11px; font-weight: 600; color: #121417; background: #f2b544; border-radius: 6px; padding: 1px 6px;">คนถัดไป</div>` : ""}
        </div>
        <div style="display: flex; gap: 10px; font-family: 'Chakra Petch', 'Anuphan', sans-serif; font-size: 14px; font-weight: 600;">
          <div style="color: #f2f1ee;">ชนะ ${w}</div>
          <div style="color: #6b717b;">แพ้ ${l}</div>
        </div>
        <div style="width: 36px; height: 44px; display: flex; align-items: center; justify-content: flex-end;">
          ${gripSvg(gripColor)}
        </div>
      </div>`;
const sep = `\n      <div style="height: 1px; background: #262a31;"></div>`;

// ---- Reorder (drag in progress: เจ dragged down to slot 2)
{
  let s = base;
  s = between(s, "<!--HINT-->", "<!--/HINT-->", `<div style="font-size: 12px; font-weight: 600; color: #f2b544; height: 18px;">กำลังย้าย เจ ไปลำดับที่ 2 · ปล่อยนิ้วเพื่อวาง</div>`);
  s = between(s, "<!--QUEUE-->", "<!--/QUEUE-->", `<div style="display: flex; flex-direction: column;">` +
    qrow(1, "ฝน", 2, 2, { next: true }) + sep +
    qrow(2, "เจ", 4, 3, { style: " background: #2c313a; border-radius: 14px; margin: 2px -10px; padding: 0 10px; box-shadow: 0 10px 28px rgba(0,0,0,0.5), inset 0 0 0 1px #3f4550; transform: scale(1.02);", rankColor: "#f2f1ee", gripColor: "#f2f1ee" }) + sep +
    qrow(3, "มิว", 1, 3) + sep +
    qrow(4, "แบงค์", 0, 1) + `\n    </div>`);
  fs.writeFileSync("MatchReorder.dc.html", s);
}

const sheet = (title, sub, actions) => `
  <div style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(8,9,11,0.62);"></div>
  <div style="position: absolute; left: 0; right: 0; bottom: 0; background: #1b1e23; border-radius: 24px 24px 0 0; padding: 10px 16px 24px 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 -12px 40px rgba(0,0,0,0.45);">
    <div style="align-self: center; width: 36px; height: 4px; border-radius: 2px; background: #3a404a;"></div>
    <div style="display: flex; flex-direction: column; gap: 2px; padding: 6px 4px 4px 4px;">
      <div style="font-family: 'Chakra Petch', 'Anuphan', sans-serif; font-size: 20px; font-weight: 700;">${title}</div>
      <div style="font-size: 13px; color: #9aa0a9;">${sub}</div>
    </div>
    ${actions}
    <div style="height: 52px; border-radius: 14px; box-shadow: inset 0 0 0 1px #3a404a; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600;">ยกเลิก</div>
  </div>
  `;
const action = (icon, title, desc, color = "#f2f1ee") => `<div style="min-height: 68px; border-radius: 14px; background: #252932; display: flex; align-items: center; gap: 14px; padding: 12px 16px; box-sizing: border-box;">
      <div style="width: 36px; height: 36px; border-radius: 18px; background: #1b1e23; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon}</div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div style="font-size: 16px; font-weight: 600; color: ${color};">${title}</div>
        <div style="font-size: 13px; color: #9aa0a9; text-wrap: pretty;">${desc}</div>
      </div>
    </div>`;
const exitIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ff8a7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H4.5v12H8"/><path d="M12 6.5L15.5 10 12 13.5M15.5 10H8"/></svg>`;
const flagIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ff8a7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17V3.5"/><path d="M5 4h9l-2 3.5 2 3.5H5"/></svg>`;
const voidIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f2f1ee" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="6.5"/><path d="M5.5 14.5l9-9"/></svg>`;

// ---- Queue player leaves
{
  let s = base;
  s = rep(s, "<!--OVERLAY-->", sheet("เจ", "ลำดับที่ 1 ในคิว · ชนะ 4 แพ้ 3",
    action(exitIcon, "ออกจากการแข่งขัน", "ย้ายไปท้ายรายชื่อ · เก็บสถิติไว้ กดกลับเข้าการแข่งขันได้ทุกเมื่อ", "#ff8a7a")));
  s = rep(s, `<div style="display: flex; align-items: center; gap: 12px; height: 50px;">
        <div style="width: 20px; font-family: 'Chakra Petch', sans-serif; font-size: 15px; font-weight: 700; color: #f2b544;`,
    `<div style="display: flex; align-items: center; gap: 12px; height: 50px; background: #2c313a; border-radius: 12px; margin: 0 -10px; padding: 0 10px;">
        <div style="width: 20px; font-family: 'Chakra Petch', sans-serif; font-size: 15px; font-weight: 700; color: #f2b544;`);
  fs.writeFileSync("MatchLeave.dc.html", s);
}

// ---- Current player withdraws
{
  let s = base;
  s = rep(s, "<!--OVERLAY-->", sheet("ต้น · กำลังแข่งฝั่งแดง", "เกมที่ 7 · สกอร์ 7–5",
    action(flagIcon, "ถอนตัว · ให้บอยชนะเกมนี้", "ต้นย้ายไปท้ายรายชื่อ (ออกจากการแข่งขัน) · เจลงเล่นเกมถัดไป", "#ff8a7a") + "\n    " +
    action(voidIcon, "ยกเลิกเกมนี้ · ไม่นับผล", "ต้นย้ายไปท้ายรายชื่อ (ออกจากการแข่งขัน) · เจลงแทน เริ่มใหม่ 0–0")));
  fs.writeFileSync("MatchWithdraw.dc.html", s);
}

// ---- After withdraw: ต้น listed at bottom, disabled
const returnIcon = (c) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7L4.5 10.5 8 14"/><path d="M4.5 10.5H12a3.5 3.5 0 000-7h-1"/></svg>`;
const outRow = (name, w, l, style = "") => `
      <div style="display: flex; align-items: center; gap: 12px; height: 50px;${style}">
        <div style="width: 20px; display: flex; justify-content: center;"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#4a5059" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H4.5v12H8"/><path d="M12 6.5L15.5 10 12 13.5M15.5 10H8"/></svg></div>
        <div style="flex-grow: 1; font-size: 16px; font-weight: 500; color: #6b717b; text-decoration: line-through; text-decoration-color: rgba(107,113,123,0.5);">${name}</div>
        <div style="display: flex; gap: 10px; font-family: 'Chakra Petch', 'Anuphan', sans-serif; font-size: 14px; font-weight: 600; color: #4a5059;">
          <div>ชนะ ${w}</div>
          <div>แพ้ ${l}</div>
        </div>
        <div style="width: 36px; height: 44px; display: flex; align-items: center; justify-content: flex-end;">${returnIcon("#6b717b")}</div>
      </div>`;
const outLabel = `
      <div style="display: flex; align-items: center; gap: 8px; height: 30px; font-size: 12px; font-weight: 600; color: #6b717b;">
        <div>ออกจากการแข่งขัน · แตะเพื่อกลับเข้า</div>
        <div style="flex-grow: 1; height: 1px; background: #262a31;"></div>
      </div>`;
const afterWithdraw = (outStyle = "") => {
  let s = base;
  s = rep(s, `font-weight: 700;">เกมที่ 7</div>`, `font-weight: 700;">เกมที่ 8</div>`);
  s = rep(s, `line-height: 1.1;">ต้น</div>`, `line-height: 1.1;">เจ</div>`);
  s = rep(s, `letter-spacing: -0.03em;">7</div>`, `letter-spacing: -0.03em;">0</div>`);
  s = rep(s, `letter-spacing: -0.03em;">5</div>`, `letter-spacing: -0.03em;">0</div>`);
  s = s.split(`<div style="width: 8px; height: 8px; border-radius: 4px; background: #ffffff;"></div>`).join(`<div style="width: 8px; height: 8px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.6);"></div>`);
  const u0 = s.indexOf(`        <div style="height: 44px; width: 100%; border-radius: 14px; background: rgba(0,0,0,0.22);`);
  const uEnd = `ย้อนแต้ม</div>\n        </div>\n`; const u1 = s.indexOf(uEnd, u0) + uEnd.length;
  s = s.slice(0, u0) + `        <div style="height: 44px; width: 100%;"></div>\n` + s.slice(u1);
  s = rep(s, `min-width: 22px; border-radius: 11px; background: #2f343d; font-family: 'Chakra Petch', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 6px; box-sizing: border-box;">4</div>`,
             `min-width: 22px; border-radius: 11px; background: #2f343d; font-family: 'Chakra Petch', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 6px; box-sizing: border-box;">3</div>`);
  s = between(s, "<!--QUEUE-->", "<!--/QUEUE-->", `<div style="display: flex; flex-direction: column;">` +
    qrow(1, "ฝน", 2, 2, { next: true }) + sep +
    qrow(2, "มิว", 1, 3) + sep +
    qrow(3, "แบงค์", 0, 1) +
    outLabel +
    outRow("ต้น", 6, 2, outStyle) + `\n    </div>`);
  return s;
};
fs.writeFileSync("MatchQueueOut.dc.html", afterWithdraw());
{
  let s = afterWithdraw(" background: #2c313a; border-radius: 12px; margin: 0 -10px; padding: 0 10px;");
  s = rep(s, "<!--OVERLAY-->", sheet("ต้น", "ออกจากการแข่งขันอยู่ · ชนะ 6 แพ้ 2",
    action(returnIcon("#f2b544"), "กลับเข้าการแข่งขัน", "ต่อท้ายคิวเป็นลำดับที่ 4 · นับสถิติต่อจากเดิม")));
  fs.writeFileSync("MatchRejoin.dc.html", s);
}

// ---- Winner dialog: ต้น wins 11–8, reaches 3-win streak
{
  let s = base;
  s = rep(s, `letter-spacing: -0.03em;">7</div>`, `letter-spacing: -0.03em;">11</div>`);
  s = rep(s, `letter-spacing: -0.03em;">5</div>`, `letter-spacing: -0.03em;">8</div>`);
  const dot = (c) => `<div style="width: 10px; height: 10px; border-radius: 5px; background: ${c}; flex-shrink: 0;"></div>`;
  s = rep(s, "<!--OVERLAY-->", `
  <div style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(8,9,11,0.7);"></div>
  <div style="position: absolute; left: 20px; right: 20px; top: 110px; background: #1b1e23; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
    <div style="background: #d9434a; padding: 22px 20px 20px 20px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <div style="font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8);">จบเกมที่ 7 · ฝั่งแดงชนะ</div>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M7 6H4v1.5A3.5 3.5 0 007.5 11M17 6h3v1.5a3.5 3.5 0 01-3.5 3.5"/><path d="M12 14v3.5M8.5 20.5h7M9.5 20.5l.5-3h4l.5 3"/></svg>
      <div style="font-family: 'Chakra Petch', 'Anuphan', sans-serif; font-size: 44px; font-weight: 700; line-height: 1.1;">ต้น ชนะ</div>
    </div>
    <div style="padding: 18px 20px 20px 20px; display: flex; flex-direction: column; gap: 14px;">
      <div style="display: grid; grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr); align-items: center;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <div style="font-family: 'Chakra Petch', sans-serif; font-size: 40px; font-weight: 700; line-height: 1;">11</div>
          <div style="font-size: 14px; color: #9aa0a9;">ต้น</div>
        </div>
        <div style="text-align: center; color: #4a5059; font-size: 24px; font-weight: 600;">–</div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <div style="font-family: 'Chakra Petch', sans-serif; font-size: 40px; font-weight: 700; line-height: 1; color: #9aa0a9;">8</div>
          <div style="font-size: 14px; color: #9aa0a9;">บอย</div>
        </div>
      </div>
      <div style="border-radius: 12px; background: rgba(242,181,68,0.12); padding: 10px 12px; font-size: 13px; font-weight: 500; color: #f2b544; text-align: center; text-wrap: pretty;">ชนะติดครบ 3 เกม · ต้นและบอยไปต่อท้ายคิว</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 12px; font-weight: 600; color: #6b717b;">เกมถัดไป</div>
        <div style="display: grid; grid-template-columns: minmax(0, 1fr) 32px minmax(0, 1fr); align-items: center; height: 48px; border-radius: 12px; background: #252932; padding: 0 14px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600;">${dot("#d9434a")}<div>เจ</div></div>
          <div style="text-align: center; font-size: 12px; color: #6b717b;">พบ</div>
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 17px; font-weight: 600;"><div>ฝน</div>${dot("#3b7be6")}</div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; padding-top: 4px;">
        <div style="height: 56px; border-radius: 16px; background: #f2f1ee; color: #121417; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#121417"><path d="M6 4.5v11l9-5.5z"/></svg>
          <div style="font-family: 'Chakra Petch', 'Anuphan', sans-serif; font-size: 18px; font-weight: 700;">เริ่มเกมถัดไป</div>
        </div>
        <div style="height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #9aa0a9;">
          ${returnIcon("#9aa0a9")}
          <div style="font-size: 14px; font-weight: 600;">กดผิด · ย้อนแต้มล่าสุด</div>
        </div>
      </div>
    </div>
  </div>
  `);
  fs.writeFileSync("MatchWin.dc.html", s);
}
console.log("built");
