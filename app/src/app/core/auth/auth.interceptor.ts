import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "./auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  let request = req;
  if (token) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // If it's a login attempt, just pass the error through so the component can show "Wrong password"
        if (req.url.includes("/login")) {
          return throwError(() => err);
        }

        // For other requests, it means the token is expired/invalid
        auth.logout();
        router.navigateByUrl("/login");
      }
      return throwError(() => err);
    }),
  );
};

