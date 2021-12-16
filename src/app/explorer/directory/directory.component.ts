import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ContextMenuClick } from '../../context-menu/context-menu.model';
import { HasContextMenuComponent } from '../../context-menu/has-context-menu.component';
import { OpenTabsService } from '../../editor/tab-container/open-tabs.service';
import { EditorFile, FileService } from '../../file/file.service';
import { AddFileComponent } from '../add-file/add-file.component';
import { AddFileDirective } from '../add-file/add-file.directive';
import { AddFileType } from '../add-file/add-file.model';
import { CurrentSelectedService } from './current-selected.service';

export interface ExplorerFile extends EditorFile {
  children?: ExplorerFile[];
  edit?: boolean;
}

@Component({
  selector: 'explorer-directory',
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.scss'],
})
export class DirectoryComponent extends HasContextMenuComponent<EditorFile> implements OnInit {
  private static BASE_PADDING = 8;
  private static ADD_PADDING = 22;

  @ViewChild(AddFileDirective, { static: true }) addFile!: AddFileDirective;

  @ViewChild('add', { static: true }) addRef!: ElementRef;
  @Input() root: boolean = false;
  @Input() depth: number = 0;
  @Input() collapse?: boolean = false;
  @Input() parent: ExplorerFile = { name: '/', children: [], type: 'directory' };
  @Output() onFilesUpdate: EventEmitter<EditorFile[]> = new EventEmitter<EditorFile[]>();

  protected contextMenuItems = [
    {
      text: 'loeschen',
      event: 'delete',
    },
    {
      text: 'umbenennen',
      event: 'rename',
    },
    {
      text: 'neue datei',
      event: 'new-file',
    },
    {
      text: 'neuer ordner',
      event: 'new-dir',
    },
  ];
  private tmpName?: string;
  private activeFile?: EditorFile;

  constructor(
    private fileService: FileService,
    private openTabsService: OpenTabsService,
    private currentSelectedService: CurrentSelectedService,
  ) { super(); }

  @ViewChild('editRef', { read: ElementRef }) set editRef(ref: ElementRef) {
    ref?.nativeElement?.focus();
  }

  private static enableEdit(child: ExplorerFile): void {
    child.edit = true;
  }

  ngOnInit(): void {
    this.currentSelectedService.currentSelected$(
      value => this.activeFile = value,
      err => console.error(err),
    );
  }

  isDirectory(file: EditorFile): boolean {
    return file.type === 'directory';
  }

  clicked($event: MouseEvent, child: EditorFile): void {
    $event.stopPropagation();
    if (this.isDirectory(child) && this.isActive(child)) {
      this.toggleDirectoryIsOpen(child);
    } else if (!this.isDirectory(child)) {
      this.fileService.select(child, this.parent);
      this.openTabsService.select(child);
    }
    this.currentSelectedService.currentSelected = child;
  }

  toggle($event: MouseEvent, child: EditorFile): void {
    $event.stopPropagation();
    this.toggleDirectoryIsOpen(child);
  }

  isActive(child: EditorFile): boolean {
    return this.activeFile === child && child !== this.parent;
  }

  edit($event: MouseEvent, child: ExplorerFile): void {
    $event.stopPropagation();
    DirectoryComponent.enableEdit(child);
  }

  delete($event: MouseEvent, child: EditorFile): void {
    $event.stopPropagation();
    if (window.confirm(`will you ${child.name} delete?`)) {
      this.deleteChild(child);
    }
  }

  exitEdit($event: KeyboardEvent, child: ExplorerFile): void {
    switch ($event.key) {
      case 'Escape':
        child.edit = undefined;
        break;
      case 'Enter':
        child.name = this.tmpName || child.name;
        this.tmpName = undefined;
        child.edit = undefined;
        break;
      default:
        break;
    }
  }

  updateFileName(fileName: string): void {
    this.tmpName = fileName;
  }

  @HostListener('document:mousedown')
  closeEditForAllChild(): void {
    this.parent.children?.forEach(child => {
      child.edit = undefined;
    });
  }

  paddingLeft(): string {
    return `${this.depth * DirectoryComponent.ADD_PADDING + DirectoryComponent.BASE_PADDING}px !important`;
  }

  protected onContextMenuItemClick($event: ContextMenuClick, data: ExplorerFile): void {
    switch ($event.data.event) {
      case 'rename':
        DirectoryComponent.enableEdit(data);
        break;
      case 'delete':
        this.deleteChild(data);
        this.parent.children = this.parent.children?.filter(file => file !== data);
        break;
      case 'new-file':
        this.add($event.target?.closest('li'));
        break;
      case 'new-dir':
        this.add($event.target?.closest('li'), 'directory');
        break;
      default:
        console.warn(`unknown event [${$event.data.event}]`);
    }
  }

  private toggleDirectoryIsOpen(child: EditorFile): void {
    if (this.isDirectory(child)) {
      child.isOpen = !child.isOpen;
    }
  }

  private deleteChild(child: EditorFile): void {
    this.parent.children = this.parent.children?.filter(file => file !== child);
    this.openTabsService.remove(child);
  }

  private add(sibling?: HTMLElement | null, type: AddFileType = 'file'): void {
    if (!sibling) { return; }
    const siblingType = sibling.dataset['type'] || 'file';
    const siblingName = sibling.dataset['name'];
    const viewContainerRef = this.addFile.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent<AddFileComponent>(AddFileComponent);
    componentRef.instance.type = type;
    componentRef.instance.paddingLeft = this.paddingLeft();

    componentRef.instance.onAddFileAbort.subscribe(() => {
      viewContainerRef?.clear();
    });
    componentRef.instance.onAddFileSave.subscribe((file: EditorFile) => {
      const dir = (siblingType === 'file') ? this.parent.children : this.parent.children?.find(child => child.name === siblingName)?.children;
      console.log(dir);
      if (dir?.find(child => child.name === file.name)) {
        alert(`${file.name} already exists`);
        componentRef?.instance.inputRef.nativeElement.focus();
        return;
      }
      viewContainerRef?.clear();
      if (siblingType === 'file') {
        this.parent.children?.push(file);
        this.openTabsService.select(file);
      } else {
        this.parent.children?.forEach(child => {
          if (child.name === siblingName) { child.children?.push(file);}
        });
      }
      this.currentSelectedService.currentSelected = file;
    });
    sibling.parentElement?.appendChild(componentRef.location.nativeElement);
  }
}
