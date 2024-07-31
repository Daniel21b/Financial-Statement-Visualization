const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 5001;

// Use Helmet to set security headers
app.use(helmet());

// Use the CORS middleware with specific configuration
app.use(cors({
  origin: 'https://financial-statement-visualization-1.onrender.com', // Frontend URL on Render
}));

// Set CSP headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://financial-statement-visualization-1.onrender.com https://financial-statement-visualization.onrender.com" // Include both frontend and backend URLs
  );
  next();
});

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Helper function to delay requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/company-tickers', async (req, res) => {
  try {
    const response = await axios.get('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'User-Agent': 'd.asfaw10@gmail.com',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching company tickers:', error.message);
    res.status(500).json({ error: 'Error fetching data from SEC API', details: error.message });
  }
});

app.get('/api/company-concept/:cik/:metric', async (req, res) => {
  const { cik, metric } = req.params;
  console.log(`Received request for CIK: ${cik}, Metric: ${metric}`);
  
  try {
    await delay(1000); // Add a small delay to avoid hitting rate limits

    const url = `https://data.sec.gov/api/xbrl/companyconcept/CIK${cik}/us-gaap/${metric}.json`;
    console.log(`Requesting URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'd.asfaw10@gmail.com',
      },
    });
    
    console.log(`Received response with status: ${response.status}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching data for CIK: ${cik}, Metric: ${metric}`, error.message);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
      res.status(error.response.status).json({
        error: 'Error fetching data from SEC API',
        details: error.response.data,
        status: error.response.status,
        url: error.config.url
      });
    } else if (error.request) {
      console.error('No response received from SEC API');
      res.status(500).json({ error: 'No response received from SEC API', details: error.message });
    } else {
      console.error('Error setting up request:', error.message);
      res.status(500).json({ error: 'Error setting up request to SEC API', details: error.message });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
