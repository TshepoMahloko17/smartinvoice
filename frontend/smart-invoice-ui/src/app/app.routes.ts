import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./layout/main-layout/main-layout.component").then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/pages/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "invoices",
        loadComponent: () =>
          import("./features/invoices/pages/invoice-list/invoice-list.component").then(
            (m) => m.InvoiceListComponent,
          ),
      },
      {
        path: "invoices/new",
        loadComponent: () =>
          import("./features/invoices/pages/invoice-form/invoice-form.component").then(
            (m) => m.InvoiceFormComponent,
          ),
      },
      {
        path: "invoices/:id/edit",
        loadComponent: () =>
          import("./features/invoices/pages/invoice-edit/invoice-edit.component").then(
            (m) => m.InvoiceEditComponent,
          ),
      },
      {
        path: "invoices/:id",
        loadComponent: () =>
          import("./features/invoices/pages/invoice-detail/invoice-detail.component").then(
            (m) => m.InvoiceDetailComponent,
          ),
      },
      {
        path: "clients",
        loadComponent: () =>
          import("./features/clients/pages/client-list/client-list.component").then(
            (m) => m.ClientListComponent,
          ),
      },
      {
        path: "clients/new",
        loadComponent: () =>
          import("./features/clients/pages/client-form/client-form.component").then(
            (m) => m.ClientFormComponent,
          ),
      },
      {
        path: "clients/:id",
        loadComponent: () =>
          import("./features/clients/pages/client-detail/client-detail.component").then(
            (m) => m.ClientDetailComponent,
          ),
      },
      {
        path: "contracts",
        loadComponent: () =>
          import("./features/contracts/pages/contract-list/contract-list.component").then(
            (m) => m.ContractListComponent,
          ),
      },
      {
        path: "payments",
        loadComponent: () =>
          import("./features/payments/pages/payment-list/payment-list.component").then(
            (m) => m.PaymentListComponent,
          ),
      },
      {
        path: "payments/new",
        loadComponent: () =>
          import("./features/payments/pages/payment-form/payment-form.component").then(
            (m) => m.PaymentFormComponent,
          ),
      },
      {
        path: "contracts/new",
        loadComponent: () =>
          import("./features/contracts/pages/contract-form/contract-form.component").then(
            (m) => m.ContractFormComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  {
    path: "auth",
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("./features/auth/pages/login/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "register",
        loadComponent: () =>
          import("./features/auth/pages/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
      },
    ],
  },
  {
    path: "**",
    loadComponent: () =>
      import("./shared/components/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
