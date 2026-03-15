describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bidsmith-analytics-consent', 'true');
        const style = win.document.createElement('style');
        style.innerHTML = '* { opacity: 1 !important; transform: none !important; transition: none !important; visibility: visible !important; }';
        win.document.head.appendChild(style);
      },
    });
  });

  it('should load the landing page correctly', () => {
    cy.contains('BidSmith', { timeout: 10000 }).should('be.visible');
    cy.contains('The First Zero-Knowledge Defense Workbench').should('be.visible');
    cy.contains('SAM Scraper').should('be.visible');
  });

  it('should navigate to SAM Scraper when clicking the button', () => {
    cy.contains('SAM Scraper').click();
    cy.url().should('include', '/sam-scraper');
    cy.contains('SAM.gov Intelligence Scraper').should('be.visible');
  });
});
