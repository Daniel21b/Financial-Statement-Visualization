import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from './Card';
import { CardContent } from './CardContent';
import { Button } from './Button';
import { Select } from './Select';
import { Home, Users, LogOut, FileText, User } from 'lucide-react';
import axios from 'axios';
import pLimit from 'p-limit';
import './FinVueAnalysis.css';

const API_BASE_URL = "https://financial-statement-visualization.onrender.com"; // Backend URL on Render

const financialMetrics = {
  assets: "Assets",
  liabilities: "Liabilities",
  equity: "StockholdersEquity",
  revenue: "Revenues",
  netIncome: "NetIncomeLoss",
};

const limit = pLimit(5);

const FinVueAnalysis = () => {
  const [selectedMetric, setSelectedMetric] = useState('assets');
  const [metricsData, setMetricsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyList, setCompanyList] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const companyTickersResponse = await axios.get(`${API_BASE_URL}/api/company-tickers`);
        const companyDataArray = Object.values(companyTickersResponse.data);
        setCompanyList(companyDataArray);
        setSelectedCompanies([companyDataArray[0]]);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setError("An error occurred while fetching company data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const newMetricsData = {};

      const fetchPromises = selectedCompanies.flatMap(company => {
        const cik = company.cik_str.toString().padStart(10, '0');
        newMetricsData[company.ticker] = {};

        return Object.entries(financialMetrics).map(([key, value]) =>
          limit(async () => {
            try {
              console.log(`Fetching data for ${company.ticker}, metric: ${value}`);
              const response = await axios.get(`${API_BASE_URL}/api/company-concept/${cik}/${value}`);

              const data = response.data.units.USD;
              const tenKData = data.filter(item => item.form === '10-K').sort((a, b) => new Date(a.end) - new Date(b.end));
              const tenQData = data.filter(item => item.form === '10-Q').sort((a, b) => new Date(a.end) - new Date(b.end));

              newMetricsData[company.ticker][key] = { tenKData, tenQData };
            } catch (error) {
              console.error(`Error fetching data for ${company.ticker}, metric: ${value}`, error.message);
              newMetricsData[company.ticker][key] = { tenKData: [], tenQData: [] };
            }
          })
        );
      });

      await Promise.all(fetchPromises);
      setMetricsData(newMetricsData);
    } catch (error) {
      console.error("Error in fetchData:", error);
      setError("An error occurred while fetching financial data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanies]);

  useEffect(() => {
    if (selectedCompanies.length > 0) {
      fetchData();
    }
  }, [selectedCompanies, fetchData]);

  const fetchNews = async () => {
    try {
      const response = await axios.get('https://api.marketaux.com/v1/news/all', {
        params: {
          countries: 'us',
          filter_entities: true,
          limit: 10,
          published_after: '2024-07-29T21:56',
          api_token: 'eM6ilsiHpSR7PiBPONMooaKNeP3Ks7WzSKYYbfKy'
        }
      });
      setNews(response.data.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
  };

  const renderFinancialOverview = () => (
    <Card className="financial-overview">
      <CardContent>
        <h2>Financial Overview</h2>
        <div className="financial-grid">
          {Object.entries(financialMetrics).map(([key, value]) => (
            <div key={key} className="financial-item">
              <h3>{value}</h3>
              {selectedCompanies.map(company => (
                <p key={company.ticker} className="financial-value">
                  {company.title}: 
                  {metricsData[company.ticker] && 
                   metricsData[company.ticker][key] &&
                   metricsData[company.ticker][key].tenKData &&
                   metricsData[company.ticker][key].tenKData.length > 0
                    ? `$${metricsData[company.ticker][key].tenKData[metricsData[company.ticker][key].tenKData.length - 1].val.toLocaleString()}`
                    : 'N/A'}
                </p>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderCharts = () => {
    const getChartData = (data, metric) => data.map(item => ({
      end: new Date(item.end).toISOString().split('T')[0],
      value: item.val,
    }));

    return (
      <Card className="financial-charts">
        <CardContent>
          <h2>{financialMetrics[selectedMetric]} Trends</h2>
          <div className="chart-controls">
            {Object.entries(financialMetrics).map(([key, value]) => (
              <Button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={selectedMetric === key ? 'active' : ''}
              >
                {value}
              </Button>
            ))}
          </div>
          <div className="chart-container">
            <h3>Annual Data (10-K)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedCompanies.flatMap(company => getChartData(metricsData[company.ticker]?.[selectedMetric]?.tenKData || [], selectedMetric))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="end" tickFormatter={(date) => new Date(date).getFullYear()} />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                {selectedCompanies.map(company => (
                  <Bar
                    key={company.ticker}
                    dataKey="value"
                    name={company.title}
                    fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3>Quarterly Data (10-Q)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedCompanies.flatMap(company => getChartData(metricsData[company.ticker]?.[selectedMetric]?.tenQData || [], selectedMetric))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="end" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                {selectedCompanies.map(company => (
                  <Line
                    key={company.ticker}
                    type="monotone"
                    dataKey="value"
                    name={company.title}
                    stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleCompanyChange = (e) => {
    const selectedCompany = companyList.find(c => c.ticker === e.target.value);
    if (isComparing) {
      setSelectedCompanies(prev => [...prev, selectedCompany]);
    } else {
      setSelectedCompanies([selectedCompany]);
    }
  };

  const toggleComparison = () => {
    setIsComparing(!isComparing);
    if (!isComparing) {
      setSelectedCompanies(prev => [prev[0]]);
    }
  };

  const renderNews = () => (
    <div className="news-section">
      <h3>Latest News</h3>
      <ul>
        {news.map((item, index) => (
          <li key={index}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="finvue-analysis">
      <aside className="sidebar">
        <h1>FinVue</h1>
        <nav>
          <ul>
            <li className="active"><Home size={18} /> Dashboard</li>
            <li onClick={toggleComparison}><Users size={18} /> {isComparing ? 'Stop Comparing' : 'Compare Companies'}</li>
            <li onClick={fetchNews}><FileText size={18} /> Fetch News</li>
          </ul>
        </nav>
        <div className="logout">
          <LogOut size={18} /> Logout
        </div>
      </aside>
      <main className="main-content">
        <header className="main-header">
          <Select
            value={selectedCompanies[selectedCompanies.length - 1]?.ticker}
            onChange={handleCompanyChange}
          >
            {companyList.map(company => (
              <option key={company.ticker} value={company.ticker}>
                {company.title}
              </option>
            ))}
          </Select>
          <div className="header-icons">
            <User size={20} />
          </div>
        </header>
        <div className="dashboard-grid">
          {renderFinancialOverview()}
          {renderCharts()}
          {news.length > 0 && renderNews()}
        </div>
      </main>
    </div>
  );
};

export default FinVueAnalysis;
