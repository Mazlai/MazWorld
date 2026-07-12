import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BadgeComponent } from './badge.component';

@Component({
  standalone: true,
  imports: [BadgeComponent],
  template: `<app-badge [variant]="variant">{{ content }}</app-badge>`,
})
class TestHostComponent {
  variant: 'accent' | 'gold' | 'success' | 'danger' | 'info' = 'accent';
  content = 'Vérifié';
}

function setup(variant?: 'accent' | 'gold' | 'success' | 'danger' | 'info'): ComponentFixture<BadgeComponent> {
  TestBed.configureTestingModule({ imports: [BadgeComponent] });
  const fixture = TestBed.createComponent(BadgeComponent);
  if (variant !== undefined) fixture.componentRef.setInput('variant', variant);
  fixture.detectChanges();
  return fixture;
}

describe('BadgeComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('se crée sans erreur', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('applique la classe badge--accent par défaut', () => {
    const fixture = setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.badge--accent')).toBeTruthy();
  });

  it('applique badge--gold quand variant="gold"', () => {
    const fixture = setup('gold');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.badge--gold')).toBeTruthy();
  });

  it('applique badge--success quand variant="success"', () => {
    const fixture = setup('success');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.badge--success')).toBeTruthy();
  });

  it('applique badge--danger quand variant="danger"', () => {
    const fixture = setup('danger');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.badge--danger')).toBeTruthy();
  });

  it('applique badge--info quand variant="info"', () => {
    const fixture = setup('info');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.badge--info')).toBeTruthy();
  });
});