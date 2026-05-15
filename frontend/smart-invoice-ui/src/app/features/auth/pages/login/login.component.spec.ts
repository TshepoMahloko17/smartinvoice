import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { LoginComponent } from "./login.component";
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

describe("LoginComponent", () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSvc: { login: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    authSvc = { login: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
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

  it("form is invalid with bad email format", () => {
    component.form.setValue({ email: "not-an-email", password: "secret" });
    expect(component.form.get("email")!.hasError("email")).toBe(true);
  });

  it("form is valid with correct credentials", () => {
    component.form.setValue({
      email: "jane@example.com",
      password: "password",
    });
    expect(component.form.valid).toBe(true);
  });

  it("submit does nothing when form is invalid", () => {
    component.submit();
    expect(authSvc.login).not.toHaveBeenCalled();
  });

  it("submit calls auth.login with email and password", () => {
    authSvc.login.mockReturnValue(of(mockAuthResponse));
    component.form.setValue({
      email: "jane@example.com",
      password: "secret123",
    });
    component.submit();
    expect(authSvc.login).toHaveBeenCalledWith("jane@example.com", "secret123");
  });

  it("navigates to /dashboard on successful login", async () => {
    authSvc.login.mockReturnValue(of(mockAuthResponse));
    const navigateSpy = jest.spyOn(router, "navigate").mockResolvedValue(true);
    component.form.setValue({
      email: "jane@example.com",
      password: "secret123",
    });
    component.submit();
    expect(navigateSpy).toHaveBeenCalledWith(["/dashboard"]);
  });

  it("shows error message and clears loading on failed login", () => {
    authSvc.login.mockReturnValue(throwError(() => new Error("Unauthorized")));
    component.form.setValue({
      email: "jane@example.com",
      password: "wrongpwd",
    });
    component.submit();
    expect(component.error).toBe("Invalid email or password.");
    expect(component.loading).toBe(false);
  });

  it("toggles showPwd when called", () => {
    expect(component.showPwd).toBe(false);
    component.showPwd = true;
    expect(component.showPwd).toBe(true);
  });
});
