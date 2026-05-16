# CLAUDE.md

このファイルはリポジトリ内で作業する Claude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

ピクロス（ノノグラム）パズルをアルゴリズムが自動で解いていく様子を、ユーザーがリアルタイムで眺めるためのアプリケーションです。

[仕様書](./docs/SPEC.md)

## コマンド

パッケージマネージャーは `pnpm` を使用する。

```bash
pnpm install        # 依存関係のインストール
pnpm dev            # 開発サーバー起動
pnpm build          # 本番ビルド
pnpm lint           # lint実行
pnpm lint:fix       # lintの自動修正実行
pnpm format         # フォーマッタ実行
pnpm typecheck      # 型チェック実行
pnpm test           # テスト実行
```
