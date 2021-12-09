import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ContextMenuClick, ContextMenuItem } from './context-menu.model';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {
  @Input() contextMenuItems!: Array<ContextMenuItem>;

  @Output() onContextMenuItemClick: EventEmitter<ContextMenuClick> = new EventEmitter<ContextMenuClick>();

  constructor() { }

  ngOnInit(): void {
  }

  onContextMenuClick(event: Event, data: ContextMenuItem) {
    this.onContextMenuItemClick.emit({
      event,
      data
    });
  }

}
