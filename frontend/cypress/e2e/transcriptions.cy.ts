const completed = {
  transcriptionId: "t-1",
  userId: "u-1",
  fileName: "consulta.wav",
  status: "COMPLETED",
  source: "FILE",
  audioKey: "audio/u-1/t-1",
  transcriptKey: "transcripts/u-1/t-1.txt",
  durationSeconds: 42,
  errorMessage: null,
  createdAt: "2026-08-20T10:00:00.000Z",
  completedAt: "2026-08-20T10:00:30.000Z",
};

describe("Transcriptions", () => {
  beforeEach(() => {
    cy.login();
  });

  it("Empty state when no transcriptions", () => {
    cy.intercept("GET", "**/transcriptions*", {
      body: { items: [], nextCursor: null },
    }).as("list");

    cy.visit("/");
    cy.wait("@list");

    cy.contains("Todavía no has hecho ninguna transcripción").should(
      "be.visible",
    );
  });

  it("List transcriptions", () => {
    cy.intercept("GET", "**/transcriptions*", {
      body: { items: [completed], nextCursor: null },
    }).as("list");

    cy.visit("/");
    cy.wait("@list");

    cy.contains("consulta.wav").should("be.visible");
    cy.contains("Completada").should("be.visible");
    cy.contains("button", "Descargar").should("be.visible");
  });

  it("Can't download while transcription is processing", () => {
    cy.intercept("GET", "**/transcriptions*", {
      body: {
        items: [{ ...completed, status: "PROCESSING", transcriptKey: null }],
        nextCursor: null,
      },
    }).as("list");

    cy.visit("/");
    cy.wait("@list");

    cy.contains("Procesando").should("be.visible");
    cy.contains("button", "Descargar").should("not.exist");
  });

  it("Reject non audio files", () => {
    cy.intercept("GET", "**/transcriptions*", {
      body: { items: [], nextCursor: null },
    });

    cy.visit("/");

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("no soy audio"),
        fileName: "documento.txt",
        mimeType: "text/plain",
      },
      { force: true },
    );

    cy.contains("El archivo debe ser un audio").should("be.visible");
  });

  it("Upload audio and refresh history", () => {
    cy.intercept("GET", "**/transcriptions*", {
      body: { items: [], nextCursor: null },
    }).as("list");

    cy.intercept("POST", "**/transcriptions", {
      body: {
        transcriptionId: "t-nueva",
        uploadUrl: "https://s3.example.com/upload-firmada",
      },
    }).as("create");

    cy.intercept("PUT", "https://s3.example.com/**", { statusCode: 200 }).as(
      "upload",
    );

    cy.visit("/");
    cy.wait("@list");

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("audio simulado"),
        fileName: "dictado.wav",
        mimeType: "audio/wav",
      },
      { force: true },
    );

    cy.wait("@create");
    cy.wait("@upload");
    cy.wait("@list");
  });
});
