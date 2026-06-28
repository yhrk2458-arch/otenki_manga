# 天気漫画(Weather Manga)

天気と気温によって表示される漫画が変わる、お天気アプリ代替サイトです。
天気データは気象庁(JMA)の防災情報APIを利用しています。

## ファイル構成

```
weather-manga/
├── index.html          # メイン画面
├── style.css           # デザイン
├── script.js           # 気象庁API取得・シナリオ判定ロジック
├── data/
│   └── scenarios.json  # 天気×気温帯ごとのシナリオ一覧(画像パス含む)
└── images/
    └── placeholder.png # 仮画像(漫画ができたら差し替え)
```

## GitHub Pagesでの公開手順

1. GitHubで新しいリポジトリを作成(例:`weather-manga`)
2. このフォルダの中身をすべてアップロード(git push、またはWeb UIからドラッグ&ドロップ)
3. リポジトリの **Settings → Pages** を開く
4. 「Source」を `main` ブランチ、フォルダを `/ (root)` に設定して保存
5. 数分後、`https://(あなたのユーザー名).github.io/weather-manga/` でアクセス可能になります

## 漫画を追加する方法

1. 描いた漫画の画像を `images/` フォルダに入れる(例:`comf_sunny_01.png`)
2. `data/scenarios.json` の対応する項目の `"image"` を、その画像パスに書き換える

```json
{ "id": "comf_sunny_01", "title": "窓を全開にして風を通す", "image": "images/comf_sunny_01.png" }
```

画像が増えるたびにこのJSONを編集するだけで、サイト側のコードは触らずに更新できます。

## 今後の改善候補(未実装)

- **リアルタイム気温の精度向上**:現在は予報APIの最高気温を温度帯判定に使っています。より正確な「現在の気温」を出すには、気象庁のアメダスAPI(`https://www.jma.go.jp/bosai/amedas/data/latest_time_data.json`)との連携が必要です。観測地点コードの対応表は `https://www.jma.go.jp/bosai/amedas/const/amedastable.json` で確認できます。
- **地域リストの拡充**:現在は主要都市6地域のみです。全地域のコードは `https://www.jma.go.jp/bosai/common/const/area.json` で取得できます。
- **同じ話の連続表示を避ける仕組み**:現状は日付ベースのハッシュで「同じ日は同じ話」になる設計です。履歴を記録して「直近で見た話を避ける」ロジックに発展させると、より自然なローテーションになります。

## 注意事項

- 気象庁APIの正確なJSON構造は地域や時間帯によって細部が異なることがあります。実際に動かしてみて、`extractTemperature` や `extractWeather` 関数(`script.js`内)の挙動を確認・調整してください。
- ブラウザの開発者ツール(コンソール)を開いておくと、データ取得エラーの詳細が表示されます。
