describe('SAM.gov Intelligence Scraper', () => {
  beforeEach(() => {
    cy.visit('/sam-scraper', {
      onBeforeLoad(win) {
        win.localStorage.setItem('bidsmith-analytics-consent', 'true');
        const style = win.document.createElement('style');
        style.innerHTML = '* { opacity: 1 !important; transform: none !important; transition: none !important; visibility: visible !important; }';
        win.document.head.appendChild(style);
      },
    });
  });

  it('should load the SAM Scraper page correctly', () => {
    // Check if the title is present
    cy.contains('SAM.gov Intelligence Scraper').should('be.visible');

    // Check if the search input is present
    cy.get('input.search-input').should('be.visible').and('have.attr', 'placeholder', 'Search contractors by name, NAICS code, capability, or location...');
  });

  it('should show results when searching', () => {
    const query = 'construction';
    cy.get('input.search-input').type(query);
    cy.get('button.search-button').click();

    cy.contains('Scraping SAM.gov database...').should('not.exist');
    cy.get('.contractor-card').should('have.length', 3);
    cy.contains('Federal Construction Solutions LLC').should('be.visible');
  });

  it('should open details modal when clicking "View Details"', () => {
    const query = 'defense';
    cy.get('input.search-input').type(query);
    cy.get('button.search-button').click();

    cy.get('.contractor-card').first().contains('View Details').click();
    cy.get('.contractor-modal').should('be.visible');
    cy.get('.close-button').click();
    cy.get('.contractor-modal').should('not.exist');
  });
});
