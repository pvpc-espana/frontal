import { Directive, ElementRef, inject, output } from '@angular/core';

const UMBRAL_PX = 60;
const UMBRAL_VELOCIDAD = 0.35; // px/ms
const ARRANQUE_PX = 10;

/**
 * Detecta deslizamientos horizontales con Pointer Events sin bloquear el scroll vertical.
 * Mientras se arrastra expone la distancia en la variable CSS `--arrastre`.
 */
@Directive({
  selector: '[appDeslizar]',
  host: {
    style: 'touch-action: pan-y',
    '(pointerdown)': 'empezar($event)',
    '(pointermove)': 'mover($event)',
    '(pointerup)': 'terminar($event)',
    '(pointercancel)': 'cancelar()',
  },
})
export class DeslizarDirective {
  /** Dedo hacia la izquierda: día siguiente. */
  readonly izquierda = output<void>();
  /** Dedo hacia la derecha: día anterior. */
  readonly derecha = output<void>();

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private origen?: { x: number; y: number; t: number; id: number };
  private horizontal = false;

  empezar(e: PointerEvent): void {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    this.origen = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
    this.horizontal = false;
  }

  mover(e: PointerEvent): void {
    if (!this.origen || e.pointerId !== this.origen.id) return;
    const dx = e.clientX - this.origen.x;
    const dy = e.clientY - this.origen.y;
    if (!this.horizontal) {
      if (Math.abs(dy) > ARRANQUE_PX && Math.abs(dy) > Math.abs(dx)) return this.cancelar();
      if (Math.abs(dx) < ARRANQUE_PX) return;
      this.horizontal = true;
      this.elemento.setPointerCapture(e.pointerId);
      this.elemento.classList.add('arrastrando');
    }
    this.elemento.style.setProperty('--arrastre', `${dx * 0.6}px`);
  }

  terminar(e: PointerEvent): void {
    if (!this.origen || !this.horizontal) return this.cancelar();
    const dx = e.clientX - this.origen.x;
    const velocidad = Math.abs(dx) / Math.max(1, e.timeStamp - this.origen.t);
    this.cancelar();
    if (Math.abs(dx) > UMBRAL_PX || (Math.abs(dx) > 25 && velocidad > UMBRAL_VELOCIDAD)) {
      if (dx < 0) this.izquierda.emit();
      else this.derecha.emit();
    }
  }

  cancelar(): void {
    this.origen = undefined;
    this.horizontal = false;
    this.elemento.classList.remove('arrastrando');
    this.elemento.style.removeProperty('--arrastre');
  }
}
