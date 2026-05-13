# config-history

Config history là query/audit view; không mutate config trực tiếp từ history.

## Source Ownership

- Page/container: feature pages hoặc feature folder tương ứng.
- API/model: data-access/api, data-access/models.
- Store/state: state.
- Reusable trading UI: 	rade-bot-management/shared-trading.

## Checklist

- Feature owns business code.
- UI uses shared layer and translate.
- API contract typed.
- Loading/error/empty states covered.

