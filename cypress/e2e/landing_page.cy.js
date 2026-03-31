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
    cy.contains('Stop burning $5,000 on RFPs you were never going to win.').should('be.visible');
  });

  it('should navigate to Contractor Intelligence page via URL', () => {
    cy.visit('/sam-scraper', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bidsmith-analytics-consent', 'true');
        const style = win.document.createElement('style');
        style.innerHTML = '* { opacity: 1 !important; transform: none !important; transition: none !important; visibility: visible !important; }';
        win.document.head.appendChild(style);
      },
    });
    cy.contains('Contractor Intelligence', { timeout: 10000 }).should('be.visible');
  });
});
