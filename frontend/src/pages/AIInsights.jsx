import React, { useState, useEffect } from 'react';
import aiService from '../services/ai.service'; // Keep service import to avoid extra refactors
import { 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  Lightbulb, 
  ShieldAlert, 
  Heart, 
  Activity, 
  AlertCircle 
} from 'lucide-react';

const AIInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAIInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const insightsData = await aiService.getInsights();
      setData(insightsData);
    } catch (err) {
      setError('Could not compile machine learning insights or check SaaS optimization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIInsights();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Compiling SaaS Optimizer board...</span>
        </div>
      </div>
    );
  }

  // Define color based on Health Rating
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Excellent': return 'var(--color-success)';
      case 'Good': return 'var(--color-info)';
      case 'Fair': return 'var(--color-warning)';
      default: return 'var(--color-danger)';
    }
  };

  return (
    <div className="container-fluid p-4 fade-in-up">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-white mb-1 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit' }}>
          <Sparkles className="text-info animate-pulse" size={28} />
          SaaS AI ML Optimizer
        </h1>
        <p className="text-secondary mb-0">ML-driven license audits, overlap detection, anomaly alerts, and price forecasts.</p>
      </div>

      {error && (
        <div className="custom-alert-danger mb-4 small">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Main Insights Panel */}
      <div className="row g-4 mb-4">
        {/* SaaS Optimization Score (Conic Gauge) */}
        <div className="col-lg-4 col-md-6">
          <div className="glass-card p-4 d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '340px' }}>
            <h5 className="text-white mb-4 d-flex align-items-center gap-2">
              <Heart size={18} className="text-danger" />
              Optimization Rating
            </h5>
            
            <div 
              className="score-circle mb-3" 
              style={{ '--score-deg': (data?.healthScore || 0) * 3.6 }}
            >
              <span className="score-value text-white">
                {data?.healthScore || 0}
              </span>
            </div>

            <h4 
              className="fw-bold mb-1" 
              style={{ color: getRatingColor(data?.healthRating) }}
            >
              {data?.healthRating || 'Unknown'}
            </h4>
            <p className="text-secondary small mb-0">Unified SaaS portfolio health score</p>
          </div>
        </div>

        {/* Linear Regression Spend Forecast Card */}
        <div className="col-lg-4 col-md-6">
          <div className="glass-card p-4 d-flex flex-column justify-content-between" style={{ minHeight: '340px' }}>
            <div>
              <h5 className="text-white mb-3 d-flex align-items-center gap-2">
                <Cpu size={18} className="text-info" />
                License Spend Forecasting
              </h5>
              <p className="text-secondary small">
                Our scikit-learn Linear Regression model fits billing history data to forecast next month's total recurring cost.
              </p>
            </div>

            <div className="my-4 text-center">
              <span className="text-muted small d-block">PREDICTED NEXT CHARGES</span>
              <h2 className="text-white fw-bold display-6 mt-1 mb-0" style={{ fontFamily: 'Outfit' }}>
                ₹{data?.predictedExpense ? data.predictedExpense.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
              </h2>
            </div>

            <div className={`p-2 rounded small ${data?.isPredictionFallback ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'}`} style={{ fontSize: '0.8rem' }}>
              <TrendingUp size={14} className="me-1 inline" />
              {data?.predictionMessage || 'No predictive data compiled.'}
            </div>
          </div>
        </div>

        {/* Score Component Metrics */}
        <div className="col-lg-4 col-12">
          <div className="glass-card p-4 d-flex flex-column justify-content-between" style={{ minHeight: '340px' }}>
            <h5 className="text-white mb-4 d-flex align-items-center gap-2">
              <Activity size={18} className="text-warning" />
              Efficiency Index Weights
            </h5>

            <div className="d-flex flex-column gap-3">
              {/* License utilization */}
              <div>
                <div className="d-flex justify-content-between text-secondary small mb-1">
                  <span>Average Utilization Weight (40%)</span>
                  <span className="text-white">{data?.healthBreakdown?.savings_score || 0} / 40</span>
                </div>
                <div className="progress bg-secondary" style={{ height: '6px' }}>
                  <div className="progress-bar bg-success" style={{ width: `${((data?.healthBreakdown?.savings_score || 0)/40)*100}%` }}></div>
                </div>
              </div>

              {/* Budget adherence */}
              <div>
                <div className="d-flex justify-content-between text-secondary small mb-1">
                  <span>Budget Limit Adherence (30%)</span>
                  <span className="text-white">{data?.healthBreakdown?.budget_score || 0} / 30</span>
                </div>
                <div className="progress bg-secondary" style={{ height: '6px' }}>
                  <div className="progress-bar bg-primary" style={{ width: `${((data?.healthBreakdown?.budget_score || 0)/30)*100}%` }}></div>
                </div>
              </div>

              {/* Overlap score */}
              <div>
                <div className="d-flex justify-content-between text-secondary small mb-1">
                  <span>Portfolio Cleanliness Index (30%)</span>
                  <span className="text-white">{data?.healthBreakdown?.spending_mix_score || 0} / 30</span>
                </div>
                <div className="progress bg-secondary" style={{ height: '6px' }}>
                  <div className="progress-bar bg-info" style={{ width: `${((data?.healthBreakdown?.spending_mix_score || 0)/30)*100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="text-muted small mt-3" style={{ fontSize: '0.75rem' }}>
              Portfolios are evaluated based on software overlaps, subscription budgets, and licensing feature utilization rates.
            </div>
          </div>
        </div>
      </div>

      {/* Details: Insights & Recommendations Grid */}
      <div className="row g-4">
        {/* Insights Column */}
        <div className="col-md-6">
          <div className="glass-card p-4" style={{ minHeight: '300px' }}>
            <h5 className="text-white mb-4 d-flex align-items-center gap-2">
              <ShieldAlert size={18} className="text-warning" />
              Billing Anomalies & Cost Audits
            </h5>
            {data?.insights && data.insights.length > 0 ? (
              <ul className="list-group list-group-flush bg-transparent">
                {data.insights.map((insight, idx) => (
                  <li key={idx} className="list-group-item bg-transparent text-white-50 border-color py-3 px-0 d-flex align-items-start gap-2">
                    <span className="btn-grad rounded-circle p-1 d-inline-flex mt-1" style={{ width: '8px', height: '8px' }}></span>
                    <span className="small">{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-5 text-muted small">
                No billing anomalies or overlapping software licenses found.
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Column */}
        <div className="col-md-6">
          <div className="glass-card p-4" style={{ minHeight: '300px' }}>
            <h5 className="text-white mb-4 d-flex align-items-center gap-2">
              <Lightbulb size={18} className="text-success" />
              Actionable License Optimization Tips
            </h5>
            {data?.recommendations && data.recommendations.length > 0 ? (
              <ul className="list-group list-group-flush bg-transparent">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="list-group-item bg-transparent text-white-50 border-color py-3 px-0 d-flex align-items-start gap-2">
                    <span className="btn-grad rounded-circle p-1 d-inline-flex mt-1" style={{ background: 'var(--grad-success)', width: '8px', height: '8px' }}></span>
                    <span className="small">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-5 text-muted small">
                Add active software licenses to compile optimization recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
