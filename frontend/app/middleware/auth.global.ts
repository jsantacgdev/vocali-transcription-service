export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ["/login", "/register", "/confirm"];
  if (publicRoutes.includes(to.path)) return;

  const { isAuthenticated } = useAuth();
  if (!(await isAuthenticated())) {
    return navigateTo("/login");
  }
});
