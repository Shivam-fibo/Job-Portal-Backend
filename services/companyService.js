export const getCompaniesFromTheirStack = async (page = 1, limit = 50) => {
  const payload = {
    company_technology_slug_or: ['greenhouse'],
    page,
    limit
  };

  const response = await fetch('https://api.theirstack.com/v1/companies/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.THEIRSTACK_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`TheirStack API error: ${response.statusText}`);.
    
  }

  const data = await response.json();
  const companies = data.data || [];

  const slugs = companies
    .map(company => {
      const domain = company.domain || '';
      const slug = domain.split('.')[0]; // e.g., "stripe.com" → "stripe"
      return slug;
    })
    .filter(Boolean); // remove null or empty values

  return slugs;
};
