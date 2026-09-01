// frontend/src/components/SubscriptionCard.jsx
import React from 'react';
import './SubscriptionCard.css';

const SubscriptionCard = ({ 
  plan, 
  isActive, 
  onSubscribe, 
  isFeatured = false,
  isBest = false
}) => {
  const { key, name, price, unit, duration, features, badge, status } = plan;

  return (
    <div className={`plan-card ${isActive ? 'active' : ''}`}>
      <div className="plan-top">
        <div>
          <span className="plan-label">{name}</span>
          <h4>{key === 'basic' ? 'برای شروع حضور کسب‌وکار در لوکاوو' : 
               key === 'pro' ? 'برای کسب‌وکارهایی که می‌خواهند بیشتر دیده شوند' : 
               'برای کسب‌وکارهایی که مشتری بیشتری می‌خواهند'}</h4>
        </div>
        {isFeatured && <span className="featured-badge">پیشنهاد ویژه</span>}
        {isBest && <span className="status-pill processing"><span className="d" /> کامل‌ترین</span>}
        {status && <span className={`status-pill ${status}`}>{status}</span>}
      </div>

      <div className="plan-price">
        <strong>{price.toLocaleString('fa-IR')}</strong>
        <span>{unit}</span>
      </div>

      <div className="plan-features">
        {features.map((feature, index) => (
          <div key={index}>✓ {feature}</div>
        ))}
      </div>

      <button
        className={`plan-btn ${isActive ? 'ghost-btn' : 'primary-btn'}`}
        disabled={isActive}
        onClick={() => onSubscribe(plan.key)}
      >
        {isActive ? 'اشتراک فعال شما' : 'فعال‌سازی اشتراک'}
      </button>
    </div>
  );
};

export default SubscriptionCard;