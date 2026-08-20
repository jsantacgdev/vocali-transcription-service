describe("Autenticación", () => {
  const email = Cypress.env("TEST_EMAIL") as string;
  const password = Cypress.env("TEST_PASSWORD") as string;

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("Redirect to login when there is no session", () => {
    cy.visit("/");
    cy.location("pathname").should("eq", "/login");
  });

  it("Invalid credentials", () => {
    cy.visit("/login");

    cy.get("#email").type(email);
    cy.get("#password").type("ContrasenaIncorrecta1");
    cy.contains("button", "Entrar").click();

    cy.contains("Incorrect username or password").should("be.visible");
    cy.location("pathname").should("eq", "/login");
  });

  it("Login with valid credentials", () => {
    cy.visit("/login");

    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.contains("button", "Entrar").click();

    cy.location("pathname", { timeout: 15000 }).should("eq", "/");
    cy.contains("Transcripciones").should("be.visible");
    cy.contains(email).should("be.visible");
  });

  it("Logout", () => {
    cy.visit("/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.contains("button", "Entrar").click();
    cy.location("pathname", { timeout: 15000 }).should("eq", "/");

    cy.contains("button", "Cerrar sesión").click();

    cy.location("pathname").should("eq", "/login");
  });
});
