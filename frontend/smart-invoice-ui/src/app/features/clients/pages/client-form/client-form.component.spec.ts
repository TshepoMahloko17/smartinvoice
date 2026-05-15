import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ClientFormComponent } from "./client-form.component";
import { ClientService } from "../../services/client.service";
import { Client } from "../../../../shared/models/client.model";

const mockClient: Client = {
  id: "client-1",
  name: "Acme Corp",
  email: "acme@example.com",
  totalInvoices: 0,
  totalRevenue: 0,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("ClientFormComponent", () => {
  let fixture: ComponentFixture<ClientFormComponent>;
  let component: ClientFormComponent;
  let svc: { create: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    svc = { create: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClientFormComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: ClientService, useValue: svc }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("form is invalid when empty", () => {
    expect(component.form.invalid).toBe(true);
  });

  it("name field is required", () => {
    component.form.patchValue({ name: "" });
    expect(component.form.get("name")!.hasError("required")).toBe(true);
  });

  it("email field validates format", () => {
    component.form.patchValue({ name: "Acme", email: "not-an-email" });
    expect(component.form.get("email")!.hasError("email")).toBe(true);
  });

  it("form is valid with name and valid email", () => {
    component.form.setValue({
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "",
      companyName: "",
    });
    expect(component.form.valid).toBe(true);
  });

  it("submit does nothing when form is invalid", () => {
    component.submit();
    expect(svc.create).not.toHaveBeenCalled();
  });

  it("submit calls svc.create with form values", () => {
    svc.create.mockReturnValue(of(mockClient));
    component.form.setValue({
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "0821234567",
      companyName: "Acme Inc.",
    });
    component.submit();
    expect(svc.create).toHaveBeenCalledWith({
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "0821234567",
      companyName: "Acme Inc.",
    });
  });

  it("navigates to client detail on successful create", async () => {
    svc.create.mockReturnValue(of(mockClient));
    const navigateSpy = jest.spyOn(router, "navigate").mockResolvedValue(true);
    component.form.setValue({
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "",
      companyName: "",
    });
    component.submit();
    expect(navigateSpy).toHaveBeenCalledWith(["/clients", "client-1"]);
  });

  it("clears saving flag and does not navigate on error", () => {
    svc.create.mockReturnValue(throwError(() => new Error("Server error")));
    const navigateSpy = jest.spyOn(router, "navigate");
    component.form.setValue({
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "",
      companyName: "",
    });
    component.submit();
    expect(component.saving).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
