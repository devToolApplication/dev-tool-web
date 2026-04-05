import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { BaseInput } from '../base-input';

type CodeMirrorModules = {
  EditorState: typeof import('@codemirror/state').EditorState;
  EditorView: typeof import('@codemirror/view').EditorView;
  basicSetup: typeof import('codemirror').basicSetup;
  json: typeof import('@codemirror/lang-json').json;
};

type JsonEditorInstance = {
  destroy(): void;
  getValue(): string;
  setValue(text: string): void;
};

@Component({
  selector: 'app-input-area',
  standalone: false,
  templateUrl: './input-area.html',
  styleUrl: './input-area.css'
})
export class InputArea extends BaseInput<string> implements AfterViewInit, OnChanges, OnDestroy {
  @Input() rows = 5;
  @Input() maxRows = 5;
  @Input() showZoomButton = false;
  @Input() contentType: 'text' | 'json' = 'text';

  zoomVisible = false;
  @ViewChild('inlineJsonHost') inlineJsonHost?: ElementRef<HTMLDivElement>;
  @ViewChild('dialogJsonContainer') dialogJsonContainer?: ElementRef<HTMLDivElement>;

  private inlineJsonEditor?: JsonEditorInstance;
  private dialogJsonEditor?: JsonEditorInstance;
  private syncingEditors = false;

  constructor() {
    super();
  }

  ngAfterViewInit(): void {
    this.initializeInlineJsonEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contentType'] && !changes['contentType'].firstChange) {
      this.destroyInlineJsonEditor();
      this.destroyDialogJsonEditor();
      queueMicrotask(() => this.initializeInlineJsonEditor());
      return;
    }

    if ((changes['disabled'] || changes['readonly']) && this.contentType === 'json') {
      const reopenDialog = this.zoomVisible;
      this.destroyInlineJsonEditor();
      this.destroyDialogJsonEditor();
      queueMicrotask(() => {
        this.initializeInlineJsonEditor();
        if (reopenDialog) {
          this.initializeDialogJsonEditor();
        }
      });
      return;
    }

    if (changes['value'] && !this.syncingEditors) {
      this.syncEditorsFromValue();
    }
  }

  override onChange(value: string | null): void {
    super.onChange(value);
    if (!this.syncingEditors) {
      this.syncEditorsFromValue();
    }
  }

  openZoom(): void {
    if (this.disabled) {
      return;
    }
    this.zoomVisible = true;
    queueMicrotask(() => this.initializeDialogJsonEditor());
  }

  closeZoom(): void {
    this.zoomVisible = false;
    this.destroyDialogJsonEditor();
  }

  get inlineTextMaxHeight(): string | null {
    if (this.maxRows <= 0) {
      return null;
    }
    return `calc(${this.maxRows} * 1lh + 1.25rem)`;
  }

  get inlineJsonHeight(): string | null {
    if (this.maxRows <= 0) {
      return null;
    }
    return `calc(${this.maxRows} * 1lh + 2rem)`;
  }

  ngOnDestroy(): void {
    this.destroyInlineJsonEditor();
    this.destroyDialogJsonEditor();
  }

  private async initializeInlineJsonEditor(): Promise<void> {
    if (this.contentType !== 'json' || !this.inlineJsonHost?.nativeElement || this.inlineJsonEditor) {
      return;
    }
    this.inlineJsonEditor = await this.createJsonEditor(this.inlineJsonHost.nativeElement, false);
    this.setEditorValue(this.inlineJsonEditor, this.value ?? '');
  }

  private async initializeDialogJsonEditor(): Promise<void> {
    if (this.contentType !== 'json' || !this.zoomVisible || !this.dialogJsonContainer?.nativeElement || this.dialogJsonEditor) {
      return;
    }
    this.dialogJsonEditor = await this.createJsonEditor(this.dialogJsonContainer.nativeElement, true);
    this.setEditorValue(this.dialogJsonEditor, this.value ?? '');
  }

  private async createJsonEditor(container: HTMLDivElement, expanded: boolean): Promise<JsonEditorInstance> {
    const { EditorState, EditorView, basicSetup, json } = await this.loadCodeMirrorModules();
    const editable = !this.disabled && !this.readonly;

    container.replaceChildren();

    const view = new EditorView({
      state: EditorState.create({
        doc: this.value ?? '',
        extensions: [
          basicSetup,
          json(),
          EditorView.lineWrapping,
          EditorState.readOnly.of(!editable),
          EditorView.editable.of(editable),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }
            this.onJsonTextChange(update.state.doc.toString(), expanded);
          }),
          EditorView.theme({
            '&': {
              height: '100%'
            }
          })
        ]
      }),
      parent: container
    });

    return {
      destroy: () => view.destroy(),
      getValue: () => view.state.doc.toString(),
      setValue: (text: string) => {
        if (view.state.doc.toString() === text) {
          return;
        }
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: text
          }
        });
      }
    };
  }

  private onJsonTextChange(text: string, expanded: boolean): void {
    if (this.syncingEditors) {
      return;
    }

    this.syncingEditors = true;
    try {
      this.value = text;
      this.valueChange.emit(text);

      if (expanded) {
        this.setEditorValue(this.inlineJsonEditor, text);
      } else {
        this.setEditorValue(this.dialogJsonEditor, text);
      }
    } finally {
      this.syncingEditors = false;
    }
  }

  private syncEditorsFromValue(): void {
    const text = this.value ?? '';
    this.syncingEditors = true;
    try {
      this.setEditorValue(this.inlineJsonEditor, text);
      this.setEditorValue(this.dialogJsonEditor, text);
    } finally {
      this.syncingEditors = false;
    }
  }

  private setEditorValue(editor: JsonEditorInstance | undefined, text: string): void {
    if (!editor) {
      return;
    }
    editor.setValue(text || '');
  }

  private destroyInlineJsonEditor(): void {
    this.inlineJsonEditor?.destroy();
    this.inlineJsonEditor = undefined;
  }

  private destroyDialogJsonEditor(): void {
    this.dialogJsonEditor?.destroy();
    this.dialogJsonEditor = undefined;
  }

  private async loadCodeMirrorModules(): Promise<CodeMirrorModules> {
    const [stateModule, viewModule, codeMirrorModule, jsonModule] = await Promise.all([
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('codemirror'),
      import('@codemirror/lang-json')
    ]);

    return {
      EditorState: stateModule.EditorState,
      EditorView: viewModule.EditorView,
      basicSetup: codeMirrorModule.basicSetup,
      json: jsonModule.json
    };
  }
}
