import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Read token directly from localStorage to avoid circular dependency with AuthService
  const token = localStorage.getItem('auth_token');

  // Clone the request to add credentials and auth header
  let authReq = req.clone({
    withCredentials: true
  });

  // Add Authorization header if token exists
  if (token) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq);
};
