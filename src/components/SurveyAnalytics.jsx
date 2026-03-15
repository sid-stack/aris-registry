import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './SurveyAnalytics.css';

const SurveyAnalytics = () => {
  const [surveyData, setSurveyData] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalResponses: 0,
    willingnessPercentage: 0,
    averageWTPScore: 0,
    averageContractsPerMonth: 0,
    averageTimePerContract: 0,
    budgetDistribution: {},
    featureDemand: {},
    wtpDistribution: {}
  });

  useEffect(() => {
    fetchSurveyData();
  }, []);

  const fetchSurveyData = async () => {
    try {
      // Mock data - in production, this would come from your backend
      const mockResponses = [
        {
          willingness: 'yes',
          reason: 'Saves time and provides valuable insights',
          features: ['realtime_alerts', 'export_csv'],
          contracts_per_month: 25,
          time_per_contract: '30_60',
          budget: '101_200',
          wtpScore: 85
        },
        {
          willingness: 'no',
          reason: 'Budget constraints, currently using free tools',
          features: ['collaboration'],
          contracts_per_month: 8,
          time_per_contract: '15_30',
          budget: 'less_50',
          wtpScore: 25
        },
        {
          willingness: 'yes',
          reason: 'AI analysis would be game-changing',
          features: ['crm_integration', 'realtime_alerts'],
          contracts_per_month: 50,
          time_per_contract: 'more_60',
          budget: '50_100',
          wtpScore: 78
        }
      ];

      setSurveyData(mockResponses);
      calculateAnalytics(mockResponses);
    } catch (error) {
      console.error('Error fetching survey data:', error);
    }
  };

  const calculateAnalytics = (responses) => {
    const total = responses.length;
    const yesResponses = responses.filter(r => r.willingness === 'yes').length;
    
    // Calculate averages
    const avgContracts = responses.reduce((sum, r) => sum + parseInt(r.contracts_per_month || 0), 0) / total;
    const avgWTP = responses.reduce((sum, r) => sum + (r.wtpScore || 0), 0) / total;
    
    // Budget distribution
    const budgetDist = responses.reduce((acc, r) => {
      acc[r.budget] = (acc[r.budget] || 0) + 1;
      return acc;
    }, {});
    
    // Feature demand
    const featureDist = responses.reduce((acc, r) => {
      if (r.features) {
        r.features.forEach(f => {
          acc[f] = (acc[f] || 0) + 1;
        });
      }
      return acc;
    }, {});
    
    // WTP distribution
    const wtpDist = {
      high: responses.filter(r => (r.wtpScore || 0) >= 70).length,
      medium: responses.filter(r => (r.wtpScore || 0) >= 40 && (r.wtpScore || 0) < 70).length,
      low: responses.filter(r => (r.wtpScore || 0) < 40).length
    };

    setAnalytics({
      totalResponses: total,
      willingnessPercentage: (yesResponses / total) * 100,
      averageWTPScore: Math.round(avgWTP),
      averageContractsPerMonth: Math.round(avgContracts),
      averageTimePerContract: '30_60', // Calculate mode
      budgetDistribution: budgetDist,
      featureDemand: featureDist,
      wtpDistribution: wtpDist
    });
  };

  // Chart data
  const budgetData = Object.entries(analytics.budgetDistribution).map(([budget, count]) => ({
    budget: budget.replace('_', '-'),
    responses: count
  }));

  const featureData = Object.entries(analytics.featureDemand).map(([feature, count]) => ({
    feature: feature.replace('_', ' '),
    demand: count
  }));

  const wtpData = Object.entries(analytics.wtpDistribution).map(([level, count]) => ({
    level: level.charAt(0).toUpperCase() + level.slice(1),
    responses: count
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="survey-analytics">
      <div className="analytics-header">
        <h1>Survey Analytics Dashboard</h1>
        <p>Real-time analysis of SAM.gov scraper pricing survey responses</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Responses</h3>
          <div className="metric-value">{analytics.totalResponses}</div>
        </div>
        <div className="metric-card">
          <h3>Willingness to Pay</h3>
          <div className="metric-value">{analytics.willingnessPercentage.toFixed(1)}%</div>
        </div>
        <div className="metric-card">
          <h3>Avg WTP Score</h3>
          <div className="metric-value">{analytics.averageWTPScore}/100</div>
        </div>
        <div className="metric-card">
          <h3>Avg Contracts/Month</h3>
          <div className="metric-value">{analytics.averageContractsPerMonth}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Budget Distribution</h3>
          <BarChart width={400} height={300} data={budgetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="budget" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="responses" fill="#3b82f6" />
          </BarChart>
        </div>

        <div className="chart-container">
          <h3>Feature Demand</h3>
          <BarChart width={400} height={300} data={featureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="feature" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="demand" fill="#10b981" />
          </BarChart>
        </div>

        <div className="chart-container">
          <h3>WTP Distribution</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={wtpData}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ level, responses }) => `${level}: ${responses}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="responses"
            >
              {wtpData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      <div className="insights-section">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h3>Price Sensitivity</h3>
            <p>
              {analytics.willingnessPercentage > 60 ? 
                "Strong price acceptance at $99/month" : 
                "Price sensitivity detected - consider tiered pricing"}
            </p>
          </div>
          <div className="insight-card">
            <h3>Feature Priority</h3>
            <p>
              {Object.entries(analytics.featureDemand)
                .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'} 
              {' '}is the most requested feature
            </p>
          </div>
          <div className="insight-card">
            <h3>Market Size</h3>
            <p>
              Average {analytics.averageContractsPerMonth} contracts/month indicates 
              {analytics.averageContractsPerMonth > 20 ? " high-volume users" : " moderate usage"}
            </p>
          </div>
          <div className="insight-card">
            <h3>Revenue Potential</h3>
            <p>
              ${(analytics.totalResponses * analytics.willingnessPercentage / 100 * 99).toFixed(0)} 
              {' '}monthly MRR potential from current respondents
            </p>
          </div>
        </div>
      </div>

      <div className="raw-data-section">
        <h2>Sample Responses</h2>
        <div className="responses-table">
          <table>
            <thead>
              <tr>
                <th>Willingness</th>
                <th>Reason</th>
                <th>Contracts/Month</th>
                <th>Budget</th>
                <th>WTP Score</th>
              </tr>
            </thead>
            <tbody>
              {surveyData.slice(0, 5).map((response, index) => (
                <tr key={index}>
                  <td>
                    <span className={`status-badge ${response.willingness}`}>
                      {response.willingness}
                    </span>
                  </td>
                  <td>{response.reason.substring(0, 50)}...</td>
                  <td>{response.contracts_per_month}</td>
                  <td>{response.budget.replace('_', '-')}</td>
                  <td>{response.wtpScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalytics;
