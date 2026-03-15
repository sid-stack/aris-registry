describe('Debug Home', () => {
  it('should show the body content', () => {
    cy.visit('http://127.0.0.1:5173/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bidsmith-analytics-consent', 'true');
        const style = win.document.createElement('style');
        style.innerHTML = '.reveal-hidden { opacity: 1 !important; transform: none !important; transition: none !important; }';
        win.document.head.appendChild(style);
      },
    });
    cy.get('body').invoke('text').then((text) => {
      cy.log('Full Body text:', text.substring(0, 500));
    });
    cy.screenshot('debug-page');
    // Force visibility and check for BidSmith
    cy.get('body').then(($body) => {
      if ($body.text().includes('BidSmith')) {
        cy.log('FOUND BidSmith in body text');
      } else {
        cy.log('BidSmith NOT found in body text');
      }
    });
    cy.contains('BidSmith', { timeout: 15000 }).should('exist');
  });
});
