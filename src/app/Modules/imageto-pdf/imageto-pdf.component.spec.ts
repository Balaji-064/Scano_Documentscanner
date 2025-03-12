import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagetoPdfComponent } from './imageto-pdf.component';

describe('ImagetoPdfComponent', () => {
  let component: ImagetoPdfComponent;
  let fixture: ComponentFixture<ImagetoPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagetoPdfComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImagetoPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
