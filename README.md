# Dev Tool Web

Tai lieu nay dung de thong nhat cach to chuc feature, form, list va service trong FE. Khi them man hinh moi, can bam theo README nay thay vi tu dat structure rieng.

## Muc tieu

- Structure phai de doc, giong menu business.
- Feature moi phai dung lai base component hien co, khong viet form/list rieng neu khong can.
- Service, model, route va constant phai nam dung cho de AI agent hoac dev khac vao la lam tiep duoc ngay.
- Khong giai quyet double request bang flag tam thoi trong tung man. Neu loi o base component thi sua o base component.

## Tong quan structure

Code chinh nam trong `src/app`:

```text
src/app
|-- app.routes.ts
|-- core
|   |-- constants
|   |-- models
|   |-- services
|   `-- ui-services
|-- features
|   `-- admin
|       |-- file-storage
|       |-- mcp-server
|       |-- system-management
|       `-- trade-bot
`-- shared
    |-- component
    |-- layout
    `-- ui
```

## Rule structure bat buoc

### 1. Feature phai giong menu

Folder trong `features` phai map theo menu business, khong map theo technical type.

Vi du menu:

```text
Admin
- Quan ly he thong
  - Khoa bi mat
    - He thong luu tru
  - Cau hinh chung
    - Trade Bot MCRS
- Quan ly MCP server
  - Category
  - Tool
```

Structure dung:

```text
features/admin
|-- system-management
|   |-- secret
|   |   |-- storage
|   |   |   |-- form
|   |   |   |-- list
|   |   |   `-- storage-secret.constants.ts
|   |   `-- ai-agent
|   `-- config
|       |-- storage
|       |-- ai-agent
|       `-- trade-bot
`-- mcp-server
    |-- category
    `-- tool
```

Structure sai:

- `features/storage-secret`
- `features/mcp-tool-config`
- `features/admin-crud`
- gop nhieu module khong lien quan vao chung 1 folder

### 2. Moi node business co folder rieng cho man hinh

Trong 1 feature con, toi thieu phai co:

```text
<feature>
|-- form
|   |-- <name>-form.component.ts
|   |-- <name>-form.component.html
|   `-- <name>-form.component.css
|-- list
|   |-- <name>-list.component.ts
|   |-- <name>-list.component.html
|   `-- <name>-list.component.css
`-- <name>.constants.ts
```

Neu co view rieng:

```text
|-- view
|   |-- <name>-view.component.ts
|   `-- ...
```

Khong dat `list` va `form` chung 1 folder ngang hang voi file khac neu no thuoc cung 1 business node.

### 3. Route va component cua feature phai khai bao ngay trong feature

Moi feature cap nhom phai co file `*.feature.ts` de export:

- danh sach component de import vao `SharedModule`
- route de import vao `app.routes.ts`

Vi du dang dung:

- [system-management.feature.ts](./src/app/features/admin/system-management/system-management.feature.ts)
- [file-storage.feature.ts](./src/app/features/admin/file-storage/file-storage.feature.ts)
- [mcp-server.feature.ts](./src/app/features/admin/mcp-server/mcp-server.feature.ts)
- [trade-bot.feature.ts](./src/app/features/admin/trade-bot/trade-bot.feature.ts)

Pattern:

```ts
export const SAMPLE_FEATURE_COMPONENTS = [
  SampleListComponent,
  SampleFormComponent
];

export const sampleRoutes: Routes = [
  {
    path: 'admin/sample',
    children: [
      { path: '', component: SampleListComponent },
      { path: 'create', component: SampleFormComponent },
      { path: 'edit/:id', component: SampleFormComponent }
    ]
  }
];
```

### 4. Service chia theo microservice

Service khong dat trong feature. Tat ca dat trong `core/services` va chia theo microservice.

Structure dung:

```text
core/services
|-- file-service
|   |-- upload-storage.service.ts
|   |-- storage-secret.service.ts
|   `-- storage-config.service.ts
|-- ai-agent-service
|   |-- ai-agent-secret.service.ts
|   |-- ai-agent-config.service.ts
|   |-- mcp-category.service.ts
|   `-- mcp-tool.service.ts
`-- trade-bot-service
    |-- sync-config.service.ts
    `-- config.service.ts
```

Rule:

- Moi controller ben BE tuong ung 1 file service FE.
- Khong gop nhieu controller vao 1 service chung.
- Service phai theo convention cua `UploadStorageService`.

### 5. Model dat trong core/models theo domain

Model khong dat trong feature.

Structure dung:

```text
core/models
|-- file-storage
|   |-- upload-storage.model.ts
|   |-- storage-secret.model.ts
|   `-- storage-config.model.ts
|-- ai-agent
|   |-- ai-agent-secret.model.ts
|   `-- ai-agent-config.model.ts
|-- mcp-server
|   `-- mcp-tool.model.ts
`-- trade-bot
    |-- sync-config.model.ts
    `-- config.model.ts
```

Rule:

- Dung class/type DTO ro rang.
- Khong dung `Omit<...>` de tao payload create/update.
- DTO create/update/response phai viet thang ra ro.

### 6. Constant tach rieng

Moi feature phai co file `*.constants.ts` chua:

- route constant
- initial value
- cac option local cua feature neu thuc su thuoc feature do

Constant he thong dat tai:

- `src/app/core/constants/system.constants.ts`

Khong hardcode route string lap lai nhieu noi trong component.

## Cach lam 1 man list

List phai dung `app-table`.

### Checklist bat buoc

- Dinh nghia `tableConfig: TableConfig`
- Neu co search/filter thi khai bao `filters` va `filterOptions.primaryField`
- Co `rows`, `loading`, `filters`
- Neu list co `filters`, khong goi `loadPage()` trong `ngOnInit()` vi `app-table-filter` se tu emit search luc khoi tao
- Neu list khong co `filters`, `ngOnInit()` moi duoc goi `loadPage()`
- `loadPage()` goi service `getPage(page, size, sort, filters)`
- HTML phai bind `(search)` va `(resetFilter)`

### Mau list

```ts
export class SampleListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Sample',
    filters: [
      { field: 'key', label: 'Key', placeholder: 'Search key' },
      { field: 'category', label: 'Category', placeholder: 'Search category' }
    ],
    filterOptions: { primaryField: 'key' },
    toolbar: {
      new: { visible: true, label: 'New', icon: 'pi pi-plus', severity: 'success' }
    },
    columns: [
      { field: 'category', header: 'Category', sortable: true },
      { field: 'key', header: 'Key', sortable: true }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  rows: SampleResponse[] = [];
  loading = false;
  filters: Record<string, any> = {};

  ngOnInit(): void {}

  onSearch(filters: Record<string, any>): void {
    this.filters = filters;
    this.loadPage();
  }

  onResetFilter(): void {
    this.filters = {};
    this.loadPage();
  }
}
```

HTML:

```html
<app-table
  [config]="tableConfig"
  [data]="rows"
  [loading]="loading"
  (search)="onSearch($event)"
  (resetFilter)="onResetFilter()"
  (create)="onCreate()"
></app-table>
```

### Rule cho filter list

- Ngoai man hinh chi co 1 o text search theo `primaryField`.
- Filter nang cao hien thi trong drawer.
- Search payload phai map dung field BE ho tro.
- Khong duoc vua `loadPage()` trong `ngOnInit()` vua nghe `(search)` tren cung 1 list co filter, neu khong se bi request 2 lan luc vao man.

Vi du tham khao:

- [upload-storage-list.component.ts](./src/app/features/admin/file-storage/storage/list/upload-storage-list.component.ts)
- [storage-config-list.component.ts](./src/app/features/admin/system-management/config/storage/list/storage-config-list.component.ts)

## Cach lam 1 man form

Form phai dung `app-form-input`.

### Checklist bat buoc

- Dinh nghia `formConfig: FormConfig`
- Validation required phai dung `Rules.required(...)`
- Rule chung phai dung `Rules.*(...)`
- `formInitialValue` phai dung constant
- `create` va `edit` dung chung 1 component
- `ngOnInit()` bind route mode
- `onSubmitForm(model)` truyen model thang vao service, khong parse payload lai neu khong can
- Neu can custom editor ngoai config thi chen qua `ng-content` cua `app-form-input`

### Mau form

```ts
export class SampleFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };

  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'category', label: 'Category', width: '1/2', validation: [Rules.required('Category is required')] },
      { type: 'text', name: 'key', label: 'Key', width: '1/2', validation: [Rules.required('Key is required')] },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' }
    ]
  };

  formInitialValue: SampleCreateDto = { ...SAMPLE_INITIAL_VALUE };
}
```

HTML:

```html
<app-form-input
  [config]="formConfig"
  [context]="formContext"
  [initialValue]="formInitialValue"
  (formSubmit)="onSubmitForm($event)"
></app-form-input>
```

### Rule cho form

- Khong tu viet form HTML thu cong neu `app-form-input` da cover duoc.
- Khong dung `required: true` thay cho `Rules.required(...)`.
- Khong tao payload bang tay neu DTO submit da trung model form.
- Khong fix double request bang `submitting` flag trong tung form. Neu bi goi doi, phai sua flow event o base component.
- Khi can goi API phu theo user input, chi bind `(valueChange)` neu thuc su can. Hien tai base form da duoc sua de khong emit nhung thay doi synthetic luc init/reset.

Vi du tham khao:

- [storage-secret-form.component.ts](./src/app/features/admin/system-management/secret/storage/form/storage-secret-form.component.ts)
- [mcp-tool-form.component.ts](./src/app/features/admin/mcp-server/tool/form/mcp-tool-form.component.ts)
- [upload-storage-form.component.html](./src/app/features/admin/file-storage/storage/form/upload-storage-form.component.html)

## Convention cho service

Service FE phai theo pattern nay:

```ts
@Injectable({ providedIn: 'root' })
export class SampleService {
  private readonly apiUrl = `${environment.apiUrl.someMs}/samples`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<SampleResponse[]> {}

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['category,asc', 'key,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<SampleResponse>> {}

  getById(id: string): Observable<SampleResponse> {}
  create(payload: SampleCreateDto): Observable<SampleResponse> {}
  update(id: string, payload: SampleUpdateDto): Observable<SampleResponse> {}
  delete(id: string): Observable<SampleResponse> {}
}
```

Rule:

- `getPage()` nhan `filters`
- map `BaseResponse` ve `data`
- sap xep default phai ro rang
- ten API url phai map dung controller BE

## Convention cho route

Tat ca route feature admin theo pattern:

```text
admin/<group>/<node>
admin/<group>/<node>/create
admin/<group>/<node>/edit/:id
```

Vi du:

- `admin/system-management/storage-secrets`
- `admin/system-management/storage-configs`
- `admin/system-management/trade-bot-configs`
- `admin/mcp-tool-config/tool`

Neu doi menu business, phai doi ca:

1. folder feature
2. `*.feature.ts`
3. menu config
4. route constant

## Convention cho SharedModule va AppRoutes

Khi them feature moi:

1. Export component list trong file `*.feature.ts`
2. Import mang component do vao `SharedModule`
3. Export route array trong file `*.feature.ts`
4. Import route array vao `app.routes.ts`

Tham khao:

- [shared.module.ts](./src/app/shared/shared.module.ts)
- [app.routes.ts](./src/app/app.routes.ts)

## Checklist khi tao feature moi

1. Xac dinh menu business va tao folder dung theo menu.
2. Tao `list/`, `form/`, neu can thi `view/`.
3. Tao `*.constants.ts`.
4. Tao model trong `core/models/<domain>`.
5. Tao service trong `core/services/<microservice>`.
6. Tao `*.feature.ts` de export routes va components.
7. Noi `SharedModule` va `app.routes.ts`.
8. Dung `app-table` cho list.
9. Dung `app-form-input` cho form.
10. Build lai truoc khi chot.

## Checklist review truoc khi merge

- Folder co giong menu khong
- Cac label da co translate key tuong ung chua
- Service co nam trong `core/services` dung microservice khong
- Model co nam trong `core/models` dung domain khong
- Constant da tach rieng chua
- Form co dung `Rules.required(...)` khong
- Form submit co truyen model thang khong
- List co dung `filters` + `primaryField` khong
- List co tranh double request luc init khong
- HTML list da bind `(search)` va `(resetFilter)` chua
- `npm run build` co pass khong

## Lenh can chay truoc khi chot

```powershell
$env:Path = 'C:\\Program Files\\nodejs;' + $env:Path
& 'C:\\Program Files\\nodejs\\npm.cmd' run build
```

Neu build fail, khong duoc chot.
