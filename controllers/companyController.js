import { getCompaniesFromTheirStack } from '../services/companyService.js';

export const fetchCompanies = async (req, res) => {
  const { page = 1, limit = 10 } = req.body; 

  try {
    const data = await getCompaniesFromTheirStack(page, limit);
    res.json({ page, data });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};



export const fetchJobsFromGreenhouse = async (req, res) => {
  try {
    const companySlugs = await getCompaniesFromTheirStack();
    console.log(companySlugs)
    const allJobs = [];

    for (const slug of companySlugs) {
      const url = `https://boards.greenhouse.io/${slug}/jobs.json`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Failed for ${slug}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      const jobs = data.jobs.map(job => ({
        id: job.id,
        title: job.title,
        location: job.location.name,
        company: slug,
        url: `https://boards.greenhouse.io/${slug}/jobs/${job.id}`
      }));

      allJobs.push(...jobs);
    }

    res.json({ jobs: allJobs });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong while fetching jobs' });
  }
};
