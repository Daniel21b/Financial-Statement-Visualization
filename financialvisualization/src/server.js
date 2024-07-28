const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());

app.get('/api/company-tickers', async (req, res) => {
  try {
    const response = await axios.get('https://www.sec.gov/files/company_tickers.json');
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/api/company-facts/:cik', async (req, res) => {
  try {
    const { cik } = req.params;
    const response = await axios.get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
      headers: {
        'User-Agent': 'Daniel Berhane dberhane@terpmail.umd.edu' // Replace with your information
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
