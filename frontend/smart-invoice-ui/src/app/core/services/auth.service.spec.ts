import { TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { StorageService } from "./storage.service";
import { AuthResponse } from "../../shared/models/user.model";
import { environment } from "../../../environments/environment";

const mockResponse: AuthResponse = {
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

describe("AuthService", () => {
  let svc: AuthService;
  let http: HttpTestingController;
  let storage: StorageService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    svc = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(StorageService);
    router = TestBed.inject(Router);

    // Clear sessionStorage between tests
    sessionStorage.clear();
  });

  afterEach(() => {
    http.verify();
    jest.restoreAllMocks();
  });

  describe("login", () => {
    it("POSTs to /auth/login with email and password", () => {
      svc.login("jane@example.com", "secret").subscribe();
      const req = http.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({
        email: "jane@example.com",
        password: "secret",
      });
      req.flush(mockResponse);
    });

    it("stores tokens and user on success", () => {
      const setTokensSpy = jest.spyOn(storage, "setTokens");
      const setUserSpy = jest.spyOn(storage, "setUser");
      svc.login("jane@example.com", "secret").subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);
      expect(setTokensSpy).toHaveBeenCalledWith(
        "access-token",
        "refresh-token",
      );
      expect(setUserSpy).toHaveBeenCalledWith(mockResponse.user);
    });

    it("emits the user through currentUser signal", () => {
      svc.login("jane@example.com", "secret").subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);
      expect(svc.currentUser()).toEqual(mockResponse.user);
    });
  });

  describe("register", () => {
    it("POSTs to /auth/register with all fields", () => {
      svc
        .register("Jane", "Doe", "jane@example.com", "password123")
        .subscribe();
      const req = http.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "password123",
      });
      req.flush(mockResponse);
    });

    it("stores tokens on success", () => {
      const setTokensSpy = jest.spyOn(storage, "setTokens");
      svc
        .register("Jane", "Doe", "jane@example.com", "password123")
        .subscribe();
      http.expectOne(`${environment.apiUrl}/auth/register`).flush(mockResponse);
      expect(setTokensSpy).toHaveBeenCalledWith(
        "access-token",
        "refresh-token",
      );
    });
  });

  describe("refreshToken", () => {
    it("POSTs to /auth/refresh-token with the stored refresh token", () => {
      jest.spyOn(storage, "getRefreshToken").mockReturnValue("stored-refresh");
      svc.refreshToken().subscribe();
      const req = http.expectOne(`${environment.apiUrl}/auth/refresh-token`);
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual({ refreshToken: "stored-refresh" });
      req.flush(mockResponse);
    });

    it("updates stored tokens on success", () => {
      jest.spyOn(storage, "getRefreshToken").mockReturnValue("stored-refresh");
      const setTokensSpy = jest.spyOn(storage, "setTokens");
      svc.refreshToken().subscribe();
      http
        .expectOne(`${environment.apiUrl}/auth/refresh-token`)
        .flush(mockResponse);
      expect(setTokensSpy).toHaveBeenCalledWith(
        "access-token",
        "refresh-token",
      );
    });
  });

  describe("logout", () => {
    it("clears tokens and navigates to /auth/login", () => {
      const clearSpy = jest.spyOn(storage, "clearTokens");
      const navigateSpy = jest
        .spyOn(router, "navigate")
        .mockResolvedValue(true);
      svc.logout();
      expect(clearSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(["/auth/login"]);
    });

    it("sets currentUser to null", () => {
      jest.spyOn(router, "navigate").mockResolvedValue(true);
      svc.logout();
      expect(svc.currentUser()).toBeNull();
    });
  });

  describe("isLoggedIn", () => {
    it("returns true when access token is present", () => {
      jest.spyOn(storage, "getAccessToken").mockReturnValue("some-token");
      expect(svc.isLoggedIn).toBe(true);
    });

    it("returns false when no access token", () => {
      jest.spyOn(storage, "getAccessToken").mockReturnValue(null);
      expect(svc.isLoggedIn).toBe(false);
    });
  });
});
