
import { sovereignSearch } from '../api/services/fedSearch.js';

async function findLeads(query) {
  if (!query) {
    console.error("Usage: node scripts/find_leads.js <query>");
    process.exit(1);
  }

  try {
    const searchResults = await sovereignSearch.search(query);
    const leads = searchResults.results;

    // CSV Header
    const header = "Award ID,Award Date,Contract Title,Agency,Contractor Name,UEI/DUNS,Award Amount,Contact Name,Contact Email,Contact Phone,SAM.gov URL";
    console.log(header);

    if (leads && leads.length > 0) {
      leads.forEach(lead => {
        const awardId = lead.id || '';
        const awardDate = lead.postedDate || '';
        const contractTitle = `"${(lead.title || '').replace(/"/g, '""')}"`;
        const agency = `"${(lead.agency || '').replace(/"/g, '""')}"`;
        const contractorName = `"${(lead.recipient || '').replace(/"/g, '""')}"`;
        const ueiDuns = ''; // Not available in search result
        const awardAmount = lead.amount || '';
        const contactName = ''; // Not available
        const contactEmail = ''; // Not available
        const contactPhone = ''; // Not available
        const samGovUrl = lead.url || '';
        
        const row = [awardId, awardDate, contractTitle, agency, contractorName, ueiDuns, awardAmount, contactName, contactEmail, contactPhone, samGovUrl].join(',');
        console.log(row);
      });
    } else {
      console.error("No leads found for the query:", query);
    }
  } catch (error) {
    console.error("An error occurred while searching for leads:", error);
    process.exit(1);
  }
}

const query = process.argv[2] || 'artificial intelligence';
findLeads(query);
