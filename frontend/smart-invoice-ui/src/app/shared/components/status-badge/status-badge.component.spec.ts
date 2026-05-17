import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StatusBadgeComponent } from "./status-badge.component";
import { InvoiceStatus } from "../../enums/invoice-status.enum";

describe("StatusBadgeComponent", () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  const cases: {
    status: InvoiceStatus;
    expectedClass: string;
    label: string;
  }[] = [
    { status: InvoiceStatus.Paid, expectedClass: "paid", label: "Paid" },
    {
      status: InvoiceStatus.PartiallyPaid,
      expectedClass: "partial-paid",
      label: "Partially Paid",
    },
    {
      status: InvoiceStatus.Pending,
      expectedClass: "pending",
      label: "Pending",
    },
    {
      status: InvoiceStatus.Overdue,
      expectedClass: "overdue",
      label: "Overdue",
    },
    { status: InvoiceStatus.Draft, expectedClass: "draft", label: "Draft" },
    {
      status: InvoiceStatus.Cancelled,
      expectedClass: "draft",
      label: "Cancelled",
    },
  ];

  cases.forEach(({ status, expectedClass, label }) => {
    describe(`status = ${label}`, () => {
      beforeEach(() => {
        component.status = status;
        fixture.detectChanges();
      });

      it(`cssClass returns "${expectedClass}"`, () => {
        expect(component.cssClass).toBe(expectedClass);
      });

      it("renders the label text", () => {
        const el: HTMLElement =
          fixture.nativeElement.querySelector(".status-pill");
        expect(el?.textContent?.trim()).toBe(label);
      });
    });
  });

  it("PartiallyPaid renders the partial-paid CSS class on the span", () => {
    component.status = InvoiceStatus.PartiallyPaid;
    fixture.detectChanges();
    const span: HTMLElement =
      fixture.nativeElement.querySelector(".status-pill");
    expect(span.classList.contains("partial-paid")).toBe(true);
  });
});
