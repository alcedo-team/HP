/* Alcedo サイトのデータ（差し替え前提）。画面の文言はここと index.html に分けて持つ */
window.ALCEDO_DATA = {
  links: {
    instagram: "https://www.instagram.com/alcedo_0510/",
    instagramId: "@alcedo_0510"
  },
  // メールは HTML に平文で書かず、JS で組み立てる
  mail: ["scitechkeio", "gmail.com"],

  // role / note が空文字のときは画面に出さない
  // dot: blue | blue-deep | blue-pale（全員を青系にそろえる。1人だけ別の色にしない）
  members: [
    { name: "荒木田悠和", role: "代表・開発", note: "", dot: "blue", links: [] },
    { name: "橋間友洋", role: "開発", note: "", dot: "blue-deep", links: [] },
    { name: "三角優斗", role: "メイン開発", note: "天体計算と遮蔽判定、23区の広域3Dを担当", dot: "blue", links: [] },
    { name: "糸長優矢", role: "メイン開発", note: "", dot: "blue-deep", links: [] },
    { name: "片平菜々美", role: "デザイン・開発", note: "", dot: "blue", links: [] }
  ],

  journey: [
    { date: "2026.08.01", text: "Alcedo 結成" },
    { date: "2026.08.22–23", text: "都知事杯オープンデータ・ハッカソン 2026 First Stage に参加。東京RPG を6日で実装" },
    { date: "2026.09", text: "ファイナリストに選出（486チーム中24）" },
    { date: "2026.10.17", text: "Final Stage で東京RPG を発表" },
    { date: "2026.10.24–25", text: "JPHACKS 2026 Hack Day（東京B会場）。Astera で Hack Day Audience Award" },
    { date: "2027.03.27", text: "都知事杯 Demo Day（予定）" },
    { date: "次の駅", text: "まだ決まっていない。", next: true }
  ],

  // 作品の数字（values は個別にカウントアップする）
  works: {
    "tokyo-rpg": {
      stats: [
        { values: [486, 24], sep: "→", unit: "", label: "チーム数 → ファイナリスト" },
        { values: [6], unit: "日", label: "First Stage 提出までの実装" },
        { values: [5], unit: "件", label: "使った東京都オープンデータ" }
      ]
    },
    astera: {
      stats: [
        { values: [43], unit: "地点", label: "観測地点" },
        { values: [58], unit: "天体", label: "月・惑星5・明るい恒星52" },
        { values: [180], unit: "件", label: "計算ロジックのテスト" }
      ]
    }
  }
};
