describe('Landing Page Dark Mode', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure a clean state
    cy.clearLocalStorage();
    // Visit the local HTML file. Cypress serves the project root.
    cy.visit('./landing_demo.html');
  });

  it('should default to light mode and have no localStorage value', () => {
    // The html tag should not have the 'dark' class
    cy.get('html').should('not.have.class', 'dark');

    // The body should have the light mode background
    cy.get('body').should('have.class', 'bg-gray-50');

    // The toggle button should show the moon icon
    cy.get('button[aria-label="Toggle Dark Mode"] img').should('have.attr', 'src').and('include', 'moon.svg');

    // localStorage should be empty for our key
    cy.window().its('localStorage').invoke('getItem', 'bidsmith-dark').should('be.null');
  });

  it('should toggle to dark mode on first click and persist the setting', () => {
    // Find and click the toggle button
    cy.get('button[aria-label="Toggle Dark Mode"]').click();

    // The html tag should now have the 'dark' class
    cy.get('html').should('have.class', 'dark');

    // The body should have the dark mode background class
    cy.get('body').should('have.class', 'dark:bg-gray-900');

    // The toggle button should show the sun icon
    cy.get('button[aria-label="Toggle Dark Mode"] img').should('have.attr', 'src').and('include', 'sun.svg');
    
    // Verify localStorage is set correctly
    cy.window().its('localStorage').invoke('getItem', 'bidsmith-dark').should('equal', 'true');
  });

  it('should toggle back to light mode on second click', () => {
    // Click twice
    cy.get('button[aria-label="Toggle Dark Mode"]').click().click();

    // The html tag should not have the 'dark' class
    cy.get('html').should('not.have.class', 'dark');

    // The icon should be the moon again
    cy.get('button[aria-label="Toggle Dark Mode"] img').should('have.attr', 'src').and('include', 'moon.svg');

    // Verify localStorage is set to 'false'
    cy.window().its('localStorage').invoke('getItem', 'bidsmith-dark').should('equal', 'false');
  });

  it('should load in dark mode if localStorage is set', () => {
    // Set localStorage *before* visiting the page
    cy.window().then((win) => {
      win.localStorage.setItem('bidsmith-dark', 'true');
    });

    // Re-visit the page
    cy.visit('./landing_demo.html');

    // Assert that dark mode is active on load
    cy.get('html').should('have.class', 'dark');
    cy.get('button[aria-label="Toggle Dark Mode"] img').should('have.attr', 'src').and('include', 'sun.svg');
  });

  it('should respect system preference for dark mode if localStorage is not set', () => {
    // Stub window.matchMedia to simulate a system preference for dark mode
    cy.visit('./landing_demo.html', {
      onBeforeLoad(win) {
        cy.stub(win, 'matchMedia').withArgs('(prefers-color-scheme: dark)').returns({ matches: true });
      },
    });

    // Assert that dark mode is active on load due to system preference
    cy.get('html').should('have.class', 'dark');
  });
});