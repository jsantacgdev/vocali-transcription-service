declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", () => {
  cy.session("cognito-user", () => {
    cy.visit("/login");
    cy.get("#email").type(Cypress.env("TEST_EMAIL") as string);
    cy.get("#password").type(Cypress.env("TEST_PASSWORD") as string);
    cy.contains("button", "Entrar").click();
    cy.location("pathname", { timeout: 15000 }).should("eq", "/");
  });
});

export {};
