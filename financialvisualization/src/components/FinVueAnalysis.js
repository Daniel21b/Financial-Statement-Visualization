import React, { useState, useEffect, useCallback } from 'react';
import { Search, BarChart2, DollarSign, FileText, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FinVueAnalysis = () => {
  const [company, setCompany] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('annual');

  // Simple in-memory cache
  const cache = {};

  const fetchCompanyData = useCallback(async (ticker) => {
    setLoading(true);
    setError(null);

    // Check cache first
    if (cache[ticker]) {
      setCompany(cache[ticker].company);
      setFinancialData(cache[ticker].financialData);
      setLoading(false);
      return;
    }

    try {
      // Fetch company CIK
      const response = await fetch(`https://www.sec.gov/files/company_tickers.json`);
      const companyList = await response.json();
      const companyInfo = Object.values(companyList).find(
        company => company.ticker.toLowerCase() === ticker.toLowerCase()
      );

      if (!companyInfo) {
        throw new Error('Company not found');
      }

      const cik = companyInfo.cik_str.padStart(10, '0');

      // Fetch company facts
      const factsResponse = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
        headers: {
          'User-Agent': 'Daniel Berhane dberhane@terpmail.umd.edu' // Replace with your information
        }
      });

      if (!factsResponse.ok) {
        throw new Error(`HTTP error! status: ${factsResponse.status}`);
      }

      const factsData = await factsResponse.json();
      console.log('Fetched company facts data:', factsData); // Debug log

      // Process the data
      const processedData = processFinancialData(factsData);
      setCompany(companyInfo);
      setFinancialData(processedData);
      console.log('Processed financial data:', processedData); // Debug log

      // Cache the results
      cache[ticker] = { company: companyInfo, financialData: processedData };
    } catch (err) {
      console.error('Error fetching data:', err); // Debug log
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const processFinancialData = (data) => {
    const processDataItem = (itemName, taxonomy, label, array) => {
      if (data.facts[taxonomy] && data.facts[taxonomy][itemName]) {
        const units = Object.keys(data.facts[taxonomy][itemName].units)[0];
        data.facts[taxonomy][itemName].units[units].forEach(item => {
          const existingDataPoint = array.find(dp => dp.date === item.end);
          if (existingDataPoint) {
            existingDataPoint[label] = item.val;
          } else {
            array.push({
              date: item.end,
              [label]: item.val,
            });
          }
        });
      }
    };

    const annualData = [];
    const quarterlyData = [];

    // Process balance sheet items
    processDataItem('Assets', 'us-gaap', 'Assets', annualData);
    processDataItem('Liabilities', 'us-gaap', 'Liabilities', annualData);
    processDataItem('StockholdersEquity', 'us-gaap', 'Equity', annualData);

    // Process income statement items
    processDataItem('Revenues', 'us-gaap', 'Revenue', annualData);
    processDataItem('NetIncomeLoss', 'us-gaap', 'NetIncome', annualData);

    // Process cash flow items
    processDataItem('NetCashProvidedByUsedInOperatingActivities', 'us-gaap', 'OperatingCashFlow', annualData);
    processDataItem('NetCashProvidedByUsedInInvestingActivities', 'us-gaap', 'InvestingCashFlow', annualData);
    processDataItem('NetCashProvidedByUsedInFinancingActivities', 'us-gaap', 'FinancingCashFlow', annualData);

    // Calculate financial ratios
    const financialRatios = calculateFinancialRatios(annualData);

    return { annual: annualData, quarterly: quarterlyData, ratios: financialRatios };
  };

  const calculateFinancialRatios = (data) => {
    return data.map(year => {
      const currentRatio = year.Assets / year.Liabilities || 0;
      const debtToEquity = year.Liabilities / year.Equity || 0;
      const returnOnEquity = year.NetIncome / year.Equity || 0;
      const profitMargin = year.NetIncome / year.Revenue || 0;

      return {
        date: year.date,
        currentRatio,
        debtToEquity,
        returnOnEquity,
        profitMargin
      };
    });
  };

  const renderFinancialChart = (data, type) => {
    if (!data || data.length === 0) return <p>No data available</p>;

    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.keys(sortedData[0]).filter(key => key !== 'date').map((key, index) => (
            <Bar key={key} dataKey={key} fill={['#3498db', '#e74c3c', '#2ecc71'][index % 3]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderRatiosChart = (data) => {
    if (!data || data.length === 0) return <p>No data available</p>;

    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="currentRatio" stroke="#3498db" />
          <Line type="monotone" dataKey="debtToEquity" stroke="#e74c3c" />
          <Line type="monotone" dataKey="returnOnEquity" stroke="#2ecc71" />
          <Line type="monotone" dataKey="profitMargin" stroke="#f39c12" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>FinVue Analysis</div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.searchBar}>
          <input 
            style={styles.input}
            type="text" 
            placeholder="Enter company ticker symbol" 
            onKeyPress={(e) => e.key === 'Enter' && fetchCompanyData(e.target.value)}
          />
          <button style={styles.button} onClick={() => fetchCompanyData(document.querySelector('input').value)}>
            <Search size={20} />
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}

        {company && financialData && (
          <>
            <h2>{company.title} ({company.ticker})</h2>
            <div style={{marginBottom: '20px'}}>
              <button 
                style={{...styles.toggleButton, ...(timeFrame === 'annual' ? styles.activeToggle : {})}}
                onClick={() => setTimeFrame('annual')}
              >
                Annual
              </button>
              <button 
                style={{...styles.toggleButton, ...(timeFrame === 'quarterly' ? styles.activeToggle : {})}}
                onClick={() => setTimeFrame('quarterly')}
              >
                Quarterly
              </button>
            </div>

            <div style={styles.grid}>
              <div style={styles.section}>
                <h2 style={styles.title}>
                  <FileText size={20} style={{marginRight: '10px'}} />
                  Balance Sheet
                </h2>
                {renderFinancialChart(financialData[timeFrame], 'balanceSheet')}
              </div>

              <div style={styles.section}>
                <h2 style={styles.title}>
                  <DollarSign size={20} style={{marginRight: '10px'}} />
                  Cash Flow
                </h2>
                {renderFinancialChart(financialData[timeFrame], 'cashFlow')}
              </div>

              <div style={styles.section}>
                <h2 style={styles.title}>
                  <TrendingUp size={20} style={{marginRight: '10px'}} />
                  Financial Ratios
                </h2>
                {renderRatiosChart(financialData.ratios)}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Styles
const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f4f9',
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '10px 20px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  main: {
    flex: 1,
    padding: '20px',
  },
  searchBar: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    width: '300px',
    marginRight: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px 15px',
    fontSize: '16px',
    borderRadius: '5px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  toggleButton: {
    padding: '10px 15px',
    fontSize: '16px',
    borderRadius: '5px',
    backgroundColor: '#ecf0f1',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
  },
  activeToggle: {
    backgroundColor: '#3498db',
    color: 'white',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  section: {
    padding: '20px',
    borderRadius: '5px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
    marginBottom: '10px',
  }
};

export default FinVueAnalysis;
