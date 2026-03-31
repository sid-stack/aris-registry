describe('SAM.gov Contractor Intelligence', () => {
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
    cy.contains('Contractor Intelligence').should('be.visible');
    cy.get('input.premium-input')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Query by entity, NAICS, or capability intent...');
  });

  it('should show results when searching', () => {
    // Intercept the API call and return mock data so tests don't depend on the backend
    cy.intercept('POST', '/api/sam-scrape', {
      statusCode: 200,
      body: {
        results: [
          {
            id: 1,
            businessName: 'Federal Construction Solutions LLC',
            ownerName: 'John Smith',
            address: '123 Government St, Washington DC 20500',
            phone: '(555) 123-4567',
            email: 'info@federalconstruction.com',
            website: 'www.federalconstruction.com',
            naicsCode: '236220',
            capability: 'Commercial and Institutional Building Construction',
            samStatus: 'Active',
            lastUpdated: '2024-03-15',
            matchConfidence: 94,
          },
          {
            id: 2,
            businessName: 'Defense Technology Innovations',
            ownerName: 'Sarah Johnson',
            address: '456 Defense Ave, Arlington VA 22201',
            phone: '(555) 987-6543',
            email: 'contact@defensetech.com',
            website: 'www.defensetech.com',
            naicsCode: '541715',
            capability: 'Research and Development',
            samStatus: 'Active',
            lastUpdated: '2024-03-14',
            matchConfidence: 87,
          },
        ],
      },
    }).as('samSearch');

    cy.get('input.premium-input').type('construction');
    cy.get('button.premium-btn').click();

    cy.wait('@samSearch');
    cy.get('.intel-card', { timeout: 6000 }).should('have.length', 2);
    cy.contains('Federal Construction Solutions LLC').should('be.visible');
  });

  it('should open dossier modal when clicking DOSSIER', () => {
    cy.intercept('POST', '/api/sam-scrape', {
      statusCode: 200,
      body: {
        results: [
          {
            id: 1,
            businessName: 'Federal Construction Solutions LLC',
            ownerName: 'John Smith',
            address: '123 Government St, Washington DC 20500',
            phone: '(555) 123-4567',
            email: 'info@federalconstruction.com',
            website: 'www.federalconstruction.com',
            naicsCode: '236220',
            capability: 'Commercial and Institutional Building Construction',
            samStatus: 'Active',
            lastUpdated: '2024-03-15',
            matchConfidence: 94,
          },
        ],
      },
    }).as('samSearch');

    cy.get('input.premium-input').type('defense');
    cy.get('button.premium-btn').click();

    cy.wait('@samSearch');
    cy.get('.intel-card', { timeout: 6000 }).first().contains('DOSSIER').click();
    cy.get('.modal-window', { timeout: 3000 }).should('be.visible');
    cy.get('.close-btn').first().click();
    cy.get('.modal-window').should('not.exist');
  });
});
