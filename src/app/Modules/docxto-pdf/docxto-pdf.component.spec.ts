import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocxtoPdfComponent } from './docxto-pdf.component';

describe('DocxtoPdfComponent', () => {
  let component: DocxtoPdfComponent;
  let fixture: ComponentFixture<DocxtoPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocxtoPdfComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocxtoPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
