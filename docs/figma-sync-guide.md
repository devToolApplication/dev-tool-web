---
title: figma-sync-guide
type: note
permalink: dev-tool-web/docs/figma-sync-guide
---

# Figma ↔ Storybook Sync Guide

## Overview

Pipeline 2 chiều giữa Figma và codebase:
- **Figma → Code:** Designer thay đổi tokens trong Figma → push JSON → CI generate CSS → auto-commit
- **Code → Figma:** Storybook deploy lên Chromatic → Figma plugin hiển thị live components

---

## Setup Figma (cho Designer)

### 1. Cài Tokens Studio plugin

1. Mở Figma → Plugins → Search "Tokens Studio"
2. Install plugin
3. Mở plugin trong file design

### 2. Connect Git repo

1. Trong Tokens Studio → Settings → Sync providers → Add new → **GitHub**
2. Điền thông tin:
   - **Repository:** `devToolApplication/dev-tool-web`
   - **Branch:** `master`
   - **Token path:** `tokens/tokens.json`
   - **File type:** `Multiple files`
   - **Personal Access Token:** tạo GitHub PAT với scope `repo`
3. Click "Save" → Pull tokens từ repo

### 3. Workflow cho Designer

1. **Pull** tokens mới nhất từ repo trước khi bắt đầu
2. Sửa token values trong Tokens Studio (colors, spacing, typography, etc.)
3. **Push** changes → tạo commit trực tiếp hoặc tạo branch + PR
4. CI tự động:
   - Build CSS variables từ tokens JSON
   - Commit generated CSS
   - Publish Storybook lên Chromatic
5. Designer thấy kết quả trên Chromatic URL

### 4. Cài Storybook Connect plugin (xem live components)

1. Mở Figma → Plugins → Search "Storybook Connect"
2. Install plugin
3. Mở plugin → Connect to Chromatic project
4. Link Figma components với Storybook stories:
   - Select component trong Figma
   - Trong plugin, search story name
   - Click "Link"
5. Sau khi link: select component → thấy live Storybook story trong Design panel

---

## Setup Code (cho Developer)

### 1. Token build

```bash
# Build tokens thủ công
npm run tokens:build

# Output: src/styles/tokens/generated/_variables.css
```

### 2. Thêm Figma URL vào story (optional)

```ts
export const Default: Story = {
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/YOUR_FILE_ID/Design?node-id=XX:YY'
    }
  }
};
```

### 3. Publish Chromatic

```bash
# Manual publish
npm run publish-storybook

# Cần set CHROMATIC_PROJECT_TOKEN env var
```

---

## Token Structure

```
tokens/
├── global.json      # Primitive values: colors, spacing, typography, radius, shadows
├── semantic.json    # Semantic mappings: primary, surface, feedback, text, content
└── component.json   # Component-level: button, input, badge, card, modal
```

### Naming convention

- **Global:** raw values — `color.indigo.500`, `spacing.4`, `fontSize.sm`
- **Semantic:** purpose-based — `primary.500`, `feedback.success`, `text.default`
- **Component:** component-specific — `button.borderRadius`, `input.focusBorderColor`

### Adding new tokens

1. Thêm vào file JSON phù hợp (global → semantic → component)
2. Dùng references: `{ "value": "{primary.500}", "type": "color" }`
3. Run `npm run tokens:build` để verify
4. Commit cả `tokens/*.json` và `src/styles/tokens/generated/_variables.css`

---

## CI/CD Pipeline

```
tokens/ change → GitHub Actions → Style Dictionary build → commit CSS → Chromatic publish
```

Workflow file: `.github/workflows/tokens-sync.yml`

Secrets cần set trong GitHub repo:
- `CHROMATIC_PROJECT_TOKEN` — lấy từ Chromatic project settings

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tokens Studio không pull được | Kiểm tra PAT có scope `repo`, branch name đúng |
| Build tokens fail | Kiểm tra JSON syntax, references phải match token path |
| Chromatic không publish | Kiểm tra `CHROMATIC_PROJECT_TOKEN` secret |
| Storybook Connect không thấy stories | Đảm bảo Chromatic đã publish thành công |