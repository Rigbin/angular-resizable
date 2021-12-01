import { Component, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FlexContainerComponent } from '../flex-container/flex-container.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  @ViewChildren(FlexContainerComponent) private childs!: QueryList<FlexContainerComponent>;
  private innerWidth: number = 0;

  constructor() { }

  private parseNum(value: string, fallback = 1): number {
    return +(/(\d{1,3})%?/.exec(value)?.[1] || fallback);
  }

  private direction(element: HTMLElement): 'vertical' | 'horizontal' {
    return /vertical|horizontal/i.exec(element.getAttribute('data-direction') || '')?.[0] as 'vertical' | 'horizontal' || 'horizontal';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    const previousWidth = this.innerWidth;
    this.innerWidth = (event.target as Window).innerWidth;
    Object.keys(breakpoints).forEach(bpt => {
      if ((previousWidth < breakpoints[bpt] && this.innerWidth >= breakpoints[bpt])
        || (previousWidth >= breakpoints[bpt] && this.innerWidth < breakpoints[bpt])) {
        return this.childs['_results'].forEach((child: FlexContainerComponent) => {
          child.switch(bpt);
        });
      }
    });
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
  }

  public resize($event: MouseEvent): void {
    // https://htmldom.dev/create-resizable-split-views/
    let x = $event.clientX;
    let y = $event.clientY;

    const resizer = $event.target as HTMLElement;
    const prevSibling = resizer.previousElementSibling as HTMLElement;
    const nextSibling = resizer.nextElementSibling as HTMLElement;
    const direction = this.direction(resizer);
    const m = measurements[direction];
    const vm = viewMeasures[direction];

    const prevMin = this.parseNum(getComputedStyle(prevSibling).getPropertyValue(`min-${m}`));
    const nextMin = this.parseNum(getComputedStyle(nextSibling).getPropertyValue(`min-${m}`));

    const prevValue = prevSibling?.getBoundingClientRect()[m];

    console.log(direction, m, prevMin, nextMin, prevValue);
    console.log(resizer.dataset['size']);

    const oldAfter = getComputedStyle(resizer).getPropertyValue(dividerVars.after);
    const oldLt = getComputedStyle(resizer).getPropertyValue(dividerVars.lt)
    resizer.style.setProperty(dividerVars.after, `100${vm}`);
    resizer.style.setProperty(dividerVars.lt, `-50${vm}`);

    const oldCursor = document.body.style.cursor;
    document.body.style.cursor = resizer.style.cursor;

    const mouseMoveHandler = (e: MouseEvent) => {
      const pos: { [key: string]: number } = {
        height: e.clientY - y,
        width: e.clientX - x,
      }

      const newVal = (prevValue + pos[m]) * 100 / (resizer.parentNode! as Element).getBoundingClientRect()[m];
      if (newVal > prevMin && newVal < (100 - nextMin)) {
        prevSibling.style[m] = `${newVal}%`;
        nextSibling.style[m] = `${100 - newVal}%`;
      }
    }
    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.body.style.cursor = oldCursor;
      resizer.style.setProperty(dividerVars.after, oldAfter);
      resizer.style.setProperty(dividerVars.lt, oldLt);
    }

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  public getDirection(breakpoint: BootstrapBreakPoint = 'lg'): string {
    return this.innerWidth >= breakpoints[breakpoint] ? 'horizontal' : 'vertical';
  }
}

type BootstrapBreakPoint = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface StringNumber { [key: string]: number }

interface BootstrapBreakPoints extends StringNumber {
  'sm': number;
  'md': number;
  'lg': number;
  'xl': number;
  'xxl': number;
}

const breakpoints: BootstrapBreakPoints = {
  'sm': 576,
  'md': 768,
  'lg': 992,
  'xl': 1200,
  'xxl': 1400,
};

const measurements: { [key: string]: 'height' | 'width' } = {
  vertical: 'height',
  horizontal: 'width',
};
const viewMeasures: { [key: string]: 'vh' | 'vw' } = {
  vertical: 'vh',
  horizontal: 'vw',
};

const dividerVars = {
  size: '--divider-size',
  after: '--divider-after',
  lt: '--divider-lt',
};
