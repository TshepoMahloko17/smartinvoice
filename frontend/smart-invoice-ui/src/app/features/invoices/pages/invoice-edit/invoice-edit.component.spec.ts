import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InvoiceEditComponent } from "./invoice-edit.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { MatNativeDateModule } from "@angular/material/core";

describe("InvoiceEditComponent", () => {
  let component: InvoiceEditComponent;
  let fixture: ComponentFixture<InvoiceEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatNativeDateModule,
        RouterTestingModule,
        HttpClientTestingModule,
        InvoiceEditComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => "1" } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
