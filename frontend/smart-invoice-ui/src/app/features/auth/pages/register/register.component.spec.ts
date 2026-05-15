import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { RegisterComponent } from "./register.component";
import { AuthService } from "../../../../core/services/auth.service";
import { AuthResponse } from "../../../../shared/models/user.model";

const mockAuthResponse: AuthResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    fullName: "Jane Doe",
  },
};

describe("RegisterComponent", () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authSvc: { register: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    authSvc = { register: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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

  it("form is invalid with mismatched passwords", () => {
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(component.form.hasError("passwordsMismatch")).toBe(true);
  });

  it("form is invalid when password is shorter than 8 chars", () => {
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(component.form.get("password")!.hasError("minlength")).toBe(true);
  });

  it("form is valid with all correct fields", () => {
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(component.form.valid).toBe(true);
  });

  it("submit does nothing when form is invalid", () => {
    component.submit();
    expect(authSvc.register).not.toHaveBeenCalled();
  });

  it("submit calls auth.register with correct arguments", () => {
    authSvc.register.mockReturnValue(of(mockAuthResponse));
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    component.submit();
    expect(authSvc.register).toHaveBeenCalledWith(
      "Jane",
      "Doe",
      "jane@example.com",
      "password123",
    );
  });

  it("navigates to /dashboard on successful registration", async () => {
    authSvc.register.mockReturnValue(of(mockAuthResponse));
    const navigateSpy = jest.spyOn(router, "navigate").mockResolvedValue(true);
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    component.submit();
    expect(navigateSpy).toHaveBeenCalledWith(["/dashboard"]);
  });

  it("shows error message and clears loading on failed registration", () => {
    authSvc.register.mockReturnValue(
      throwError(() => ({
        error: { errors: { Email: ["Email already taken"] } },
      })),
    );
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    component.submit();
    expect(component.error).toBe("Email already taken");
    expect(component.loading).toBe(false);
  });

  it("falls back to generic error when no Email field in error response", () => {
    authSvc.register.mockReturnValue(throwError(() => new Error("Network")));
    component.form.setValue({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    component.submit();
    expect(component.error).toBe("Registration failed. Please try again.");
  });
});
