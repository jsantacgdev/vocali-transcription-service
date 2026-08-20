import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const currentEmail = ref<string | null>(null);

export const useAuth = () => {
  const config = useRuntimeConfig();

  const userPool = () =>
    new CognitoUserPool({
      UserPoolId: config.public.cognitoUserPoolId as string,
      ClientId: config.public.cognitoClientId as string,
    });

  const cognitoUser = (email: string) =>
    new CognitoUser({ Username: email, Pool: userPool() });

  const register = (email: string, password: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
      ];
      userPool().signUp(email, password, attributes, [], (err) => {
        if (err) return reject(new Error(err.message));
        resolve();
      });
    });

  const confirm = (email: string, code: string): Promise<void> =>
    new Promise((resolve, reject) => {
      cognitoUser(email).confirmRegistration(code, true, (err) => {
        if (err) return reject(new Error(err.message));
        resolve();
      });
    });

  const login = (email: string, password: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const details = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      cognitoUser(email).authenticateUser(details, {
        onSuccess: () => {
          currentEmail.value = email;
          resolve();
        },
        onFailure: (err) => reject(new Error(err.message)),
      });
    });

  const logout = () => {
    userPool().getCurrentUser()?.signOut();
    currentEmail.value = null;
    navigateTo("/login");
  };

  const getSession = (): Promise<CognitoUserSession | null> =>
    new Promise((resolve) => {
      const user = userPool().getCurrentUser();
      if (!user) return resolve(null);
      user.getSession((err: Error | null, session: CognitoUserSession) => {
        if (err || !session.isValid()) return resolve(null);
        const claims = session.getIdToken().payload;
        currentEmail.value =
          (claims.email as string | undefined) ?? user.getUsername();
        resolve(session);
      });
    });

  const getIdToken = async (): Promise<string | null> => {
    const session = await getSession();
    return session ? session.getIdToken().getJwtToken() : null;
  };

  const isAuthenticated = async (): Promise<boolean> =>
    (await getSession()) !== null;

  return {
    currentEmail: readonly(currentEmail),
    register,
    confirm,
    login,
    logout,
    getSession,
    getIdToken,
    isAuthenticated,
  };
};
